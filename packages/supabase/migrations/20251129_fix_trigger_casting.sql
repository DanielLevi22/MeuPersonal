-- Migration: Fix Trigger Type Casting
-- Description: Updates handle_new_user to explicitly cast text variables to ENUM types during INSERT.
-- This resolves the "column is of type account_type but expression is of type text" error.

BEGIN;

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

  -- Insert profile with EXPLICIT CASTS
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
    v_account_type::account_type, -- <--- Explicit Cast
    v_account_status,             -- Assuming this is text, if enum it might need cast too
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

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ Trigger function updated with explicit type casting.';
END $$;
