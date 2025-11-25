-- Complete RLS Reset - Remove all admin policies and function
-- This will drop everything and start fresh

-- ============================================================================
-- STEP 1: Drop the function with CASCADE (removes all dependent policies)
-- ============================================================================

DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- ============================================================================
-- STEP 2: Create simple policies for profiles table
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- DONE - Admin access will be handled via service role key
-- ============================================================================

-- Note: For now, admin users will access data the same way as regular users
-- Admin-specific features (viewing all users, etc.) will use the service role
-- This avoids RLS recursion issues
