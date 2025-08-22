import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 500,
  iterations: 500,
};

export default function () {
  const url = 'https://apionprem.mesign.id/api/v1/signing/get-session';

  const headers = {
    'X-Server-Key': 'a2V5ZDQwNWRjZjMtM2JmNi00Yzk4LTk4NDctNmIxMWY2MjhkNzZl',
    'X-Signature': 'a15908658e92928fa55693c834168f97814f54e29916433727b78de2b7b797e4',
    'Content-Type': 'application/json',
  };

  const payload = JSON.stringify({
    idUser: 'f46c88f6-fe74-4c52-ae23-2632c7ee09e9',
    epochTime: 1755842768,
    data: {
      otp: '000000',
      pdfName: 'Test Pdf.pdf',
      signatureData: [
        {
          x: 280,
          y: 350,
          width: 75,
          height: 50,
          page: 1,
          specimenType: 'signature',
        },
      ],
    },
  });

  const res = http.post(url, payload, { headers });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  let message = '';
  let sessionId = '';
  let fileId = '';

  if (res.status === 200) {
    try {
      const json = res.json();
      message = json.message || '';
      sessionId = json.data?.sessionId || '';
      fileId = json.data?.fileId || '';
    } catch {
      message = 'ParseError';
    }
    console.log(`${res.status},${res.timings.duration},"${message}","${sessionId}","${fileId}"`);
  } else {
    console.error(`Request failed with status: ${res.status}`);
  }

  sleep(1);
}
