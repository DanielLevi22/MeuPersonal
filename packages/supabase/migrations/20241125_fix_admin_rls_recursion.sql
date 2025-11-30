-- Migration: Fix Admin RLS Recursion
-- Description: Update is_admin() function to use JWT claims instead of database query
-- This prevents RLS recursion issues
-- Date: 2024-11-25

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin (JWT-based, no RLS recursion)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check JWT claims first (no database query = no RLS recursion)
  -- The custom_access_token_hook adds account_type to JWT claims
  RETURN (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'account_type',
      ''
    ) = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
GRANT EXECUTE ON FUNCTION is_admin() TO service_role;
