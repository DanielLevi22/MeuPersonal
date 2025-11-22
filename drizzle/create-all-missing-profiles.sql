-- Create missing profiles for all users in auth.users
INSERT INTO profiles (id, email, role, full_name)
SELECT 
  u.id,
  COALESCE(u.email, 'user_' || u.id || '@temp.local'),
  (CASE 
    WHEN EXISTS (SELECT 1 FROM students_personals WHERE student_id = u.id) THEN 'student'
    WHEN EXISTS (SELECT 1 FROM students_personals WHERE personal_id = u.id) THEN 'personal'
    ELSE 'personal'
  END)::user_role,
  COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Verify all users now have profiles
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM profiles) as missing_profiles
FROM auth.users;

-- Show all profiles
SELECT id, email, role, full_name, created_at
FROM profiles
ORDER BY created_at DESC;
