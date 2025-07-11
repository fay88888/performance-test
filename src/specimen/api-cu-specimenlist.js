import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';

// Membaca CSV: email, serverKey, clientId, userid
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
  vus: 4,
  duration: '30s',
};

export default function () {
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
    data: null,
  });

  const res = http.post('https://apionprem.mesign.id/api/v1/core/specimen/list', payload, {
    headers,
    timeout: '15s',
  });

  check(res, {
    'status 200': r => r.status === 200,
    'under 10s': r => r.timings.duration < 10000,
  });

  if (res.status !== 200) {
    console.error(`${user.email} gagal: status ${res.status} - ${res.status_text}`);
    //console.error(`Body: ${res.body}`);
  }
  sleep(1);
}