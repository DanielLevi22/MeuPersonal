-- Create workout_logs table to track student workout completions
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Note: Duplicate prevention for same-day completions is handled in the application layer
-- via the isWorkoutCompletedToday function in the store

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_logs_student ON workout_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout ON workout_logs(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_completed ON workout_logs(completed_at DESC);

-- Enable RLS
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Students can insert their own logs
CREATE POLICY "Students can create their own workout logs"
ON workout_logs
FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Students can view their own logs
CREATE POLICY "Students can view their own workout logs"
ON workout_logs
FOR SELECT
USING (student_id = auth.uid());

-- Personal trainers can view logs of their students
CREATE POLICY "Personals can view their students workout logs"
ON workout_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students_personals sp
    WHERE sp.student_id = workout_logs.student_id
    AND sp.personal_id = auth.uid()
    AND sp.status = 'active'
  )
);

-- Create a function to get workout completion status
CREATE OR REPLACE FUNCTION is_workout_completed_today(p_workout_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workout_logs
    WHERE workout_id = p_workout_id
    AND student_id = p_student_id
    AND DATE(completed_at) = CURRENT_DATE
  );
END;
$$;
