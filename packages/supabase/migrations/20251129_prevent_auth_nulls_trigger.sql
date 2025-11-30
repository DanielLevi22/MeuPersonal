-- Migration: Prevent NULLs in auth.users (Safety Trigger)
-- Description: Creates a BEFORE INSERT trigger on auth.users to automatically convert NULLs to empty strings.
-- This ensures that NEW users never have NULL values in 'email_change', preventing the login crash.
-- This is necessary because we cannot run ALTER TABLE on auth.users to set default values.

BEGIN;

-- 1. Create the function that fixes the data before insertion
CREATE OR REPLACE FUNCTION public.prevent_nulls_in_auth_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check and fix email_change
  IF NEW.email_change IS NULL THEN
    NEW.email_change := '';
  END IF;

  -- Check and fix email_change_token_new
  IF NEW.email_change_token_new IS NULL THEN
    NEW.email_change_token_new := '';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create the trigger (BEFORE INSERT)
-- We drop it first to ensure idempotency
DROP TRIGGER IF EXISTS ensure_auth_users_not_null ON auth.users;

CREATE TRIGGER ensure_auth_users_not_null
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_nulls_in_auth_users();

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ Safety Trigger created. New users will automatically have NULLs fixed.';
END $$;
