-- Fix RLS policies for deleting student links
-- Ensure Personals can delete links to their students

DROP POLICY IF EXISTS "Personals can delete links" ON students_personals;
DROP POLICY IF EXISTS "Users can delete their own links" ON students_personals;

-- Create a specific policy for deletion
CREATE POLICY "Users can delete their own links"
ON students_personals
FOR DELETE
USING (
  auth.uid() = personal_id OR 
  auth.uid() = student_id
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'students_personals';
