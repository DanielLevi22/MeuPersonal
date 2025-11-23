# Nutrition Module - Recent Updates

## Overview
This document tracks recent updates and enhancements to the nutrition module.

## Recent Features (November 2022)

### 1. Diet Plan Types
**Status**: ✅ Implemented

The system now supports two types of diet plans:

- **Dieta Única (Single Diet)**: Same meal plan for all days
  - Meals are stored with `day_of_week = -1`
  - Displayed consistently regardless of the current day
  
- **Dieta Cíclica (Cyclic Diet)**: Different meals for different days
  - Meals are stored with `day_of_week = 0-6` (Sunday-Saturday)
  - System cycles through the week automatically

**Files Modified**:
- `src/store/nutritionStore.ts`: Added `plan_type` field
- `src/app/nutrition/create.tsx`: Added type selector UI
- `src/app/(tabs)/students/[id]/nutrition/full-diet.tsx`: Conditional day selector
- `drizzle/migration-add-plan-type.sql`: Database migration

### 2. Diet Plan Import
**Status**: ✅ Implemented

Personal trainers can now import complete diet plans from one student to another:

- Search and select source student
- Automatically copies all meals and food items
- Maintains meal structure and quantities

**Files Modified**:
- `src/store/nutritionStore.ts`: Added `sourcePlanId` parameter to `createDietPlan`
- `src/app/nutrition/create.tsx`: Added import modal and UI

### 3. Diet Plan History
**Status**: ✅ Implemented

Completed and finished diet plans are now archived:

- Automatic archiving when end date passes
- Manual finish option
- History view in student nutrition dashboard

**Files Modified**:
- `src/store/nutritionStore.ts`: Added `dietPlanHistory` and `fetchDietPlanHistory`
- `src/app/(tabs)/students/[id]/nutrition/index.tsx`: Added history section

### 4. Student Pre-selection
**Status**: ✅ Implemented

When creating a diet plan from a student's profile:

- Student is automatically pre-selected
- Selection list is hidden
- Shows "Aluno Selecionado" with student info

**Files Modified**:
- `src/app/(tabs)/students/[id]/nutrition/index.tsx`: Passes `preselectedStudentId`
- `src/app/nutrition/create.tsx`: Handles pre-selection parameter

### 5. Student Meal Tracking
**Status**: ✅ Implemented

Students can now track their daily meals:

- View today's meals based on their active diet plan
- Mark meals as completed with checkbox
- Completion status persists across sessions
- Shows meal times and food items

**Files Modified**:
- `src/app/(tabs)/students/[id]/nutrition/today.tsx`: Complete implementation
- `src/store/nutritionStore.ts`: Uses existing `toggleMealCompletion`

### 6. Meal Notifications (Partial)
**Status**: ⚠️ Service Ready, Integration Pending

Notification infrastructure is in place:

- `expo-notifications` package installed
- Permission handling implemented
- Meal scheduling logic ready
- **Pending**: Integration into diet plan creation flow

**Files Created**:
- `src/services/notificationService.ts`: Complete notification service

**Next Steps**:
1. Import notification service in `nutritionStore.ts`
2. Call `scheduleMealNotifications` after creating diet plan with meals
3. Call `cancelPlanNotifications` when finishing a plan

## Database Changes

### Required Migrations

1. **plan_type column**:
   ```sql
   ALTER TABLE diet_plans ADD COLUMN plan_type text DEFAULT 'cyclic';
   ```

2. **RLS Policies Fix** (IMPORTANT):
   ```sql
   -- Run migration-fix-nutrition-rls.sql
   ```
   This fixes permissions so students can view their meals properly.

## Known Issues

### Fixed
- ✅ Student nutrition view not showing meals (filter logic fixed)
- ✅ RLS policies preventing students from viewing meals (migration created)

## Testing Checklist

- [x] Create unique diet plan
- [x] Create cyclic diet plan
- [x] Import diet plan from another student
- [x] View diet plan history
- [x] Student can view today's meals
- [x] Student can mark meals as completed
- [ ] Notifications trigger at meal times (pending integration)

## Future Enhancements

1. **Notification Integration**: Complete the notification scheduling in the diet plan creation flow
2. **Meal Templates**: Allow saving meal templates for quick reuse
3. **Nutrition Analytics**: Track student adherence and completion rates
4. **Custom Meal Times**: Allow students to adjust meal times
5. **Photo Logging**: Allow students to upload photos of completed meals
