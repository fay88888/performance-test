# performance-test
# performance-test
# performance-test
Untuk run log dan masukan kedalam .txt
New-Item -ItemType Directory -Path src/apisigningonly -Force

k6 run src/apisigningonly/apisigningonly.js > src/apisigningonly/hasil_log.txt 2>&1

Get-Content src/apisigningonly/hasil_log.txt |
  Where-Object { $_ -like '*msg=*' } |
  ForEach-Object {
    $_ = $_ -replace '\\', ''
 $_ = $_ -replace 'source=console',''

    $f = ($_ -split 'msg=')[1] -replace '"', '' -split ','

    [PSCustomObject]@{
      'user.email'           = $f[0]
      'user.referenceId'     = $f[1]
      'res.status'           = $f[2]
      'res.timings.duration' = $f[3]
      'message'              = $f[4]
      'documentId'           = $f[5].Trim()

    }
  } |
  Export-Csv src/apisigningonly/log_summary.csv -NoTypeInformation -Encoding utf8

  ________________________________________________________
  powershell menjadikan csv tanpa petik --- log summary
  
New-Item -ItemType Directory -Path src/apisigningonly -Force
k6 run src/apisigningonly/apisigningonly.js > src/apisigningonly/hasil_log.txt 2>&1

Get-Content src/apisigningonly/hasil_log.txt |
  Where-Object { $_ -like '*msg=*' } |
  ForEach-Object {
    $_ = $_ -replace '\\', ''
    $_ = $_ -replace 'source=console',''

    $f = ($_ -split 'msg=')[1] -replace '"', '' -split ','

    if ($f.Count -lt 6) { return }

    [PSCustomObject]@{
      'user.email'            = $f[0].Trim()
      'user.referenceId'      = $f[1].Trim()
      'res.status'            = [int]$f[2].Trim()
      'res.timings.duration'  = [double]$f[3].Trim()
      'message'               = $f[4].Trim()
      'documentId'            = $f[5].Trim()
    }
  } |
  ConvertTo-Csv -NoTypeInformation |
  ForEach-Object { $_ -replace '"', '' } |
  Set-Content src/apisigningonly/log_summary.csv -Encoding UTF8
___________________________________________________________________________________________
  run scrip js kedalam json
  k6 run src/apisigningonly/apisigningonly.js --summary-export=signonly-1vu1s.json  


  __________________________________________________




  Powershell untuk menjadikan ke csv dan tanpa petik --- hasil detail
  New-Item -ItemType Directory -Path src/apisigningonly -Force
>> k6 run src/apisigningonly/apidocumentdetail.js > src/apisigningonly/hasil_det100.txt 2>&1
>> Get-Content src/apisigningonly/hasil_det100.txt |
>>   Where-Object { $_ -like '*msg=*' } |
>>   ForEach-Object {
>>     $_ = $_ -replace '\\', ''
>>     $_ = $_ -replace 'source=console',''
>>
>>     $rawMsg = ($_ -split 'msg=')[1]
>>     $f = $rawMsg -replace '"', '' -split ','
>>
>>     if ($f.Count -lt 6) { return }
>>
>>     [PSCustomObject]@{
>>       referenceId     = $f[0].Trim()
>>       statusCode      = [int]$f[1].Trim()
>>       responseTimeMs  = [double]$f[2].Trim()
>>       message         = $f[3].Trim()
>>       documentId      = $f[4].Trim()
>>       signId          = $f[5].Trim()
>>     }
>>   } |
>>   ConvertTo-Csv -NoTypeInformation |
>>   ForEach-Object { $_ -replace '"' } |
>>   Set-Content src/apisigningonly/log_det100.csv -Encoding UTF8

_________________________________________________________________
Powershell untuk menjadikan ke csv dan tanpa petik --- hasil recipeint
New-Item -ItemType Directory -Path src/apisigningonly -Force
k6 run src/apisigningonly/apirecipient.js > src/apisigningonly/hasil_recip5.txt 2>&1
>> Get-Content src/apisigningonly/hasil_recip5.txt |
>>   Where-Object { $_ -like '*msg=*' } |
>>   ForEach-Object {
>>     $_ = $_ -replace '\\', ''
>>     $_ = $_ -replace 'source=console',''
>> 
>>     $f = ($_ -split 'msg=')[1] -replace '"', '' -split ','
>> 
>>     if ($f.Count -lt 6) { return }
>> 
>>     [PSCustomObject]@{
>>       'user.email'            = $f[0].Trim()
>>       'user.referenceId'      = $f[1].Trim()
>>       'res.status'            = [int]$f[2].Trim()
>>       'res.timings.duration'  = [double]$f[3].Trim()
>>       'message'               = $f[4].Trim()
>>     }
>>   } |
>>   ConvertTo-Csv -NoTypeInformation |
>>   ForEach-Object { $_ -replace '"', '' } |
>>   Set-Content src/apisigningonly/log_recip5.csv -Encoding UTF8

