-- Migration: Fix Periodizations RLS Policies
-- Description: Allows students to view their periodizations and professionals to view their created periodizations
-- Date: 2025-11-29

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own periodizations" ON periodizations;
DROP POLICY IF EXISTS "Professionals can view their created periodizations" ON periodizations;
DROP POLICY IF EXISTS "Users can view periodizations" ON periodizations;
DROP POLICY IF EXISTS "Enable read access for all users" ON periodizations;

-- Create policy for students to view their own periodizations
CREATE POLICY "Students can view their own periodizations"
ON periodizations
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Create policy for professionals to view periodizations they created
CREATE POLICY "Professionals can view their created periodizations"
ON periodizations
FOR SELECT
TO authenticated
USING (professional_id = auth.uid());

-- Create policy for professionals to insert periodizations
CREATE POLICY "Professionals can create periodizations"
ON periodizations
FOR INSERT
TO authenticated
WITH CHECK (professional_id = auth.uid());

-- Create policy for professionals to update their periodizations
CREATE POLICY "Professionals can update their periodizations"
ON periodizations
FOR UPDATE
TO authenticated
USING (professional_id = auth.uid())
WITH CHECK (professional_id = auth.uid());

-- Create policy for professionals to delete their periodizations
CREATE POLICY "Professionals can delete their periodizations"
ON periodizations
FOR DELETE
TO authenticated
USING (professional_id = auth.uid());
