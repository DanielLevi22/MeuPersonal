-- Migration: Update RLS policies for profiles to use coachings
-- Description: Updates RLS policies to allow professionals to view client profiles using the new coachings table
-- Date: 2025-11-29

-- Drop existing policies that might reference the old table or be outdated
DROP POLICY IF EXISTS "professionals_view_client_profiles" ON profiles;
DROP POLICY IF EXISTS "clients_view_professional_profiles" ON profiles;

-- Professionals can view profiles of their clients
CREATE POLICY "professionals_view_client_profiles" ON profiles
FOR SELECT
USING (
  id IN (
    SELECT client_id
    FROM coachings
    WHERE professional_id = auth.uid()
    AND status = 'active'
  )
);

-- Clients can view profiles of their professionals
CREATE POLICY "clients_view_professional_profiles" ON profiles
FOR SELECT
USING (
  id IN (
    SELECT professional_id
    FROM coachings
    WHERE client_id = auth.uid()
    AND status = 'active'
  )
);

-- Verify policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'professionals_view_client_profiles'
  ) THEN
    RAISE NOTICE '✓ Policy professionals_view_client_profiles created successfully';
  ELSE
    RAISE WARNING 'Policy professionals_view_client_profiles not found';
  END IF;
END $$;
