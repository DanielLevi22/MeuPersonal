-- Migration to add workout sessions tracking tables
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS workout_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  workout_item_id UUID NOT NULL REFERENCES workout_items(id) ON DELETE CASCADE,
  sets_completed INTEGER DEFAULT 0,
  actual_weight TEXT,
  actual_reps TEXT,
  notes TEXT
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workout_sessions_student ON workout_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout ON workout_sessions(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_session_items_session ON workout_session_items(session_id);
