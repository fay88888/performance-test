import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';
// import { createHash } from 'https://jslib.k6.io/hash/1.0.0/index.js';

const base64Pdf = open('../document.b64');

const users = new SharedArray('userData', () =>
  open('./usersigningonly.csv')
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const [email, serverKey,clientId, userid, specimenId, pdfName, location, referenceId] = line.split(',');
      return {
        email: email.trim(),
        clientId: clientId.trim(),
        serverKey: serverKey.trim(),
        userid: userid.trim(),
        specimenId: specimenId.trim(),
        pdfName: pdfName.trim(),
        location: location.trim(),
        referenceId:referenceId.trim()
      };
    })
);

export const options = {
  vus: 1,                  // Jumlah virtual user aktif
  duration: '10s',         // Total waktu pengujian
  thresholds: {
    http_req_duration: ['p(95)<=10000'], // 95% request < 10 detik
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export default function signingFlow() {

  if (!users) {
  console.error(`Tidak ada user untuk VU ${__VU}`);
  return;
}



  const user = users[Math.floor(Math.random() * users.length)];
  // console.log(user);
  const timestamp = Date.now().toString();
  const emailMd5 = crypto.md5(user.email, 'hex');
  console.log('client-Id:',user.clientId )
  const signature = crypto.sha256(user.clientId + emailMd5 + timestamp, 'hex');


  // const timestamp = Math.floor(Date.now() / 1000).toString();
  // const emailMd5 = crypto.md5(user.email, 'hex');
  // console.log(emailMd5);
  // const signature = crypto.sha256(user.clientId + emailMd5 + timestamp, 'hex');

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
    signingType: "hierarchy",
    location: user.location,
    deleteExistSign: true,
    paidAllSign: false,
    signatureData: [],
    userList: [
      {
        referenceId: user.referenceId, // Make sure this exists in your `user` object
        expiryDate: "14/10/2025 06:30:00" ,  // Also from `user`, example: "14/10/2025 06:30:00"
        signatureData: [
          {
            x: 100,
            y: 330,
            width: 150,
            height: 50,
            page: 1,
            specimenType: "signature",
            docWidth: 347.84978200554895,
            docHeight: 491.66666666666663,
          },
        ],
        role: ["signer"],
      },
    ],
    base64Pdf: base64Pdf,
  },
});
  

  const res = http.post('https://apionprem.mesign.id/api/v1/signing/initsign', payload, {
  headers,
  timeout: '11s'  // Batasi waktu maksimum untuk 1 request
});

  check(res, {
  'status 200': r => r.status === 200,
  'under 10s': r => r.timings.duration < 10000,});

  // console.log(res);

if (res.status !== 200) {
  console.error(`${user.email} gagal: status ${res.status} - ${res.status_text}`);
}

if (res.timings.duration >= 10000) {
  console.warn(`${user.email} lambat: ${res.timings.duration}ms`);
}
if (!res || res.status === 0) {
  console.error(`${user.email} gagal: request timeout atau tidak ada respons`);
}
sleep(Math.random() * 2); // Delay 0–2 detik
}