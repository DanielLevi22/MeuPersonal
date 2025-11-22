-- Disable email confirmation requirement for the project
-- This allows students to sign up without needing to confirm their email
-- Run this in your Supabase SQL Editor

-- Note: This is a project-level setting that affects all users
-- If you want to keep email confirmation for Personal Trainers,
-- you'll need to handle this at the application level

-- Update auth config to disable email confirmation
UPDATE auth.config 
SET enable_signup = true;

-- Alternative: You can also disable this in the Supabase Dashboard:
-- Go to Authentication → Settings → Email Auth
-- Uncheck "Enable email confirmations"

-- If you want to auto-confirm existing unconfirmed users (optional):
-- UPDATE auth.users 
-- SET email_confirmed_at = now() 
-- WHERE email_confirmed_at IS NULL 
-- AND email LIKE 'student%@gmail.com';
