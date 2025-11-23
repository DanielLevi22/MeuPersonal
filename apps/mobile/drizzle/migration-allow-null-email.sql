-- Remove NOT NULL constraint from email field in profiles table
-- This allows anonymous users to have NULL emails

ALTER TABLE profiles 
ALTER COLUMN email DROP NOT NULL;

-- Also update the unique constraint to allow multiple NULL emails
-- First, drop the existing unique constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;

-- Create a unique constraint that allows multiple NULL values
-- (NULL values are not considered equal in PostgreSQL unique constraints)
CREATE UNIQUE INDEX profiles_email_unique 
ON profiles (email) 
WHERE email IS NOT NULL;
