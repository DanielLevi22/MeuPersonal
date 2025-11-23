-- Fix RLS policies for diet_meals and diet_meal_items
-- Allow personals to insert/update/delete and students to only view

-- Drop existing policies
DROP POLICY IF EXISTS "Access via diet plan" ON diet_meals;
DROP POLICY IF EXISTS "Access via diet meal" ON diet_meal_items;

-- DIET MEALS: Separate policies for different operations
CREATE POLICY "Personals can manage diet meals"
ON diet_meals FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND diet_plans.personal_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND diet_plans.personal_id = auth.uid()
  )
);

CREATE POLICY "Students can view their diet meals"
ON diet_meals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND diet_plans.student_id = auth.uid()
  )
);

-- DIET MEAL ITEMS: Separate policies for different operations
CREATE POLICY "Personals can manage diet meal items"
ON diet_meal_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM diet_meals dm
    JOIN diet_plans dp ON dp.id = dm.diet_plan_id
    WHERE dm.id = diet_meal_items.diet_meal_id
    AND dp.personal_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM diet_meals dm
    JOIN diet_plans dp ON dp.id = dm.diet_plan_id
    WHERE dm.id = diet_meal_items.diet_meal_id
    AND dp.personal_id = auth.uid()
  )
);

CREATE POLICY "Students can view their diet meal items"
ON diet_meal_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM diet_meals dm
    JOIN diet_plans dp ON dp.id = dm.diet_plan_id
    WHERE dm.id = diet_meal_items.diet_meal_id
    AND dp.student_id = auth.uid()
  )
);
