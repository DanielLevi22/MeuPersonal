-- Create workout_exercise_logs table to track individual exercise completion
-- This allows students to mark sets and exercises as completed during workout execution

CREATE TABLE IF NOT EXISTS workout_exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  workout_item_id UUID REFERENCES workout_items(id) ON DELETE SET NULL,
  sets_completed INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_exercise_logs_session ON workout_exercise_logs(workout_session_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercise_logs_exercise ON workout_exercise_logs(exercise_id);

-- Enable RLS
ALTER TABLE workout_exercise_logs ENABLE ROW LEVEL SECURITY;

-- Students can create logs for their own workout sessions
CREATE POLICY "Students can create their own exercise logs"
ON workout_exercise_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    WHERE ws.id = workout_exercise_logs.workout_session_id
    AND ws.student_id = auth.uid()
  )
);

-- Students can view their own exercise logs
CREATE POLICY "Students can view their own exercise logs"
ON workout_exercise_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    WHERE ws.id = workout_exercise_logs.workout_session_id
    AND ws.student_id = auth.uid()
  )
);

-- Students can update their own exercise logs
CREATE POLICY "Students can update their own exercise logs"
ON workout_exercise_logs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    WHERE ws.id = workout_exercise_logs.workout_session_id
    AND ws.student_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    WHERE ws.id = workout_exercise_logs.workout_session_id
    AND ws.student_id = auth.uid()
  )
);

-- Personal trainers can view exercise logs for their students
CREATE POLICY "Personals can view their students exercise logs"
ON workout_exercise_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    JOIN students_personals sp ON sp.student_id = ws.student_id
    WHERE ws.id = workout_exercise_logs.workout_session_id
    AND sp.personal_id = auth.uid()
    AND sp.status = 'active'
  )
);
