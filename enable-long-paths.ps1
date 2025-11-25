# Enable Long Paths in Windows
# This script must be run as Administrator

Write-Host "Enabling Long Paths support in Windows..." -ForegroundColor Cyan

try {
    New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
                     -Name "LongPathsEnabled" `
                     -Value 1 `
                     -PropertyType DWORD `
                     -Force | Out-Null
    
    Write-Host "✓ Long Paths enabled successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: You need to restart your computer for this change to take effect." -ForegroundColor Yellow
    Write-Host ""
    
    $restart = Read-Host "Do you want to restart now? (y/n)"
    if ($restart -eq 'y' -or $restart -eq 'Y') {
        Write-Host "Restarting in 10 seconds... Press Ctrl+C to cancel" -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        Restart-Computer -Force
    } else {
        Write-Host "Please restart your computer manually when convenient." -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Failed to enable Long Paths: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you are running PowerShell as Administrator!" -ForegroundColor Yellow
    exit 1
}
