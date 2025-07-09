import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';

const STATIC_SERVER_KEY = 'a2V5MDYwYTA4NDMtZjRiNi00YTJmLWIzYTMtM2ZkYTE3ZGM5MzJj';
const STATIC_CLIENT_ID = 'Y2lkOTQ2YzhiMjYtZjdkNy00NmYzLTk1YmUtZjcxMDAzZDQ1YjI4';
const STATIC_USERID = 'b6cbf1f6-d469-4973-8e77-9fc25724da5e';

const users = new SharedArray('userData', () =>
  open('./log_summary.csv')
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const columns = line.split(',');
      if (columns.length >= 6) {
        return {
          documentId: columns[5].trim(),
        };
      } else {
        console.warn('⚠️ Baris tidak lengkap, dilewati:', line);
        return null;
      }
    })
    .filter(Boolean) // hapus nilai null dari mapping
);

export const options = {
  vus: 1,
  duration: '1s',
  thresholds: {
    http_req_duration: ['p(95)<=10000'],
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
  const emailMd5 = crypto.md5('starry.admin@yopmail.com', 'hex');
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
 // console.log(payload);
  const res = http.post('https://apionprem.mesign.id/api/v1/signing/document/detailpdf', payload, {
    headers,
    timeout: '1s',
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

      //console.log('Response JSON:\n' + JSON.stringify(responseJson, null, 2));

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