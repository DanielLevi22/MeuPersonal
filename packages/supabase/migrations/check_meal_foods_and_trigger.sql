-- Diagnostic: Check meal_foods columns and trigger definition
-- 1. Check meal_foods columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'meal_foods'
AND table_schema = 'public';

-- 2. Verify trigger definition again (did the update stick?)
SELECT pg_get_functiondef('public.trigger_calc_goals_meal'::regproc);
