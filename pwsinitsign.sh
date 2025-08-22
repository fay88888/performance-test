#!/bin/bash
mkdir -p src/proddrcload
k6 run src/proddrcload/initsign.js > src/proddrcload/produser_log555.txt 2>&1

combined_log="src/proddrcload/combined_log555.txt"
> "$combined_log"

while IFS= read -r line || [ -n "$line" ]; do
  if [[ "$line" =~ msg=\"[^\"]*$ ]]; then
    read -r next_line || true
    line="$line$next_line"
  fi
  echo "$line" >> "$combined_log"
done < src/proddrcload/produser_log555.txt

output_csv="src/proddrcload/produser_log555.csv"
echo "user.email,user.referenceId,res.status,res.timings.duration,message,documentId" > "$output_csv"

grep 'msg=' "$combined_log" | while IFS= read -r line; do
  clean_line=$(echo "$line" | sed 's/\\//g' | sed 's/source=console//g')
  msg_part=$(echo "$clean_line" | awk -F'msg=' '{print $2}' | tr -d '"')
  IFS=',' read -ra fields <<< "$msg_part"

  if [ "${#fields[@]}" -lt 6 ]; then
    echo "❌ Skipped (kurang field): ${fields[*]}"
    continue
  fi

echo "${fields[0]},${fields[1]},${fields[2]},${fields[3]},${fields[4]},${fields[5]}" >> "$output555_csv"
done
