import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

const base64Pdf = open('../document.b64');

const users = new SharedArray('userData', () =>
  open('./produser.csv')
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const [email, serverKey, clientId, userid, specimenId, pdfName, location, referenceId] = line.split(',');
      return {
        email: email.trim(),
        clientId: clientId.trim(),
        serverKey: serverKey.trim(),
        userid: userid.trim(),
        specimenId: specimenId.trim(),
        pdfName: pdfName.trim(),
        location: location.trim(),
        referenceId: referenceId.trim()
      };
    })
);

export const options = {
  stages: [
    { duration: '10s', target: 50 },   // Naik perlahan ke 50 VU
    { duration: '20s', target: 200 },  // Tambah beban ke 200 VU
    { duration: '30s', target: 400 },  // Push ke 400 VU
    { duration: '10s', target: 0 },    // Pendinginan sistem
  ],
  thresholds: {
    http_req_duration: ['p(95)<=10000'], // 95% permintaan < 10 detik
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export default function signingFlow() {
  if (!users || users.length === 0) {
    console.error(`Tidak ada user untuk VU ${__VU}`);
    return;
  }

  const user = users[Math.floor(Math.random() * users.length)];
  const timestamp = Date.now().toString();
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
      otp: '000000',
      signingType: 'single',
      location: user.location,
      deleteExistSign: true,
      paidAllSign: false,
      reason: 'I Approve this',
      signatureData: [{
        x: 280,
        y: 350,
        width: 75,
        height: 50,
        page: 1,
        specimenId: user.specimenId,
        specimenType: 'signature',
        addDetail: false,
        docWidth: 347.84978200554895,
        docHeight: 491.66666666666663
      }],
      userList: [],
      base64Pdf: base64Pdf,
    },
  });

  const res = http.post('https://cloudapi.ezsign.id/api/v1/signing/initsign', payload, {
    headers,
    timeout: '180s',
  });

  check(res, {
    'status 200': r => r.status === 200,
    'under 50s': r => r.timings.duration < 50000,
  });

  if (res.status === 200) {
    let documentId = '';
    let message = '';

    try {
      const responseJson = res.json();
      message = responseJson?.message || '';
      documentId = responseJson?.data?.documentId || '';
    } catch (e) {
      message = 'ParseError';
    }

    console.log(`${user.email},${res.status},${res.timings.duration},"${message}","${documentId}"`);
  } else {
    console.error(`${user.email} gagal: status ${res.status} - ${res.status_text}`);
  }

  if (res.timings.duration >= 10000) {
    console.warn(`${user.email} lambat: ${res.timings.duration}ms`);
  }

  if (!res || res.status === 0) {
    console.error(`${user.email} gagal: request timeout atau tidak ada respons`);
  }

  sleep(Math.random() * 2); // Delay acak 0–2 detik
}