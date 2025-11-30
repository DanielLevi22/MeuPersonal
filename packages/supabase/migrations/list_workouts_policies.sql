-- Diagnostic: List Policies on workouts
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'workouts' 
AND schemaname = 'public';
