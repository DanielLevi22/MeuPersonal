-- Diagnostic: Verify Fix Status
-- 1. Check if the profile for 'daiane' exists now
SELECT * FROM profiles WHERE email = 'daniane@email.com';

-- 2. Check if the trigger is back
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 3. Check if the hook function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'custom_access_token_hook' 
AND routine_schema = 'public';
