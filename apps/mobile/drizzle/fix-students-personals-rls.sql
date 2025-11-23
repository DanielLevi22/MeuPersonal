-- Fix RLS policies for students_personals table
-- Allow students to insert their own link during signup

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'students_personals';

-- Drop existing policies if needed
DROP POLICY IF EXISTS "Students can insert their own link" ON students_personals;

-- Create policy to allow students to link themselves during signup
CREATE POLICY "Students can insert their own link"
ON students_personals
FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'students_personals'
ORDER BY policyname;
