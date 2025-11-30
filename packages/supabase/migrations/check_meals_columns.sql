-- Diagnostic: Check Meals Columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'meals'
AND table_schema = 'public';
