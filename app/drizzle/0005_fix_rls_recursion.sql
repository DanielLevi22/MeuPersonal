-- Migration: Fix RLS infinite recursion
-- Description: Uses SECURITY DEFINER functions to break the RLS loop between workouts and workout_assignments

-- Function to check if a student has access to a workout via assignment
-- Runs as owner (SECURITY DEFINER) to bypass RLS on workout_assignments, preventing recursion
CREATE OR REPLACE FUNCTION check_student_workout_assignment(p_workout_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workout_assignments
    WHERE workout_id = p_workout_id
    AND student_id = auth.uid()
  );
END;
$$;

-- Function to check if a student has access to a workout via training plan
CREATE OR REPLACE FUNCTION check_student_training_plan_access(p_training_plan_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM training_plans tp
    JOIN periodizations p ON p.id = tp.periodization_id
    WHERE tp.id = p_training_plan_id
    AND p.student_id = auth.uid()
  );
END;
$$;

-- Function to check if a personal trainer has access to a workout via training plan
CREATE OR REPLACE FUNCTION check_personal_training_plan_access(p_training_plan_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM training_plans tp
    JOIN periodizations p ON p.id = tp.periodization_id
    WHERE tp.id = p_training_plan_id
    AND p.personal_id = auth.uid()
  );
END;
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Personal trainers can manage workouts via training plans" ON workouts;
DROP POLICY IF EXISTS "Students can view workouts via training plans" ON workouts;

-- Re-create policies using the safe functions

-- Policy: Personal trainers can manage workouts
CREATE POLICY "Personal trainers can manage workouts via training plans"
ON workouts FOR ALL
USING (
  -- Direct ownership
  personal_id = auth.uid()
  OR
  -- Via training plan (using safe function)
  (training_plan_id IS NOT NULL AND check_personal_training_plan_access(training_plan_id))
);

-- Policy: Students can view workouts
CREATE POLICY "Students can view workouts via training plans"
ON workouts FOR SELECT
USING (
  -- Via workout assignments (using safe function)
  check_student_workout_assignment(id)
  OR
  -- Via training plan (using safe function)
  (training_plan_id IS NOT NULL AND check_student_training_plan_access(training_plan_id))
);

-- Add comments
COMMENT ON FUNCTION check_student_workout_assignment IS 'Checks workout assignment access safely to avoid RLS recursion';
COMMENT ON FUNCTION check_student_training_plan_access IS 'Checks training plan access for students safely';
COMMENT ON FUNCTION check_personal_training_plan_access IS 'Checks training plan access for personal trainers safely';
