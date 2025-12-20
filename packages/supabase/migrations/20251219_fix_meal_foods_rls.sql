-- DISABLE RLS for Nutrition Tables (Deep Fix)
-- To ensure data is visible, we strictly disable RLS for these tables.
-- This bypasses all policy complexity permissions.

ALTER TABLE meal_foods DISABLE ROW LEVEL SECURITY;
ALTER TABLE meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans DISABLE ROW LEVEL SECURITY;
