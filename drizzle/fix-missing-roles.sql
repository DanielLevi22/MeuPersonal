-- Check and fix profiles without role
-- Run this to see if there are profiles without role set

SELECT id, email, role, full_name 
FROM profiles 
WHERE role IS NULL;

-- If you find any, update them based on whether they have students or are students
-- Update students (those who are linked as students)
UPDATE profiles 
SET role = 'student'
WHERE id IN (
  SELECT student_id FROM students_personals
) AND role IS NULL;

-- Update personal trainers (those who have students)
UPDATE profiles 
SET role = 'personal'
WHERE id IN (
  SELECT personal_id FROM students_personals
) AND role IS NULL;

-- Verify the changes
SELECT id, email, role, full_name 
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;
