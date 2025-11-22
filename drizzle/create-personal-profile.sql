-- Create profile for the specific personal trainer
INSERT INTO profiles (id, email, role, full_name)
SELECT 
  u.id,
  COALESCE(u.email, 'user_' || u.id || '@temp.local'),
  'personal'::user_role,
  COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
WHERE u.id = '01cddf18-26a8-410e-b583-14154da9df05'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Verify the profile was created
SELECT id, email, role, full_name
FROM profiles
WHERE id = '01cddf18-26a8-410e-b583-14154da9df05';
