-- Fix missing profiles for existing users
-- This script inserts a profile for any user in auth.users that doesn't have one in public.profiles

INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  COALESCE((raw_user_meta_data->>'role')::user_role, 'personal'::user_role) -- Default to personal if unknown, or student? Let's assume personal for the user running this if they are trying to invite.
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Also ensure the current user has a role of 'personal' if they are trying to invite
-- (Optional, but good for debugging)
-- UPDATE public.profiles SET role = 'personal' WHERE id = auth.uid();
