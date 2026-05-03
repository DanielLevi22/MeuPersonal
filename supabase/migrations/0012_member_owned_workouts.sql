-- Support member-owned workouts (no specialist).
-- A member creates workouts for themselves: specialist_id = NULL, student_id = auth.uid().
-- Constraint ensures every workout still has exactly one owner.

ALTER TABLE workouts
  ALTER COLUMN specialist_id DROP NOT NULL;

ALTER TABLE workouts
  ADD COLUMN student_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE workouts
  ADD CONSTRAINT workouts_owner_check
  CHECK (specialist_id IS NOT NULL OR student_id IS NOT NULL);
