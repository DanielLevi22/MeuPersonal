-- Add RLS policy to allow students to view workouts assigned to them

-- First, ensure RLS is enabled on workouts table
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to make this migration idempotent)
DROP POLICY IF EXISTS "Students can view assigned workouts" ON workouts;

-- Create policy for students to view workouts assigned to them
-- Note: Using 'id' directly instead of 'workouts.id' to avoid infinite recursion
CREATE POLICY "Students can view assigned workouts"
ON workouts
FOR SELECT
USING (
  -- Allow if there's an assignment for this student
  EXISTS (
    SELECT 1 FROM workout_assignments wa
    WHERE wa.workout_id = id
    AND wa.student_id = auth.uid()
  )
  OR
  -- Also allow if this is a legacy assignment (student_id field)
  student_id = auth.uid()
);

-- Ensure personal trainers can still view their own workouts
DROP POLICY IF EXISTS "Personals can view their workouts" ON workouts;

CREATE POLICY "Personals can view their workouts"
ON workouts
FOR SELECT
USING (personal_id = auth.uid());
