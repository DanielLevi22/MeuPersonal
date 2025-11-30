-- Fix: Create profiles for users that don't have one
-- This handles the case where the trigger didn't fire or failed

-- Step 1: Create missing profiles based on auth.users metadata
INSERT INTO public.profiles (id, email, account_type, account_status, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(
    (au.raw_user_meta_data->>'account_type')::account_type,
    'autonomous_student'::account_type
  ) as account_type,
  CASE 
    WHEN au.raw_user_meta_data->>'account_type' = 'professional' 
    THEN 'pending'::account_status
    ELSE 'active'::account_status
  END as account_status,
  au.raw_user_meta_data->>'full_name' as full_name
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 2: Verify the fix
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  p.account_type,
  p.account_status,
  p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 10;
