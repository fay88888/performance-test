import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';

// Load data dari CSV
const users = new SharedArray('userData', () =>
  open('./adduser.csv')
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const [email, serverKey, clientId, departmentId, userId] = line.split(',');
      return {
        email: email.trim(),
        serverKey: serverKey.trim(),
        clientId: clientId.trim(),
        departmentId: departmentId.trim(),
        userId: userId.trim(),
      };
    })
);

export const options = {
  vus: 1,
  duration: '1s',
  thresholds: {
    http_req_duration: ['p(95)<=10000'],
  },
};

export default function () {
  const user = users[Math.floor(Math.random() * users.length)];
  const timestamp = Date.now().toString();
  const emailMd5 = crypto.md5(user.email.toLowerCase(), 'hex');
  const signature = crypto.sha256(user.clientId + emailMd5 + timestamp, 'hex');
console.log('Input signature:', user.clientId + emailMd5 + timestamp);
console.log('Signature:', signature);

  const headers = {
    'Content-Type': 'application/json',
    'X-Server-Key': user.serverKey,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  };

  const body = JSON.stringify({
    idUser: user.userId,
    epochTime: Math.floor(Date.now() / 1000),
    data: {
      email: user.email,
      departmentId: user.departmentId,
      isSubscriber: false,
      isSealer: true,
      isStamper: true,
      isEmeterai: true,
    },
  });

  const res = http.post('https://apionprem.mesign.id/api/v1/core/corporate/adduser', body, {
    headers: headers,
    timeout: '20s',
  });

  check(res, {
    'status 200': (r) => r.status === 200,
    'waktu < 10 detik': (r) => r.timings.duration < 10000,
  });

  if (res.status !== 200) {
    console.error(`${user.email} gagal: status ${res.status} - ${res.status_text}`);
  }

  sleep(Math.random() * 2);
}