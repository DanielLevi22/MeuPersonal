-- Complete fix for student authentication
-- This migration ensures the profiles table can handle users with or without email

-- 1. Make email nullable
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- 2. Drop existing unique constraint on email
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;

-- 3. Create partial unique index (allows multiple NULLs)
DROP INDEX IF EXISTS profiles_email_unique;
CREATE UNIQUE INDEX profiles_email_unique ON profiles (email) WHERE email IS NOT NULL;

-- 4. Update the trigger to handle NULL emails properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'Email column is now nullable: %', (
    SELECT is_nullable FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  );
END $$;
