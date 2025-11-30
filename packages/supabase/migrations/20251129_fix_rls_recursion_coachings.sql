-- Migration: Fix RLS Recursion in Coachings
-- Description: Updates admin policy to use JWT claims instead of querying profiles table to avoid infinite recursion
-- Date: 2025-11-29

-- Drop the problematic policy
DROP POLICY IF EXISTS "admins_manage_all_coachings" ON coachings;

-- Recreate using JWT claims (avoids querying profiles table)
CREATE POLICY "admins_manage_all_coachings" ON coachings
  FOR ALL
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'account_type') = 'admin'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'admin'
  );

-- Also fix profiles admin policy just in case
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "admins_manage_all_profiles" ON profiles
  FOR ALL
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'account_type') = 'admin'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'admin'
  );

-- Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coachings' 
    AND policyname = 'admins_manage_all_coachings'
  ) THEN
    RAISE NOTICE '✓ Policy admins_manage_all_coachings updated successfully';
  END IF;
END $$;
