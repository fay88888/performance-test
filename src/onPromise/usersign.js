import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';

const STATIC_SERVER_KEY = 'a2V5ZTM2ZjIzYjAtMTIyYS00MTU3LWJmMTEtZWU1NzYyNGZhYjE5';
const STATIC_CLIENT_ID = 'Y2lkNjU0NTZlZWMtNjQ5Yy00MTgyLTlhNzUtNDAzMWEyMmFjNjc3';
const STATIC_USERID = '29367fb4-e2cd-4eab-aa58-20fd360fff0c';

// 🧩 Ambil documentId dan signId unik dari CSV
const users = new SharedArray('userData', () => {
  const lines = open('./detlog5.csv')
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '');

  const seen = new Set();
  return lines
    .map(line => {
      const columns = line.split(',');
      if (columns.length >= 6) {
        const docId = columns[4].trim();
        const signId = columns[5].trim();
        const key = `${docId}|${signId}`;
        if (!seen.has(key)) {
          seen.add(key);
          return { documentId: docId, signId: signId };
        }
      } else {
        console.warn('⚠️ Baris tidak lengkap, dilewati:', line);
      }
      return null;
    })
    .filter(Boolean);
});

const totalUsers = users.length;
const vus = 117;
const iterations = Math.ceil(totalUsers / vus);

export const options = {
  scenarios: {
    tandaDokumen: {
      executor: 'per-vu-iterations',
      vus,
      iterations,
    },
  },
};

export default function signingFlow() {
  const userIndex = (__VU - 1) * iterations + __ITER;

  if (userIndex >= totalUsers) {
    console.log(`📦 Semua documentId sudah habis untuk VU ${__VU}, iterasi ${__ITER}`);
    return;
  }

  const user = users[userIndex];
  const timestamp = Date.now().toString();
  const epochTime = parseInt(timestamp, 10);
  const emailMd5 = crypto.md5('faiqotul.annisa@esign.id', 'hex');
  const signature = crypto.sha256(STATIC_CLIENT_ID + emailMd5 + timestamp, 'hex');

  const headers = {
    'Content-Type': 'application/json',
    'X-Server-Key': STATIC_SERVER_KEY,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  };

  const payload = JSON.stringify({
    idUser: STATIC_USERID,
    epochTime: epochTime,
    data: {
      pdfPassword: null,
      documentId: user.documentId,
      otp: "000000",
      signatureData: [{
        id: user.signId,
        x: 150.0,
        y: 200.0,
        height: 50.0,
        width: 150.0,
        page: 1,
        docWidth: 347.84978200554895,
        docHeight: 491.66666666666663,
        offset: "270, 340",
        focalPoint: "229.0, 392.0",
        scale: 0.3,
        scaleWeb: 1.0,
        specimenType: "signature",
        moveable: false,
        specimenId: "debab59c-03fd-411a-a88b-58007d3e274c"
      }],
      location: "Surabaya",
      reason: "I Approve this"
    }
  });
  
  const res = http.post('https://apionprem.mesign.id/api/v1/signing/usersign', payload, {
   // const res = http.post('https://cloudapi.ezsign.id/api/v1/signing/usersign', payload, {
    headers,
    timeout: '180s',
  });

  check(res, {
  'status 200': r => r.status === 200,
  'under 50s': r => r.timings.duration < 50000,
});


  if (!res || res.status === 0) {
  console.log(`${res.status},${res.timings.duration},"No Response"`);
  console.error(`❌ ${user.documentId} gagal: Tidak ada respons atau timeout`);
  console.error(`Body:\n${res.body}`);
  console.log("---------------------------------------------------------------------------------------");
  console.log(payload);
  console.log("---------------------------------------------------------------------------------------");
} else if (res.status === 200) {
  let message = '';

  try {
    const responseJson = res.json();
    message = responseJson?.message || 'Success';
    const documentId = responseJson?.data?.documentId || '';

    console.log(`${res.status},${res.timings.duration},"${message}","${documentId}"`);
    //console.log(`${res.body}`);
  } catch (e) {
    console.log(`${res.status},${res.timings.duration},"ParseError","${documentId}",""`);
    console.error('❌ Gagal parse JSON:', res.body);
  }
} else {
  console.log(`${res.status},${res.timings.duration},"Failed","${documentId}",""`);
  console.error(`❌ Respon gagal dengan status: ${res.status}`);
  console.error(`📄 Body respons:\n${res.body}`);
}

sleep(Math.random() * 2);
 }