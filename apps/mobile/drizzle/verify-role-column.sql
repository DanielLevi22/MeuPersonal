-- Check if the role column exists in profiles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check the actual data in profiles table
SELECT id, email, role, full_name, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- If role column doesn't exist, add it
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- Update existing users based on students_personals
UPDATE profiles 
SET role = 'student'
WHERE id IN (SELECT student_id FROM students_personals);

UPDATE profiles 
SET role = 'personal'
WHERE id IN (SELECT DISTINCT personal_id FROM students_personals);

-- Verify
SELECT id, email, role, full_name
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
