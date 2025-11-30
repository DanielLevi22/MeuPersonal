-- Diagnostic: Check workouts table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workouts' 
AND table_schema = 'public';
