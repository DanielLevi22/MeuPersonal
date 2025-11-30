-- Migration: Add Basic RLS Policies for User Self-Access
-- Description: Ensure users can read their own profile data
-- This prevents 406 errors when users try to access their own data
-- Date: 2024-11-25

-- ============================================================================
-- PROFILES TABLE - BASIC USER POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- NOTES
-- ============================================================================

-- These policies allow users to access their own data
-- Admin policies (from previous migration) take precedence for admin users
-- Policy priority: Most specific (admin) → Least specific (self-access)
