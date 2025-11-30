-- Diagnostic: Check Profile Column Types
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public';
