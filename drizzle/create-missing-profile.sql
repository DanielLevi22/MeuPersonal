-- Check if user exists in auth.users but not in profiles
SELECT 
  u.id,
  u.email,
  u.created_at as auth_created,
  p.id as profile_id,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = '0f0b4e28-be8f-48b1-8fbc-0be90cc5665f';

-- If profile doesn't exist, create it manually
INSERT INTO profiles (id, email, role, full_name)
SELECT 
  u.id,
  COALESCE(u.email, 'student_' || u.id || '@temp.local'),
  (CASE 
    WHEN EXISTS (SELECT 1 FROM students_personals WHERE student_id = u.id) THEN 'student'
    WHEN EXISTS (SELECT 1 FROM students_personals WHERE personal_id = u.id) THEN 'personal'
    ELSE 'student'
  END)::user_role,
  COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
WHERE u.id = '0f0b4e28-be8f-48b1-8fbc-0be90cc5665f'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT id, email, role, full_name
FROM profiles
WHERE id = '0f0b4e28-be8f-48b1-8fbc-0be90cc5665f';
