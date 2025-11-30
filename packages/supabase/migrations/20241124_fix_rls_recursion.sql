-- Fix RLS Recursion Issue
-- The is_admin() function was causing infinite recursion
-- Solution: Use direct auth.uid() checks instead of the helper function

-- ============================================================================
-- STEP 1: Drop the problematic helper function
-- ============================================================================

DROP FUNCTION IF EXISTS is_admin();

-- ============================================================================
-- STEP 2: Recreate ALL policies without using the helper function
-- ============================================================================

-- Remove all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON profiles;

-- Policy 1: Users can ALWAYS read their own profile (no recursion)
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Check if policies were created successfully
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
