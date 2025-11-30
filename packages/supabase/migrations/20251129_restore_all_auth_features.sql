-- Migration: Restore ALL Auth Features (Hook + Trigger)
-- Description: Restores both the custom_access_token_hook AND the profile creation trigger.
-- This fixes the "function not found" error and the "profile not found" registration error.

BEGIN;

-- =================================================================
-- PART 1: Restore custom_access_token_hook (SECURITY DEFINER)
-- =================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Run as owner to bypass RLS during login
SET search_path = public, auth, extensions
STABLE
AS $$
DECLARE
  claims jsonb;
  user_account_type text;
  user_is_super_admin boolean;
BEGIN
  -- Fetch the user's account_type and is_super_admin from profiles
  SELECT account_type, is_super_admin INTO user_account_type, user_is_super_admin
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  -- Set custom claims
  IF user_account_type IS NOT NULL THEN
    claims := jsonb_set(claims, '{account_type}', to_jsonb(user_account_type));
  END IF;

  IF user_is_super_admin IS NOT NULL THEN
    claims := jsonb_set(claims, '{is_super_admin}', to_jsonb(user_is_super_admin));
  END IF;

  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO anon;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;

-- =================================================================
-- PART 2: Restore Profile Creation Trigger (handle_new_user)
-- =================================================================

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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ RESTORE COMPLETE: Hook and Trigger are back online.';
END $$;
