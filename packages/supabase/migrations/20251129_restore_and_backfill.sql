-- Migration: Restore Auth & Fix Missing Profiles (v2 - Fixed Types)
-- Description: 
-- 1. Restores custom_access_token_hook (Security Definer)
-- 2. Restores handle_new_user trigger (Profile Creation)
-- 3. Backfills missing profiles (Fixed 'account_type' cast error)

BEGIN;

-- =================================================================
-- PART 1: Restore custom_access_token_hook (SECURITY DEFINER)
-- =================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
STABLE
AS $$
DECLARE
  claims jsonb;
  user_account_type text;
  user_is_super_admin boolean;
BEGIN
  SELECT account_type, is_super_admin INTO user_account_type, user_is_super_admin
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF user_account_type IS NOT NULL THEN
    claims := jsonb_set(claims, '{account_type}', to_jsonb(user_account_type));
  END IF;

  IF user_is_super_admin IS NOT NULL THEN
    claims := jsonb_set(claims, '{is_super_admin}', to_jsonb(user_is_super_admin));
  END IF;

  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

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
  v_account_type := COALESCE(new.raw_user_meta_data->>'account_type', 'autonomous_student');
  
  v_account_status := CASE 
    WHEN v_account_type = 'professional' THEN 'pending'
    ELSE 'active'
  END;
  
  v_subscription_tier := CASE
    WHEN v_account_type = 'autonomous_student' THEN 'free'
    ELSE NULL
  END;

  INSERT INTO public.profiles (
    id, email, full_name, account_type, account_status, subscription_tier, phone, invite_code
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================
-- PART 3: Backfill Missing Profiles (Fixed Type Cast)
-- =================================================================

INSERT INTO public.profiles (id, email, full_name, account_type, account_status, phone, invite_code)
SELECT 
  au.id, 
  au.email, 
  COALESCE(au.raw_user_meta_data->>'full_name', 'Usuário Recuperado'),
  COALESCE(au.raw_user_meta_data->>'account_type', 'autonomous_student')::account_type, -- <--- FIXED CAST
  'active',
  au.raw_user_meta_data->>'phone',
  au.raw_user_meta_data->>'invite_code'
FROM auth.users au
LEFT JOIN public.profiles pp ON au.id = pp.id
WHERE pp.id IS NULL;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ System Restored: Hooks enabled, Triggers enabled, and Missing Profiles created.';
END $$;