_____________________________________________________
tambahkan add content untuk melanjutkan csv yg sudah ada 
New-Item -ItemType Directory -Path src/apisigningonly -Force
>> k6 run src/apisigningonly/apisigningonly.js > src/apisigningonly/hasil_log5010.txt 2>&1
>> 
>> Get-Content src/apisigningonly/hasil_log5010.txt |
>>   Where-Object { $_ -like '*msg=*' } |
>>   ForEach-Object {
>>     $_ = $_ -replace '\\', ''
>>     $_ = $_ -replace 'source=console',''
>> 
>>     $f = ($_ -split 'msg=')[1] -replace '"', '' -split ','
>> 
>>     if ($f.Count -lt 6) { return }
>> 
>>     [PSCustomObject]@{
>>       'user.email'            = $f[0].Trim()
>>       'user.referenceId'      = $f[1].Trim()
>>       'res.status'            = [int]$f[2].Trim()
          'res.timings.duration' = $f[3].Trim()  # simpan sebagai string
>>       'message'               = $f[4].Trim()
>>       'documentId'            = $f[5].Trim()
>>     }
>>   } |
>>   ConvertTo-Csv -NoTypeInformation |
>>   ForEach-Object { $_ -replace '"', '' } |
>>   Add-Content src/apisigningonly/log_summary5010.csv -Encoding UTF8


atau 


$csvPath = "src/apisigningonly/log_summary5010.csv"

$parsed = Get-Content src/apisigningonly/hasil_log5010.txt |
  Where-Object { $_ -like '*msg=*' } |
  ForEach-Object {
    $_ = $_ -replace '\\', ''
    $_ = $_ -replace 'source=console',''
    $f = ($_ -split 'msg=')[1] -replace '"', '' -split ','

    if ($f.Count -lt 6) { return }

    [PSCustomObject]@{
      'user.email'            = $f[0].Trim()
      'user.referenceId'      = $f[1].Trim()
      'res.status'            = [int]($f[2].Trim())
      'res.timings.duration'  = [double]($f[3].Trim())
      'message'               = $f[4].Trim()
      'documentId'            = $f[5].Trim()
    }
  }

# Convert ke CSV dan skip header baris pertama
if ($parsed.Count -gt 0) {
  $parsed |
    ConvertTo-Csv -NoTypeInformation |
    Select-Object -Skip 1 |  # <--- inilah bagian pentingnya
    ForEach-Object { $_ -replace '"' } |
    Add-Content $csvPath -Encoding UTF8
}


---------------------------------
mendapatkan documentid

# 🔧 Buat folder output jika belum ada
New-Item -ItemType Directory -Path src/proddrcload -Force

# 🚀 Jalankan k6 dan simpan hasilnya ke file log
k6 run src/proddrcload/initsign.js > src/proddrcload/produser_log.txt 2>&1

# 📥 Baca isi file log dan gabungkan baris 'msg' yang terpotong
$logLines = Get-Content src/proddrcload/produser_log.txt
$combined = @()

for ($i = 0; $i -lt $logLines.Count; $i++) {
  $line = $logLines[$i]
  
  # Gabungkan jika baris 'msg=' belum selesai
  if ($line -match 'msg="[^"]*$') {
    if ($i + 1 -lt $logLines.Count) {
      $line += $logLines[$i + 1]
      $i++
    }
  }

  $combined += $line
}

# 📊 Proses baris yang mengandung 'msg=' dan simpan ke CSV
$combined |
  Where-Object { $_ -like '*msg=*' } |
  ForEach-Object {
    Write-Host "Processing line: $($_)"

    $_ = $_ -replace '\\', ''
    $_ = $_ -replace 'source=console', ''

    $fields = ($_ -split 'msg=')[1] -replace '"', '' -split ','

    if ($fields.Count -lt 6) {
      Write-Host "❌ Skipped (kurang field): $fields"
      return
    }

    [PSCustomObject]@{
      'user.email'            = $fields[0].Trim()
      'user.referenceId'      = $fields[1].Trim()
      'res.status'            = [int]$fields[2].Trim()
      'res.timings.duration'  = [double]$fields[3].Trim()
      'message'               = $fields[4].Trim()
      'documentId'            = $fields[5].Trim()
    }
  } |
  ConvertTo-Csv -NoTypeInformation |
  ForEach-Object { $_ -replace '"' , '' } |
  Set-Content src/proddrcload/produser_log.csv -Encoding UTF8 -Force

  ____________________________________
  POWERSHELL untuk Signing DRC PROD
  [12:25, 17/07/2025] Fay: # 🔧 Buat folder output jika belum ada
New-Item -ItemType Directory -Path src/proddrcload -Force

# 🚀 Jalankan k6 dan simpan hasilnya ke file log
k6 run src/proddrcload/initsign.js > src/proddrcload/produser_log.txt 2>&1

# 📥 Baca isi file log dan gabungkan baris 'msg' yang terpotong
$logLines = Get-Content src/proddrcload/produser_log.txt
$combined = @()

