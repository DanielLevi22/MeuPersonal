-- Migration: Fix workout_exercises RLS
-- Description: Simplifies the RLS policy for inserting workout_exercises.
-- Instead of a complex EXISTS clause, we ensure the user owns the parent workout.
-- Also ensures policies are permissive enough for the creator.

BEGIN;

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Professionals can insert own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Professionals can view own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Professionals can update own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Professionals can delete own workout exercises" ON workout_exercises;

-- 2. Recreate policies with explicit naming and simple logic

-- INSERT: Allow if the user is the owner of the workout (personal_id)
CREATE POLICY "professionals_insert_workout_exercises" ON workout_exercises
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_exercises.workout_id
    AND personal_id = auth.uid()
  )
);

-- SELECT: Allow if user is owner OR if it's assigned to a student (via join)
-- Simplified for now: Owner can always view
CREATE POLICY "professionals_select_workout_exercises" ON workout_exercises
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_exercises.workout_id
    AND personal_id = auth.uid()
  )
);

-- UPDATE: Owner can update
CREATE POLICY "professionals_update_workout_exercises" ON workout_exercises
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_exercises.workout_id
    AND personal_id = auth.uid()
  )
);

-- DELETE: Owner can delete
CREATE POLICY "professionals_delete_workout_exercises" ON workout_exercises
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_exercises.workout_id
    AND personal_id = auth.uid()
  )
);

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ Refreshed workout_exercises policies.';
END $$;
