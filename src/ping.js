import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';

// open file hanya boleh di init stage
const base64Pdf = open('./document.b64');

// Load data dari usr.csv
const users = new SharedArray('user data', () => {
  return open('./user.csv')
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '')
    .map((line, index) => {
      const parts = line.split(',');
      if (parts.length <4) {
        console.error(`❌ Baris ke-${index + 2} tidak valid:`, line);
        return null;
      }

      const [email, clientId, serverKey, base64specimen] = parts;

      return {
        email: email.trim(),
        clientId: clientId.trim(),
        serverKey: serverKey.trim(),
        base64specimen: base64specimen.trim(),
       
      };
    })
    .filter(user => user !== null);
});

export const options = {
  vus: users.length,
  duration: '5s',
};

export default function () {
  const user = users[__VU % users.length];
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const emailMd5 = crypto.md5(user.email, 'hex');
  const rawSignature = user.clientId + emailMd5 + timestamp;
  const signature = crypto.sha256(rawSignature, 'hex');

  const payload = JSON.stringify({
    pdfName: 'k6-initsign-test.pdf',
    pdfPassword: null,
    reason: 'Example signing via k6',
    otp: '000000',
    signingType: 'single',
    location: 'Surabaya',
    deleteExistSign: false,
    paidAllSign: false,
    base64specimen: user.base64specimen,
    signatureData: [
      { specimenShow: false, specimenType: 'signature' },
    ],
    base64Pdf: base64Pdf,
  });

  const headers = {
    'Content-Type': 'application/json',
    'X-Server-Key': user.serverKey,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
    'User-Agent': 'k6-load-test',
  };

  const res = http.post('https://devapi.mesign.id/api/signing/initsign', payload, { headers });

  check(res, {
    '✅ status 200': (r) => r.status === 200,
  });

  console.log(`📨 ${user.email} → ${res.status}`);
  console.log('📦 Response:', res.body);
  console.log(`🔎 clientId: ${user.clientId}`);
console.log(`🔎 email: ${user.email}`);
console.log(`🔎 serverKey: ${user.serverKey}`);

  sleep(1);
}