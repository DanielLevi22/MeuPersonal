-- STEP 3: Verify everything is working
-- Execute this last to check results

-- Check if all users have profiles
SELECT 
  'Final Check' as check_type,
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) as users_with_profile,
  COUNT(*) FILTER (WHERE p.id IS NULL) as users_without_profile,
  COUNT(*) as total_users
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id;

-- Show recent users with details
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  p.account_type,
  p.account_status,
  p.subscription_tier,
  p.created_at as profile_created,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ HAS PROFILE'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 10;
