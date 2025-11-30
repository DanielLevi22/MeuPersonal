-- Migration: EMERGENCY DISABLE HOOK
-- Description: Completely removes the custom_access_token_hook from the auth configuration.
-- This is the "Safe Mode" to restore login functionality immediately.

BEGIN;

-- 1. Revoke permissions (effectively disabling it for users)
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM public;

-- 2. Drop the function entirely to ensure Supabase Auth cannot call it
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- 3. Also disable the profile trigger temporarily to rule out side effects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ EMERGENCY MODE: Hook and Triggers disabled. Login should work now.';
END $$;
