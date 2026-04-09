-- Enable RLS
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_items ENABLE ROW LEVEL SECURITY;

-- Policies for workout_sessions

-- Students can view their own sessions
CREATE POLICY "Users can view their own workout sessions"
ON workout_sessions FOR SELECT
USING (auth.uid() = student_id);

-- Students can insert their own sessions
CREATE POLICY "Users can insert their own workout sessions"
ON workout_sessions FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can update their own sessions
CREATE POLICY "Users can update their own workout sessions"
ON workout_sessions FOR UPDATE
USING (auth.uid() = student_id);

-- Policies for workout_session_items

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
