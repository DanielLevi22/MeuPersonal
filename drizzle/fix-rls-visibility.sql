-- Fix RLS policies for students_personals to ensure visibility
-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Personals can view their students" ON students_personals;
DROP POLICY IF EXISTS "Students can view their personals" ON students_personals;
DROP POLICY IF EXISTS "Personals can insert links" ON students_personals;
DROP POLICY IF EXISTS "Students can insert their own link" ON students_personals;
DROP POLICY IF EXISTS "Personals can delete links" ON students_personals;

-- 1. View Policy (SELECT)
-- Personals can see links where they are the personal
-- Students can see links where they are the student
CREATE POLICY "Users can view their own links"
ON students_personals
FOR SELECT
USING (
  auth.uid() = personal_id OR 
  auth.uid() = student_id
);

-- 2. Insert Policy (INSERT)
-- Students can insert a link to themselves (when accepting invite)
-- Personals can insert a link (when manually adding? usually invite flow)
CREATE POLICY "Users can insert their own links"
ON students_personals
FOR INSERT
WITH CHECK (
  auth.uid() = student_id OR 
  auth.uid() = personal_id
);

-- 3. Delete Policy (DELETE)
-- Personals can remove students
-- Students can remove themselves (optional, but good for "leave personal")
CREATE POLICY "Users can delete their own links"
ON students_personals
FOR DELETE
USING (
  auth.uid() = personal_id OR 
  auth.uid() = student_id
);

-- Also ensure profiles are visible
-- This is usually handled by a public profile policy, but let's make sure
-- Personals need to see student profiles they are linked to
