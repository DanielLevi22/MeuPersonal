-- Diagnostic: List Policies on workout_exercises
-- Description: Lists all RLS policies attached to the workout_exercises table.

SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'workout_exercises' 
AND schemaname = 'public';
