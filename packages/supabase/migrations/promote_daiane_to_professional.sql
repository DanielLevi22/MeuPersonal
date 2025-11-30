-- Migration: Promote User to Professional
-- Description: Updates the profile of 'daiane' (email: daniane@email.com) to be a Professional.
-- This allows her to create and manage HER OWN workouts.
-- Note: She will NOT be able to edit workouts created by other professionals unless she becomes the owner.

BEGIN;

UPDATE profiles
SET 
  account_type = 'professional',
  is_super_admin = false
WHERE id = '63f7ae64-777f-4570-8860-498214f37106';

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ User promoted to Professional.';
END $$;
