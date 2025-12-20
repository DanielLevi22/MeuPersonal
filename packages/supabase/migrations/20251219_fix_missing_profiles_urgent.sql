-- Fix Missing Profiles (Urgent)
-- Run this script to create profiles for any users that are missing them.
-- This resolves the "Foreign Key Violation" (23503) error when creating meals.

DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Insert missing profiles
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
    COALESCE(au.raw_user_meta_data->>'full_name', 'Usuário sem nome') as full_name
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RAISE NOTICE 'Created % missing profiles.', v_count;
END $$;

-- Verify
SELECT 
  au.email, 
  au.raw_user_meta_data->>'account_type' as expected_role,
  p.account_type as actual_role,
  p.account_status
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
WHERE p.created_at >= NOW() - INTERVAL '1 minute';
