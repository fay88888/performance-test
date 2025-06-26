import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';

const base64Pdf = open('./document.b64');

const users = new SharedArray('userData', () =>
  open('./user.csv')
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const [email, clientId, serverKey, base64specimen, userid, specimenId, pdfName, otp, location] = line.split(',');
      return {
        email: email.trim(),
        clientId: clientId.trim(),
        serverKey: serverKey.trim(),
        base64specimen: base64specimen.trim(),
        userid: userid.trim(),
        specimenId: specimenId.trim(),
        pdfName: pdfName.trim(),
        otp: otp.trim(),
        location: location.trim()
      };
    })
);

export const options = {
  vus: users.length,
  iterations: users.length,
};

export default function () {
  const user = users[__VU - 1];
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const emailMd5 = crypto.md5(user.email, 'hex');
  const signature = crypto.sha256(user.clientId + emailMd5 + timestamp, 'hex');

  const headers = {
    'Content-Type': 'application/json',
    'X-Server-Key': user.serverKey,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  };

  const payload = JSON.stringify({
    idUser: user.userid,
    epochTime: Number(timestamp),
    data: {
      pdfName: user.pdfName,
      pdfPassword: null,
      reason: "I Approve this",
      otp: user.otp,
      signingType: "single",
      location: user.location,
      deleteExistSign: false,
      paidAllSign: false,
      signatureData: [
        {
          x: 280,
          y: 350,
          width: 75,
          height: 50,
          page: 1,
          specimenId: user.specimenId,
          specimenType: "signature",
          addDetail: false,
          docWidth: 347.84978200554895,
          docHeight: 491.66666666666663
        }
      ],
      base64Pdf: base64Pdf,
      base64specimen: user.base64specimen
    }
  });

  const res = http.post('https://apionprem.mesign.id/api/v1/signing/initsign', payload, { headers });

  check(res, {
    '✅ status 200': r => r.status === 200,
  });

  console.log(`📨 ${user.email} → status: ${res.status}`);
  sleep(1);
}