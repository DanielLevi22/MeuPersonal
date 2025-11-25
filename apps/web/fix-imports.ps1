$replacements = @{
    "from '@/components/ui/" = "from '@/shared/components/ui/"
    "from '@/components/dashboard/" = "from '@/dashboard/"
    "from '@/components/nutrition/" = "from '@/nutrition/"
    "from '@/components/workouts/" = "from '@/workouts/"
    "from '@/components/training-plans/" = "from '@/training-plans/"
    "from '@/components/periodization/" = "from '@/dashboard/"
    "from '@/lib/hooks/" = "from '@/shared/hooks/"
    "from '@/lib/utils" = "from '@/shared/utils"
}

$fileCount = 0
$updateCount = 0

Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | ForEach-Object {
    $fileCount++
    $content = Get-Content $_.FullName
    if ($content) {
        $updated = $false
        $newContent = $content -join "`n"
        foreach ($key in $replacements.Keys) {
            if ($newContent -match [regex]::Escape($key)) {
                $newContent = $newContent -replace [regex]::Escape($key), $replacements[$key]
                $updated = $true
            }
        }
        if ($updated) {
            Set-Content $_.FullName $newContent
            $updateCount++
            Write-Host "OK $($_.Name)"
        }
    }
}

Write-Host ""
Write-Host "Processados: $fileCount arquivos"
Write-Host "Atualizados: $updateCount arquivos"
