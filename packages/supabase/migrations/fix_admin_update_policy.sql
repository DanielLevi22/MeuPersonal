-- Migration: Refresh Admin UPDATE Policies
-- Description: Explicitly drops and recreates UPDATE policies to ensure they use the correct is_admin() logic.
-- Date: 2024-11-26

-- ============================================================================
-- PROFILES UPDATE POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- ENSURE ACCOUNT_STATUS IS UPDATABLE
-- ============================================================================
-- (No specific action needed as long as RLS allows it, but good to verify no triggers block it)

-- Grant update on profiles to authenticated users (RLS restricts which rows)
GRANT UPDATE ON profiles TO authenticated;
