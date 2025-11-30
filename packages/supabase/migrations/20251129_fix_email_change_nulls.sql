-- Migration: Fix email_change NULLs
-- Description: Updates NULL values in email_change column to empty strings to prevent Auth driver scan errors.
-- Also sets a default value to prevent future NULLs.

BEGIN;

DO $$
BEGIN
  -- Check if the column exists in public.profiles
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email_change'
  ) THEN
    
    RAISE NOTICE 'Found email_change column in profiles. Fixing NULLs...';

    -- 1. Update existing NULLs to empty string
    UPDATE public.profiles 
    SET email_change = '' 
    WHERE email_change IS NULL;

    -- 2. Set default to empty string
    ALTER TABLE public.profiles 
    ALTER COLUMN email_change SET DEFAULT '';

    -- 3. Optionally set NOT NULL (if we are sure)
    -- ALTER TABLE public.profiles ALTER COLUMN email_change SET NOT NULL;
    
    RAISE NOTICE '✓ Fixed email_change: NULLs updated to empty string and DEFAULT set.';
    
  ELSE
    RAISE NOTICE 'Column email_change NOT found in public.profiles. Checking if it exists in auth.users (reference only)...';
    -- We don't touch auth.users directly usually, but if the error persists, it might be there.
    -- However, standard Supabase Auth handles auth.users. 
    -- The error likely comes from a query joining profiles or a view.
  END IF;
END $$;

COMMIT;
