-- Migration: Add Account Status to Profiles
-- Description: Adds account_status enum and column to profiles to manage approval workflow.
-- Date: 2024-11-25

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM (
      'pending',
      'active',
      'rejected',
      'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_status account_status DEFAULT 'pending';

-- Update existing profiles to active
UPDATE profiles SET account_status = 'active' WHERE account_status = 'pending';

-- Set default for new profiles based on account_type
-- We can't easily set conditional default in SQL DDL, so we rely on the application or trigger.
-- Let's update the handle_new_user function if it exists, or create a trigger.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, account_type, account_status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'account_type', 'student'), -- Default to student if not specified
    CASE 
      WHEN (new.raw_user_meta_data->>'account_type') = 'professional' THEN 'pending'::account_status
      ELSE 'active'::account_status -- Students and Admins (if created via seed/manual) are active by default?
      -- Actually, admins should be careful. But usually admins are manually set.
      -- Students invited via code are also active.
    END
  );
  RETURN new;
END;
$$;
