-- Drop the table that has the wrong foreign key
DROP TABLE IF EXISTS workout_session_items;

-- Recreate it pointing to the correct table (workout_sessions)
CREATE TABLE workout_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  workout_item_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  sets_completed INTEGER DEFAULT 0,
  actual_weight TEXT,
  actual_reps TEXT,
  notes TEXT
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_workout_session_items_session ON workout_session_items(session_id);

-- Enable RLS
ALTER TABLE workout_session_items ENABLE ROW LEVEL SECURITY;

-- Re-apply policies

-- Users can view items of their own sessions
CREATE POLICY "Users can view their own workout session items"
ON workout_session_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions
    WHERE workout_sessions.id = workout_session_items.session_id
    AND workout_sessions.student_id = auth.uid()
  )
);

-- Users can insert items into their own sessions
CREATE POLICY "Users can insert items into their own workout sessions"
ON workout_session_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_sessions
    WHERE workout_sessions.id = workout_session_items.session_id
    AND workout_sessions.student_id = auth.uid()
  )
);

-- Users can update items of their own sessions
CREATE POLICY "Users can update their own workout session items"
ON workout_session_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions
    WHERE workout_sessions.id = workout_session_items.session_id
    AND workout_sessions.student_id = auth.uid()
  )
);
