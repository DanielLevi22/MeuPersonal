-- Add RLS policy to allow students to view workout_items for assigned workouts

-- Enable RLS on workout_items if not already enabled
ALTER TABLE workout_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view workout items for assigned workouts" ON workout_items;
DROP POLICY IF EXISTS "Personals can manage their workout items" ON workout_items;

-- Students can view workout items for workouts assigned to them
CREATE POLICY "Students can view workout items for assigned workouts"
ON workout_items
FOR SELECT
USING (
  -- Check if workout is assigned to the student via workout_assignments
  workout_id IN (
    SELECT workout_id 
    FROM workout_assignments 
    WHERE student_id = auth.uid()
  )
  OR
  -- Also support legacy student_id field on workouts table
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_items.workout_id
    AND w.student_id = auth.uid()
  )
);

-- Personal trainers can do everything with their workout items
CREATE POLICY "Personals can manage their workout items"
ON workout_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_items.workout_id
    AND w.personal_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_items.workout_id
    AND w.personal_id = auth.uid()
  )
);
