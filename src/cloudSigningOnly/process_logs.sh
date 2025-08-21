#!/bin/bash

# 1. Buat folder jika belum ada
mkdir -p src/cloudSigningOnly

# 2. Jalankan k6 dan simpan output ke file
k6 run src/cloudSigningOnly/initsign.js > src/cloudSigningOnly/produser_log.txt 2>&1

# 3. Gabungkan baris log yang terpotong
combined=()
while IFS= read -r line; do
  if [[ "$line" =~ msg=\"[^\"]*$ ]]; then
    read -r nextLine
    line="$line$nextLine"
  fi
  combined+=("$line")
done < src/cloudSigningOnly/produser_log.txt

# 4. Proses dan filter log
output="user.email,user.referenceId,res.status,res.timings.duration,message,documentId"
for line in "${combined[@]}"; do
  if [[ "$line" == *msg=* ]]; then
    echo "Processing line: $line"

    cleanLine=$(echo "$line" | sed 's/\\//g' | sed 's/source=console//g')
    msgPart=$(echo "$cleanLine" | grep -o 'msg=.*' | sed 's/msg=//' | tr -d '"')
    IFS=',' read -ra fields <<< "$msgPart"

    if [[ ${#fields[@]} -lt 6 ]]; then
      echo "❌ Skipped (kurang field): ${fields[*]}"
      continue
    fi

    email=$(echo "${fields[0]}" | xargs)
    refId=$(echo "${fields[1]}" | xargs)
    status=$(echo "${fields[2]}" | xargs)
    duration=$(echo "${fields[3]}" | xargs)
    message=$(echo "${fields[4]}" | xargs)
    docId=$(echo "${fields[5]}" | xargs)

    output+="\n$email,$refId,$status,$duration,$message,$docId"
  fi
done

# 5. Simpan ke CSV
echo -e "$output" > src/cloudSigningOnly/produser_log.csv