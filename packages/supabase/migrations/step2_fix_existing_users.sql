-- STEP 2: Fix existing users without profiles
-- Execute this after step 1

INSERT INTO public.profiles (id, email, account_type, account_status, full_name, subscription_tier)
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
  au.raw_user_meta_data->>'full_name' as full_name,
  CASE
    WHEN COALESCE(au.raw_user_meta_data->>'account_type', 'autonomous_student') = 'autonomous_student'
    THEN 'free'::subscription_tier
    ELSE NULL
  END as subscription_tier
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
