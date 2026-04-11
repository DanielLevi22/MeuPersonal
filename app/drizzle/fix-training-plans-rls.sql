-- Fix RLS policies for training_plans and workouts
-- The original policies referenced the old 'periodizations' table
-- which was renamed to 'training_periodizations'.
-- Run this in the Supabase Dashboard > SQL Editor.

-- 1. Fix training_plans policies
DROP POLICY IF EXISTS "Personal trainers can manage training plans" ON training_plans;
DROP POLICY IF EXISTS "Students can view their training plans" ON training_plans;

CREATE POLICY "Personal trainers can manage training plans"
ON training_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM training_periodizations
    WHERE training_periodizations.id = training_plans.periodization_id
    AND training_periodizations.professional_id = auth.uid()
  )
);

CREATE POLICY "Students can view their training plans"
ON training_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM training_periodizations
    WHERE training_periodizations.id = training_plans.periodization_id
    AND training_periodizations.student_id = auth.uid()
  )
);

-- 2. Fix workouts policies (if they also reference the old table)
DROP POLICY IF EXISTS "Personal trainers can manage workouts via training plans" ON workouts;
DROP POLICY IF EXISTS "Students can view workouts via training plans" ON workouts;

CREATE POLICY "Personal trainers can manage workouts via training plans"
ON workouts FOR ALL
USING (
  personal_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM training_plans tp
    JOIN training_periodizations tper ON tper.id = tp.periodization_id
    WHERE tp.id = workouts.training_plan_id
    AND tper.professional_id = auth.uid()
  )
);

CREATE POLICY "Students can view workouts via training plans"
ON workouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM training_plans tp
    JOIN training_periodizations tper ON tper.id = tp.periodization_id
    WHERE tp.id = workouts.training_plan_id
    AND tper.student_id = auth.uid()
  )
);
