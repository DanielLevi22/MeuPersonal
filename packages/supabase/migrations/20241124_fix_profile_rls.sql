-- Fix: Allow users to read their own profile
-- This is needed because admin users need to read their own profile
-- to check if they are admin

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create policy that allows users to view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- This policy works alongside the admin policy
-- Users can see their own profile OR if they're admin they can see all profiles
