# Student Nutrition Screen Implementation

I have implemented the nutrition screen for students, allowing them to view their daily meal plan and mark meals as completed.

## Changes Made

### 1. New Screen: `StudentNutritionScreen`
- Created `apps/mobile/src/modules/nutrition/screens/StudentNutritionScreen.tsx`.
- Displays the student's active diet plan.
- Shows daily macro totals (Planned vs Consumed).
- Lists meals for the selected day.
- Allows toggling meal completion.

### 2. Component Update: `MealCard`
- Updated `apps/mobile/src/modules/nutrition/components/MealCard.tsx`.
- Added `isChecked` and `onToggleCheck` props.
- Renders a check button when `onToggleCheck` is provided.
- Styles the card differently when checked (dimmed, strikethrough).

### 3. Store Fix: `nutritionStore`
- Updated `apps/mobile/src/modules/nutrition/store/nutritionStore.ts`.
- Fixed incorrect table name reference: changed `meal_logs` to `diet_logs` in `fetchDailyLogs` and `toggleMealCompletion`.

### 4. Routing & Navigation
- Updated `apps/mobile/src/modules/nutrition/routes/index.ts` to export `StudentNutritionScreen`.
- Updated `apps/mobile/src/app/(tabs)/nutrition/index.tsx` to conditionally render `StudentNutritionScreen` for students and `NutritionScreen` for professionals.
- Updated `apps/mobile/src/app/(tabs)/_layout.tsx` to enable the "Nutrição" tab for students.

## How to Test

1.  **Login as a Student**: Use a student account that has an active diet plan.
2.  **Navigate to Nutrition**: Tap on the "Nutrição" tab in the bottom navigation.
3.  **View Plan**: You should see your active diet plan, with today's meals listed.
4.  **Check Macros**: Verify the macro summary at the top.
5.  **Mark Meal as Done**: Tap the circle icon next to a meal time.
    - The meal card should turn green/dimmed.
    - The "Consumed" macros in the summary should update.
6.  **Switch Days**: Use the day selector to view other days.

## Notes
- The implementation assumes the `diet_logs` table exists in the database (as defined in `migration-nutrition-schema.sql`).
- If you encounter errors about "relation diet_logs does not exist", please ensure the nutrition schema migration has been applied.
