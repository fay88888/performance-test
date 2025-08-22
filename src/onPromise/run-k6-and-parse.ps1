# Folder dan file
$folderPath = "src/onPromise"
$txtLog = Join-Path $folderPath "getsession_log.txt"
$csvLog = Join-Path $folderPath "getsession_log.csv"

# Jalankan k6 dan simpan output ke file log
Write-Host "🚀 Menjalankan k6..."
k6 run "$folderPath/getSessionSigning.js" > $txtLog 2>&1

# Baca isi file log
$logLines = Get-Content $txtLog -Encoding UTF8

# Array hasil parsing
$results = @()

foreach ($line in $logLines) {
    # Regex pattern untuk parse log console k6
    if ($line -match 'status:\s*(\d+),\s*duration:\s*([\d\.]+)\s*ms,\s*message:\s*"([^"]*)",\s*sessionId:\s*"([^"]*)",\s*fileId:\s*"([^"]*)"') {
        $status = $matches[1]
        $duration = $matches[2]
        $message = $matches[3]
        $sessionId = $matches[4]
        $fileId = $matches[5]

        $obj = [PSCustomObject]@{
            'res.status'           = [int]$status
            'res.timings.duration' = [double]$duration
            'message'              = $message
            'sessionId'            = $sessionId
            'fileId'               = $fileId
        }
        $results += $obj
    }
}

# Export hasil ke CSV jika ada data
if ($results.Count -gt 0) {
    $results | Export-Csv -NoTypeInformation -Encoding UTF8 -Force $csvLog
    Write-Host "✅ CSV berhasil disimpan ke: $csvLog"
} else {
    Write-Warning "⚠️ Tidak ada data yang bisa diekspor ke CSV."
}