for ($i = 0; $i -lt $logLines.Count; $i++) {
  $line = $logLines[$i]
  
  # Gabungkan jika baris 'msg=' belum selesai
  if ($line -match 'msg="[^"]*$') {
    if ($i + 1 -lt $logLines.Count) {
      $line += $logLines[$i + 1]
      $i++
    }
  }

  $combined += $line
}

# 📊 Proses baris yang mengandung 'msg=' dan simpan ke CSV
$combined |
  Where-Object { $_ -like 'msg=' } |
  ForEach-Object {
    Write-Host "Processing line: $($_)"

    $_ = $_ -replace '\\', ''
    $_ = $_ -replace 'source=console', ''

    $fields = ($_ -split 'msg=')[1] -replace '"', '' -split ','

    if ($fields.Count -lt 6) {
      Write-Host "❌ Skipped (kurang field): $fields"
      return
    }

    [PSCustomObject]@{
      'user.email'            = $fields[0].Trim()
      'user.referenceId'      = $fields[1].Trim()
      'res.status'            = [int]$fields[2].Trim()
      'res.timings.duration'  = [double]$fields[3].Trim()
      'message'               = $fields[4].Trim()
      'documentId'            = $fields[5].Trim()
    }
  } |
  ConvertTo-Csv -NoTypeInformation |
  ForEach-Object { $_ -replace '"' , '' } |
  Set-Content src/proddrcload/produser_log.csv -Encoding UTF8 -Force
[12:25, 17/07/2025] Fay: # 🔧 Buat folder output jika belum ada
New-Item -ItemType Directory -Path src/proddrcload -Force

# 🚀 Jalankan k6 dan simpan hasilnya ke file log
k6 run src/proddrcload/detailpdf.js > src/proddrcload/detlog.txt 2>&1

# 📥 Baca isi file log dan gabungkan baris 'msg' yang terpotong
$logLines = Get-Content src/proddrcload/detlog.txt
$combined = @()

for ($i = 0; $i -lt $logLines.Count; $i++) {
  $line = $logLines[$i]
  
  # Gabungkan jika baris 'msg=' belum selesai
  if ($line -match 'msg="[^"]*$') {
    if ($i + 1 -lt $logLines.Count) {
      $line += $logLines[$i + 1]
      $i++
    }
  }

  $combined += $line
}

# 📊 Proses baris yang mengandung 'msg=' dan simpan ke CSV
$combined |
  Where-Object { $_ -like 'msg=' } |
  ForEach-Object {
    Write-Host "Processing line: $($_)"

    $_ = $_ -replace '\\', ''
    $_ = $_ -replace 'source=console', ''

    $fields = ($_ -split 'msg=')[1] -replace '"', '' -split ','
    if ($fields.Count -lt 6) {
      Write-Host "❌ Skipped (kurang field): $fields"
      return
    }

    [PSCustomObject]@{
     'STATIC_USERID'    = $fields[0].Trim()
     'res.status'     = [int]$fields[1].Trim()
     'res.timings.duration' = [double]$fields[2].Trim()
     'message'       = $fields[3].Trim()
     'documentId'     = $fields[4].Trim()
     'signId'        = $fields[5].Trim()
    }
  } |
  ConvertTo-Csv -NoTypeInformation |
  ForEach-Object { $_ -replace '"' , '' } |
  Set-Content src/proddrcload/detlog.csv -Encoding UTF8 -Force
[12:25, 17/07/2025] Fay: # 🔧 Buat folder output jika belum ada
New-Item -ItemType Directory -Path src/proddrcload -Force

# 🚀 Jalankan k6 dan simpan hasilnya ke file log
k6 run src/proddrcload/usersign.js > src/proddrcload/usersignlog.txt 2>&1

# 📥 Baca isi file log dan gabungkan baris 'msg' yang terpotong
$logLines = Get-Content src/proddrcload/usersignlog.txt
$combined = @()

for ($i = 0; $i -lt $logLines.Count; $i++) {
  $line = $logLines[$i]
  
  # Gabungkan jika baris 'msg=' belum selesai
  if ($line -match 'msg="[^"]*$') {
    if ($i + 1 -lt $logLines.Count) {
      $line += $logLines[$i + 1]
      $i++
    }
  }

  $combined += $line
}

# 📊 Proses baris yang mengandung 'msg=' dan simpan ke CSV
$combined |
  Where-Object { $_ -like 'msg=' } |
  ForEach-Object {
    Write-Host "Processing line: $($_)"

    $_ = $_ -replace '\\', ''
    $_ = $_ -replace 'source=console', ''

    $fields = ($_ -split 'msg=')[1] -replace '"', '' -split ','
    if ($fields.Count -lt 4) {
      Write-Host "❌ Skipped (kurang field): $fields"
      return
    }

    [PSCustomObject]@{
     'res.status'     = [int]$fields[0].Trim()
     'res.timings.duration' = [double]$fields[1].Trim()
     'message'       = $fields[2].Trim()
     'documentId'     = $fields[3].Trim()
    }
  } |
  ConvertTo-Csv -NoTypeInformation |
  ForEach-Object { $_ -replace '"' , '' } |
  Set-Content src/proddrcload/usersignlog.csv -Encoding UTF8 -Force