-- Migration: Fix Admin RLS using User Metadata
-- Description: Update is_admin() to check user_metadata in JWT, avoiding recursion and custom hooks dependency
-- Date: 2024-11-26

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin (Metadata-based)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  metadata_account_type text;
  claim_account_type text;
BEGIN
  -- Get account_type from user_metadata (standard Supabase Auth)
  metadata_account_type := (auth.jwt() -> 'user_metadata' ->> 'account_type');
  
  -- Get account_type from custom claims (if hook is configured)
  claim_account_type := (current_setting('request.jwt.claims', true)::json->>'account_type');

  RETURN (
    COALESCE(metadata_account_type, '') = 'admin'
    OR
    COALESCE(claim_account_type, '') = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
GRANT EXECUTE ON FUNCTION is_admin() TO service_role;

-- ============================================================================
-- REFRESH POLICIES (Just to be safe)
-- ============================================================================

-- Drop existing policy to ensure clean state
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Re-create policy
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- Ensure users can see their own profile (if not already covered)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
