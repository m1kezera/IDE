$lines = [System.IO.File]::ReadAllLines("src\ui\DesignStudioPanel.ts")
Write-Host "Total lines: $($lines.Count)"
Write-Host "---Lines 2550-2565---"
for ($i = 2549; $i -lt [Math]::Min(2565, $lines.Count); $i++) {
    $line = $lines[$i]
    $preview = $line.Substring(0, [Math]::Min(120, $line.Length))
    Write-Host "$($i+1): $preview"
}
