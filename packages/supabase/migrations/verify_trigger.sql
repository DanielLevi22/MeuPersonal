-- Verification script for handle_new_user trigger
-- Run this in Supabase SQL Editor to verify the trigger is working

-- 1. Check if trigger exists
SELECT 
  tgname as trigger_name,
  tgenabled as is_enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 2. Check if function exists
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Test profile creation for recent users
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  au.raw_user_meta_data->>'account_type' as metadata_account_type,
  p.id as profile_id,
  p.account_type as profile_account_type,
  p.account_status,
  p.created_at as profile_created,
  EXTRACT(EPOCH FROM (p.created_at - au.created_at)) as delay_seconds
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 4. Find users without profiles (PROBLEM!)
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'account_type' as account_type
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;
