import fs from "fs";

// HEADER TETAP LENGKAP
const header = [
  "epochTime",
  "email",
  "name",
  "nik",
  "birthDate",
  "birthPlace",
  "verificationMode",
  "selfiePhoto",
  "pid"
];

// GENERATE ROW TANPA epochTime, selfiePhoto, pid
function generateRows(total) {
  const rows = [];

  for (let i = 0; i < total; i++) {
    rows.push([
      `bintang.users${i + 1}@yopmail.com`,
      `Bintang Regis ${100 + i}`,
      String(3000000000000000 + i),
      "01-01-2001",
      "Surabaya",
      "0"
    ]);
  }

  return rows;
}

// CONVERT KE CSV
function toCsv(header, rows) {
  const csvRows = rows.map(r => r.join(","));
  return [header.join(","), ...csvRows].join("\n");
}

// RUN
const TOTAL_DATA = 15000;
const rows = generateRows(TOTAL_DATA);
const csv = toCsv(header, rows);

fs.writeFileSync("users_random_15000.csv", csv);

console.log("✅ CSV dibuat: epochTime, selfiePhoto, pid kosong");
console.log(`📊 Total data: ${TOTAL_DATA}`);
