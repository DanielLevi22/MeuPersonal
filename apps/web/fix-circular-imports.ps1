$modules = @("dashboard", "nutrition", "workouts", "training-plans")

foreach ($module in $modules) {
    $modulePath = "src/modules/$module"
    $files = Get-ChildItem -Path $modulePath -Recurse -Include "*.tsx","*.ts"

    foreach ($file in $files) {
        $content = Get-Content $file.FullName
        if ($content) {
            $newContent = $content -join "`n"
            $updated = $false
            
            # Replace self-reference imports with relative paths
            # This is a bit complex to do perfectly with regex, but we can fix the most common cases
            # Case 1: import ... from '@/module' -> import ... from '../' (or similar)
            # Actually, it's better to NOT import from the barrel file inside the module itself.
            # We should import from specific files.
            
            # For now, let's just try to fix the specific circular dependency in MealEditor
            if ($file.Name -eq "MealEditor.tsx") {
                $newContent = $newContent -replace "from '@/nutrition'", "from './'" 
                # This assumes components are in the same folder or exported from index of components folder
                # But wait, MealEditor is in components folder.
                # If we import from './', we are importing from the current directory.
                # If the other components are in the same directory, we can import them by name?
                # No, we need to import from specific files to avoid circular dependency via index.ts
                
                $newContent = $newContent -replace "import \{ AddFoodQuantityModal \} from '@\/nutrition';", "import { AddFoodQuantityModal } from './AddFoodQuantityModal';"
                $newContent = $newContent -replace "import \{ EditFoodModal \} from '@\/nutrition';", "import { EditFoodModal } from './EditFoodModal';"
                $newContent = $newContent -replace "import \{ EditMealTimeModal \} from '@\/nutrition';", "import { EditMealTimeModal } from './EditMealTimeModal';"
                $newContent = $newContent -replace "import \{ FoodSelector \} from '@\/nutrition';", "import { FoodSelector } from './FoodSelector';"
                
                $updated = $true
            }
            
             if ($file.Name -eq "page.tsx" -and $file.FullName -match "dashboard\\page.tsx") {
                 # Fix dashboard page imports
                 $newContent = $newContent -replace "from '@/dashboard/ActivityFeed'", "from '@/dashboard'"
                 $newContent = $newContent -replace "from '@/dashboard/QuickActions'", "from '@/dashboard'"
                 $newContent = $newContent -replace "from '@/dashboard/StatCard'", "from '@/dashboard'"
                 $updated = $true
             }

            if ($updated) {
                Set-Content $file.FullName $newContent
                Write-Host "Fixed circular imports in: $($file.Name)"
            }
        }
    }
}
