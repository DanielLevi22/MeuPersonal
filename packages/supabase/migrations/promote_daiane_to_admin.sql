-- Migration: Promote User to Admin
-- Description: Updates the profile of 'daiane' (email: daniane@email.com) to be an admin.
-- This allows her to edit workouts and manage the system.

BEGIN;

UPDATE profiles
SET 
  account_type = 'admin',
  is_super_admin = true
WHERE id = '63f7ae64-777f-4570-8860-498214f37106';

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ User promoted to Admin.';
END $$;
