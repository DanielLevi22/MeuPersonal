-- Normalizes workout execution tracking.
-- Adds exercise_id to workout_session_exercises (actual exercise performed, may differ from prescribed).
-- Adds workout_session_sets with per-set prescribed vs actual data for analytics.

ALTER TABLE workout_session_exercises
  ADD COLUMN IF NOT EXISTS exercise_id uuid REFERENCES exercises(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE TABLE IF NOT EXISTS workout_session_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id uuid NOT NULL REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
  set_index integer NOT NULL,
  reps_prescribed text,
  reps_actual integer,
  weight_prescribed numeric(6,2),
  weight_actual numeric(6,2),
  rest_prescribed integer,
  rest_actual integer,
  completed boolean NOT NULL DEFAULT false,
  skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS workout_session_sets_session_exercise_id_idx
  ON workout_session_sets (session_exercise_id);

ALTER TABLE workout_session_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_own_sets" ON workout_session_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_session_exercises wse
      JOIN workout_sessions ws ON ws.id = wse.session_id
      WHERE wse.id = workout_session_sets.session_exercise_id
        AND ws.student_id = auth.uid()
    )
  );
