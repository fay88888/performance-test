import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';

// Membaca file base64 specimen (misalnya tanda tangan paraf)
const base64Seal = open('./seal.b64');

// Membaca user.csv dengan hanya empat kolom
const users = new SharedArray('userData', () =>
  open('../user-sysadmin.csv')
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const [email, serverKey, clientId, userid] = line.split(',');
      return {
        email: email.trim(),
        serverKey: serverKey.trim(),
        clientId: clientId.trim(),
        userid: userid.trim(),
      };
    })
);

export const options = {
  vus: 200,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<=10000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export default function updateSpecimenFlow() {
  const user = users[Math.floor(Math.random() * users.length)];
  const timestamp = Date.now().toString();
  const emailMd5 = crypto.md5(user.email, 'hex');
  console.log('client-Id:',user.clientId )
  const signature = crypto.sha256(user.clientId + emailMd5 + timestamp, 'hex');
  // Logging setiap 5 iterasi
if (__ITER % 5 === 0 && __ITER !== 0) {
  const currentTime = new Date().toLocaleTimeString();
  console.log(`[${currentTime}] VU ${__VU} telah menyelesaikan ${__ITER} iterasi`);
  }

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
      base64Seal: base64Seal,
    }
  });

  const res = http.post('https://apionprem.mesign.id/api/v1/core/seal/update', payload, {
    headers,
    timeout: '15s',
  });

  check(res, {
    'status 200': r => r.status === 200,
    'under 10s': r => r.timings.duration < 10000,
  });

  if (res.status !== 200) {
    console.error(`${user.email} gagal: status ${res.status} - ${res.status_text}`);
  }

  if (!res || res.status === 0) {
    console.error(`${user.email} gagal: timeout atau tidak ada respons`);
  }

  sleep(Math.random() * 2);
}