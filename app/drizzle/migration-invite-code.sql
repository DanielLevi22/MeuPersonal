-- Add invite_code to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_profiles_invite_code ON profiles(invite_code);
