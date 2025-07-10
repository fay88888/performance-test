import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';

const STATIC_SERVER_KEY = 'a2V5MDYwYTA4NDMtZjRiNi00YTJmLWIzYTMtM2ZkYTE3ZGM5MzJj';
const STATIC_CLIENT_ID = 'Y2lkOTQ2YzhiMjYtZjdkNy00NmYzLTk1YmUtZjcxMDAzZDQ1YjI4';
const STATIC_USERID = 'b6cbf1f6-d469-4973-8e77-9fc25724da5e';


/*const users = new SharedArray('userData', () =>
  open('./log_detail48.csv')
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const columns = line.split(',');
      if (columns.length >= 7) {
        return {
          documentId: columns[5].trim(),
          signId:columns[6].trim(),
        };
      } else {
        console.warn('⚠️ Baris tidak lengkap, dilewati:', line);
        return null;
      }
    })
    .filter(Boolean) // hapus nilai null dari mapping
);*/

const users = new SharedArray('userData', () => {
  const lines = open('./userlog_1000.csv')
    .split('\n')
    .map(line => line.replace('\r', ''))
    .slice(1)
    .filter(line => line.trim() !== '');

  const seen = new Set();

  let valid = 0;
  let skipped = 0;
  let duplicates = 0;

  return lines
    .map(line => {
      const columns = line.split(',');
      if (columns.length >= 6) {
        const docId = columns[4].trim();
        const signId = columns[5].trim();

        if (!seen.has(docId)) {
          seen.add(docId);
          valid++;
          return { documentId: docId, signId: signId };
        } else {
          console.warn(`⚠️ Duplikat documentId ditemukan: ${docId}`);
          duplicates++;
        }
      } else {
        console.warn('⚠️ Baris tidak lengkap, dilewati:', line);
        skipped++;
      }
      return null;
    })
    .filter(Boolean);
});

/*export const options = {
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

  const user = users[Math.floor(Math.random() * users.length)];*/


const totalUsers = users.length;
const vus = 1002;
const iterations = Math.ceil(totalUsers / vus); // ⏱ Hitung berdasarkan jumlah data

export const options = {
  scenarios: {
    tandaDokumen: {
      executor: 'per-vu-iterations',
      vus: vus,
      iterations: iterations
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
     pdfPassword: null,
     documentId: user.documentId,
     otp: "000000",
        signatureData: [
            {
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
                specimenId: "df83bb17-add6-4677-89d6-395d2e5d2965"
    }
    ],
        location: "Surabaya",
        reason: "I Approve this"
}
  });

 //console.log(payload);
  const res = http.post('https://apionprem.mesign.id/api/v1/signing/usersign', payload, {
    headers,
    timeout: '180s',
  });

  check(res, {
    'status 200': r => r.status === 200,
    'under 10s': r => r.timings.duration < 10000,
  });

 
if (res.status === 200) {
  try {
    const responseJson = res.json();
    const message = responseJson?.message || '';

    console.log(`msg=${res.status},${res.timings.duration},"${message}"`);
  } catch (e) {
    console.log(`msg=${res.status},${res.timings.duration},"ParseError"`);
    console.error('Gagal parse JSON:', res.body);
  }
} else {
  console.log(`msg=${res.status},${res.timings.duration},"Failed"`);
  console.error('Respon gagal dengan status:', res.status);
  console.error('Body respons:\n' + res.body);
}

  sleep(Math.random() * 2);
}

