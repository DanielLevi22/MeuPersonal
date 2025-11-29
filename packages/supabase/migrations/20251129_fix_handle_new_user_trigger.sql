-- Migration: Fix handle_new_user trigger
-- Description: Recreates the handle_new_user function to correctly handle account_type from metadata
-- Date: 2025-11-29

-- Drop trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_account_type text;
  v_account_status text;
  v_subscription_tier text;
BEGIN
  -- Get account type from metadata, default to autonomous_student if missing
  v_account_type := COALESCE(new.raw_user_meta_data->>'account_type', 'autonomous_student');
  
  -- Determine account status
  v_account_status := CASE 
    WHEN v_account_type = 'professional' THEN 'pending'
    ELSE 'active'
  END;
  
  -- Set subscription tier for autonomous students
  v_subscription_tier := CASE
    WHEN v_account_type = 'autonomous_student' THEN 'free'
    ELSE NULL
  END;

  -- Insert profile
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    account_type, 
    account_status, 
    subscription_tier,
    phone,
    invite_code
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    v_account_type,
    v_account_status,
    v_subscription_tier,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'invite_code'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    account_type = EXCLUDED.account_type,
    account_status = EXCLUDED.account_status;

  RETURN new;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✓ Trigger on_auth_user_created created successfully';
  ELSE
    RAISE WARNING 'Trigger on_auth_user_created not found';
  END IF;
END $$;
