-- Migration: Update workouts table for periodization support
-- Description: Adds new columns to workouts table to support training plans and enhanced features

-- Add new columns to workouts table
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS training_plan_id UUID REFERENCES training_plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS identifier TEXT, -- "A", "B", "C", etc.
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS focus_areas JSONB DEFAULT '[]'::jsonb; -- ["chest", "triceps", etc.]

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_workouts_training_plan ON workouts(training_plan_id);
CREATE INDEX IF NOT EXISTS idx_workouts_identifier ON workouts(identifier);
CREATE INDEX IF NOT EXISTS idx_workouts_difficulty ON workouts(difficulty_level);

-- Add comments
COMMENT ON COLUMN workouts.training_plan_id IS 'Reference to training plan (ficha). NULL for legacy/standalone workouts';
COMMENT ON COLUMN workouts.identifier IS 'Workout identifier within training plan (A, B, C, etc.)';
COMMENT ON COLUMN workouts.estimated_duration IS 'Estimated workout duration in minutes';
COMMENT ON COLUMN workouts.difficulty_level IS 'Difficulty level: beginner, intermediate, advanced';
COMMENT ON COLUMN workouts.focus_areas IS 'JSON array of muscle groups/focus areas';

-- Update RLS policies to include training plan access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Personal trainers can manage workouts via training plans" ON workouts;
DROP POLICY IF EXISTS "Students can view workouts via training plans" ON workouts;

-- Create new policies for training plan access
CREATE POLICY "Personal trainers can manage workouts via training plans"
ON workouts FOR ALL
USING (
  -- Original condition (direct ownership)
  personal_id = auth.uid()
  OR
  -- New condition (via training plan)
  EXISTS (
    SELECT 1 FROM training_plans tp
    JOIN periodizations p ON p.id = tp.periodization_id
    WHERE tp.id = workouts.training_plan_id
    AND p.personal_id = auth.uid()
  )
);

CREATE POLICY "Students can view workouts via training plans"
ON workouts FOR SELECT
USING (
  -- Via workout assignments (existing)
  EXISTS (
    SELECT 1 FROM workout_assignments
    WHERE workout_assignments.workout_id = workouts.id
    AND workout_assignments.student_id = auth.uid()
  )
  OR
  -- Via training plan (new)
  EXISTS (
    SELECT 1 FROM training_plans tp
    JOIN periodizations p ON p.id = tp.periodization_id
    WHERE tp.id = workouts.training_plan_id
    AND p.student_id = auth.uid()
  )
);
