import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';

const STATIC_SERVER_KEY = 'a2V5ZTM2ZjIzYjAtMTIyYS00MTU3LWJmMTEtZWU1NzYyNGZhYjE5';
const STATIC_CLIENT_ID = 'Y2lkNjU0NTZlZWMtNjQ5Yy00MTgyLTlhNzUtNDAzMWEyMmFjNjc3';
const STATIC_USERID = '29367fb4-e2cd-4eab-aa58-20fd360fff0c';

const users = new SharedArray('userData', () => {
  const lines = open('./runuser.csv')
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '');

  const seen = new Set();

  return lines
    .map(line => {
      const columns = line.split(',');
      if (columns.length >= 6) {
        const docId = columns[5].trim();
        if (!seen.has(docId)) {
          seen.add(docId);
          return { documentId: docId };
        }
      } else {
        console.warn('⚠️ Baris tidak lengkap, dilewati:', line);
      }
      return null;
    })
    .filter(Boolean);
});

const totalUsers = users.length;
const vus = 1;
const iterations = Math.ceil(totalUsers / vus); // ⏱ Hitung berdasarkan jumlah data

export const options = {
  scenarios: {
    tandaDokumen: {
      executor: 'per-vu-iterations',
      vus: vus,
      iterations: iterations,
    }
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
    epochTime: Number(timestamp),
    data: {
      documentId: user.documentId,
    },
  });

  //const res = http.post('https://apionprem.mesign.id/api/v1/signing/document/detailpdf', payload, {
    const res = http.post('https://cloudapi.ezsign.id/api/v1/signing/document/detailpdf', payload, {
    headers,
    timeout: '11s',
  });

  check(res, {
    'status 200': r => r.status === 200,
    'under 10s': r => r.timings.duration < 10000,
  });

  if (res.status === 200) {
    try {
      const responseJson = res.json();
      const message = responseJson?.message || '';
      const documentId = responseJson?.data?.documentId || '';
      const signId = responseJson?.data?.sign?.signData?.[0]?.id || '';

      console.log(`${STATIC_USERID},${res.status},${res.timings.duration},"${message}","${documentId}","${signId}"`);
    } catch (e) {
      console.log(`${STATIC_USERID},${res.status},${res.timings.duration},"ParseError","",""`);
      console.error('Gagal parse JSON:', res.body);
    }
  } else {
    console.log(`${STATIC_USERID},${res.status},${res.timings.duration},"Failed","",""`);
    console.error('Respon gagal dengan status:', res.status);
    console.error('Body respons:\n' + res.body);
  }

  sleep(Math.random() * 2);
}
