-- Create workout_assignments table for many-to-many relationship
CREATE TABLE IF NOT EXISTS workout_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id),
  
  -- Prevent duplicate assignments
  UNIQUE(workout_id, student_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_assignments_workout ON workout_assignments(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_assignments_student ON workout_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_assignments_assigned_by ON workout_assignments(assigned_by);

-- Enable RLS
ALTER TABLE workout_assignments ENABLE ROW LEVEL SECURITY;

-- Personal trainers can assign their own workouts
CREATE POLICY "Personals can assign their workouts"
ON workout_assignments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_assignments.workout_id
    AND w.personal_id = auth.uid()
  )
);

-- Personal trainers can view assignments for their workouts
CREATE POLICY "Personals can view their workout assignments"
ON workout_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_assignments.workout_id
    AND w.personal_id = auth.uid()
  )
);

-- Students can view their own assignments
CREATE POLICY "Students can view their assignments"
ON workout_assignments
FOR SELECT
USING (student_id = auth.uid());

-- Personal trainers can delete assignments for their workouts
CREATE POLICY "Personals can delete their workout assignments"
ON workout_assignments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_assignments.workout_id
    AND w.personal_id = auth.uid()
  )
);
