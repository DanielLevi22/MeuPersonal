$modules = @("dashboard", "nutrition", "workouts", "training-plans")

$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName
    if ($content) {
        $newContent = $content -join "`n"
        $updated = $false
        
        foreach ($module in $modules) {
            $pattern = "from '@/$module/([a-zA-Z0-9_]+)'"
            if ($newContent -match $pattern) {
                $newContent = $newContent -replace $pattern, "from '@/$module'"
                $updated = $true
            }
        }
        
        if ($updated) {
            Set-Content $file.FullName $newContent
            Write-Host "Fixed imports in: $($file.Name)"
        }
    }
}
