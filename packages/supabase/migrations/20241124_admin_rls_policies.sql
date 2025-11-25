-- Migration: Admin RLS Policies
-- Description: Row Level Security policies for admin access
-- Author: MeuPersonal Team
-- Date: 2024-11-24
-- Dependencies: 20241124_add_admin_role.sql

-- ============================================================================
-- CREATE INDEXES (After enum is committed)
-- ============================================================================

-- Create index for admin queries (moved from previous migration due to enum transaction issues)
CREATE INDEX IF NOT EXISTS idx_profiles_admin 
  ON profiles(account_type) 
  WHERE account_type = 'admin';

-- Create index for super admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin 
  ON profiles(is_super_admin) 
  WHERE is_super_admin = true;

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND account_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Admins can delete users (except super admins)
CREATE POLICY "Admins can delete users (not super admins)"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    is_admin() 
    AND NOT is_super_admin
  );

-- ============================================================================
-- STUDENTS TABLE POLICIES
-- ============================================================================

-- Admins can view all students
CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update any student
CREATE POLICY "Admins can update any student"
  ON students FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Admins can delete any student
CREATE POLICY "Admins can delete any student"
  ON students FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- WORKOUTS TABLE POLICIES
-- ============================================================================

-- Admins can view all workouts
CREATE POLICY "Admins can view all workouts"
  ON workouts FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update any workout
CREATE POLICY "Admins can update any workout"
  ON workouts FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Admins can delete any workout
CREATE POLICY "Admins can delete any workout"
  ON workouts FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- EXERCISES TABLE POLICIES
-- ============================================================================

-- Admins can view all exercises
CREATE POLICY "Admins can view all exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update any exercise
CREATE POLICY "Admins can update any exercise"
  ON exercises FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Admins can delete any exercise
CREATE POLICY "Admins can delete any exercise"
  ON exercises FOR DELETE
  TO authenticated
  USING (is_admin());

-- Admins can create exercises
CREATE POLICY "Admins can create exercises"
  ON exercises FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- ============================================================================
-- FOODS TABLE POLICIES
-- ============================================================================

-- Admins can view all foods
CREATE POLICY "Admins can view all foods"
  ON foods FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update any food
CREATE POLICY "Admins can update any food"
  ON foods FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Admins can delete any food
CREATE POLICY "Admins can delete any food"
  ON foods FOR DELETE
  TO authenticated
  USING (is_admin());

-- Admins can create foods
CREATE POLICY "Admins can create foods"
  ON foods FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- ============================================================================
-- DIET_PLANS TABLE POLICIES
-- ============================================================================

-- Admins can view all diet plans
CREATE POLICY "Admins can view all diet plans"
  ON diet_plans FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update any diet plan
CREATE POLICY "Admins can update any diet plan"
  ON diet_plans FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Admins can delete any diet plan
CREATE POLICY "Admins can delete any diet plan"
  ON diet_plans FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- PROFESSIONAL_SERVICES TABLE POLICIES
-- ============================================================================

-- Admins can view all professional services
CREATE POLICY "Admins can view all professional services"
  ON professional_services FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update any professional service
CREATE POLICY "Admins can update any professional service"
  ON professional_services FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Admins can delete any professional service
CREATE POLICY "Admins can delete any professional service"
  ON professional_services FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- CLIENT_PROFESSIONAL_RELATIONSHIPS TABLE POLICIES
-- ============================================================================

-- Admins can view all relationships
CREATE POLICY "Admins can view all relationships"
  ON client_professional_relationships FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update any relationship
CREATE POLICY "Admins can update any relationship"
  ON client_professional_relationships FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Admins can delete any relationship
CREATE POLICY "Admins can delete any relationship"
  ON client_professional_relationships FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- ADMIN_AUDIT_LOGS TABLE POLICIES
-- ============================================================================

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- Only admins can insert audit logs
CREATE POLICY "Only admins can insert audit logs"
  ON admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Audit logs cannot be updated or deleted (immutable)
-- No UPDATE or DELETE policies

-- ============================================================================
-- FEATURE_FLAGS TABLE POLICIES
-- ============================================================================

-- Everyone can read feature flags
CREATE POLICY "Everyone can read feature flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert feature flags
CREATE POLICY "Only admins can insert feature flags"
  ON feature_flags FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Only admins can update feature flags
CREATE POLICY "Only admins can update feature flags"
  ON feature_flags FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Only admins can delete feature flags
CREATE POLICY "Only admins can delete feature flags"
  ON feature_flags FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- SYSTEM_SETTINGS TABLE POLICIES
-- ============================================================================

-- Everyone can read system settings (for maintenance mode, etc.)
CREATE POLICY "Everyone can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert system settings
CREATE POLICY "Only admins can insert system settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Only admins can update system settings
CREATE POLICY "Only admins can update system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Only admins can delete system settings
CREATE POLICY "Only admins can delete system settings"
  ON system_settings FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- NOTES
-- ============================================================================

-- These policies grant admins full access to all tables
-- Audit logs are immutable (no UPDATE/DELETE)
-- Feature flags and system settings are readable by all but only admins can modify
-- Super admins cannot be deleted (protected in profiles DELETE policy)
