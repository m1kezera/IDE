$f = 'c:\pulsyce\frontend-ts\src\ui\DesignStudioPanel.ts'
$bytes = [System.IO.File]::ReadAllBytes($f)
$lineCount = 0
$cutPos = 0
for ($i = 0; $i -lt $bytes.Length; $i++) {
    if ($bytes[$i] -eq 10) {
        $lineCount++
        if ($lineCount -eq 2559) {
            $cutPos = $i + 1
            break
        }
    }
}
Write-Host "Cutting at byte $cutPos after line $lineCount"
$newBytes = New-Object byte[] ($cutPos + 2)
[Array]::Copy($bytes, $newBytes, $cutPos)
$newBytes[$cutPos] = 13
$newBytes[$cutPos+1] = 10
[System.IO.File]::WriteAllBytes($f, $newBytes)
Write-Host "Done. New size: $($newBytes.Length) bytes"
