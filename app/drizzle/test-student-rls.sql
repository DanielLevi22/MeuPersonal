-- Test RLS policies for students viewing diet plans
-- Run this in Supabase SQL Editor to check if students can see their plans

-- 1. Check if student can see their diet plan
SELECT 
  dp.id,
  dp.name,
  dp.plan_type,
  dp.student_id,
  dp.personal_id,
  dp.is_active,
  dp.status
FROM diet_plans dp
WHERE dp.student_id = auth.uid()
AND dp.status = 'active';

-- 2. Check if student can see meals
SELECT 
  dm.id,
  dm.diet_plan_id,
  dm.day_of_week,
  dm.meal_type,
  dm.name
FROM diet_meals dm
JOIN diet_plans dp ON dp.id = dm.diet_plan_id
WHERE dp.student_id = auth.uid()
AND dp.status = 'active';

-- 3. Check if student can see meal items
SELECT 
  dmi.id,
  dmi.diet_meal_id,
  dmi.food_id,
  dmi.quantity,
  dmi.unit,
  f.name as food_name
FROM diet_meal_items dmi
JOIN diet_meals dm ON dm.id = dmi.diet_meal_id
JOIN diet_plans dp ON dp.id = dm.diet_plan_id
JOIN foods f ON f.id = dmi.food_id
WHERE dp.student_id = auth.uid()
AND dp.status = 'active';

-- If any of these queries return empty results when logged in as a student,
-- the RLS policies are blocking access.
