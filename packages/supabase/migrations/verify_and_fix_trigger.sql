-- Complete verification and fix for handle_new_user trigger

-- ============================================================================
-- PART 1: VERIFY TRIGGER EXISTS
-- ============================================================================

SELECT 
  'Trigger Status' as check_type,
  tgname as trigger_name,
  CASE tgenabled 
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- ============================================================================
-- PART 2: VERIFY FUNCTION EXISTS AND CHECK SOURCE
-- ============================================================================

SELECT 
  'Function Status' as check_type,
  proname as function_name,
  CASE prosecdef 
    WHEN true THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_mode
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- ============================================================================
-- PART 3: RE-CREATE THE TRIGGER AND FUNCTION (FIX)
-- ============================================================================

-- Drop and recreate to ensure it's correct
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_account_type text;
  v_account_status account_status;
  v_subscription_tier subscription_tier;
BEGIN
  -- Get account type from metadata
  v_account_type := COALESCE(new.raw_user_meta_data->>'account_type', 'autonomous_student');
  
  -- Determine account status
  v_account_status := CASE 
    WHEN v_account_type = 'professional' THEN 'pending'::account_status
    ELSE 'active'::account_status
  END;
  
  -- Set subscription tier for autonomous students (required by constraint)
  v_subscription_tier := CASE
    WHEN v_account_type = 'autonomous_student' THEN 'free'::subscription_tier
    ELSE NULL
  END;

  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, account_type, account_status, subscription_tier)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    v_account_type::account_type,
    v_account_status,
    v_subscription_tier
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists

  RETURN new;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Creates profile when new auth user is created. Professional accounts start as pending, others as active. Autonomous students get free tier by default.';

-- ============================================================================
-- PART 4: FIX EXISTING USERS WITHOUT PROFILES
-- ============================================================================

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

-- ============================================================================
-- PART 5: FINAL VERIFICATION
-- ============================================================================

-- Show all users and their profiles
SELECT 
  'Final Check' as check_type,
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) as users_with_profile,
  COUNT(*) FILTER (WHERE p.id IS NULL) as users_without_profile,
  COUNT(*) as total_users
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id;

-- Show recent users
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
