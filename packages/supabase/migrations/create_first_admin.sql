-- Script to create your first admin user
-- Run this in Supabase SQL Editor after applying the migrations

-- IMPORTANT: Replace 'your@email.com' with your actual email address

-- Option 1: Promote existing user to admin
UPDATE profiles 
SET 
  account_type = 'admin',
  is_super_admin = true
WHERE email = 'daniel@email.com';

-- Option 2: If you need to create a new user first, use Supabase Auth
-- Then run Option 1 to promote them

-- Verify the admin was created
SELECT 
  id,
  email,
  account_type,
  is_super_admin,
  created_at
FROM profiles
WHERE account_type = 'admin';

-- Expected result:
-- You should see your user with account_type = 'admin' and is_super_admin = true
