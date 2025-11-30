-- Diagnostic: Deep check of workout_exercises
-- 1. List all policies (again, to verify cleanup)
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'workout_exercises' 
AND schemaname = 'public';

-- 2. List all columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workout_exercises' 
AND table_schema = 'public';
