-- Migration: Restore Admin Policies for workout_exercises
-- Description: Re-adds the Admin policies that were accidentally removed.
-- Uses the secure app_metadata check to avoid RLS recursion.

BEGIN;

-- 1. Admin Policy: Manage ALL workout_exercises
-- This covers INSERT, SELECT, UPDATE, DELETE
CREATE POLICY "admins_manage_all_workout_exercises" ON workout_exercises
FOR ALL
USING (
  (auth.jwt() -> 'app_metadata' ->> 'account_type') = 'admin'
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'account_type') = 'admin'
);

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ Restored Admin policies for workout_exercises.';
END $$;
