-- Cleanup: Delete failed test user 'carlos'
-- Description: Deletes the user with email 'carlos@email.com' (or similar) from auth.users.
-- This allows testing the registration flow again with the same email.

BEGIN;

DELETE FROM auth.users 
WHERE raw_user_meta_data->>'full_name' ILIKE 'carlos'
   OR email ILIKE 'carlos%';

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ Cleanup complete. You can try registering "carlos" again.';
END $$;
