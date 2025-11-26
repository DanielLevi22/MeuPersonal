-- Migration: Sync Admin Metadata
-- Description: Updates auth.users metadata to match profiles table. This is required for the new RLS policies to work for existing admins.
-- Date: 2024-11-26

-- Sync admins
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{account_type}',
  '"admin"'
)
FROM public.profiles
WHERE auth.users.id = public.profiles.id
AND public.profiles.account_type = 'admin';

-- Sync professionals (optional, but good for consistency)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{account_type}',
  '"professional"'
)
FROM public.profiles
WHERE auth.users.id = public.profiles.id
AND public.profiles.account_type = 'professional';

-- Grant permissions just in case
GRANT ALL ON profiles TO postgres;
GRANT ALL ON profiles TO service_role;
