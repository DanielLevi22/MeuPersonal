-- Migration: Fix calculate_daily_goals column reference
-- Description: Updates the function to use 'diet_plan_id' instead of 'nutrition_plan_id'
-- when querying the 'meals' table.

BEGIN;

CREATE OR REPLACE FUNCTION public.calculate_daily_goals(p_student_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nutrition_plan_id UUID;
  v_meals_target INTEGER := 0;
  v_meals_completed INTEGER := 0;
  v_workout_target INTEGER := 0;
  v_workout_completed INTEGER := 0;
  v_day_of_week INTEGER;
BEGIN
  -- 1. Determine Day of Week (0 = Sunday, 6 = Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_date);

  -- 2. Calculate Meals Target (from active nutrition plan)
  SELECT id INTO v_nutrition_plan_id
  FROM nutrition_plans
  WHERE student_id = p_student_id AND status = 'active'
  LIMIT 1;

  IF v_nutrition_plan_id IS NOT NULL THEN
    -- Fixed: Changed nutrition_plan_id to diet_plan_id
    SELECT COUNT(*) INTO v_meals_target
    FROM meals
    WHERE diet_plan_id = v_nutrition_plan_id AND day_of_week = v_day_of_week;
  END IF;

  -- 3. Calculate Meals Completed
  -- diet_logs -> meal_logs
  SELECT COUNT(*) INTO v_meals_completed
  FROM meal_logs
  WHERE student_id = p_student_id 
    AND logged_date = p_date 
    AND completed = true;

  -- 4. Calculate Workout Target
  IF EXISTS (SELECT 1 FROM workout_assignments WHERE student_id = p_student_id) THEN
    v_workout_target := 1;
  END IF;

  -- 5. Calculate Workout Completed
  -- workout_sessions -> workout_executions
  SELECT COUNT(*) INTO v_workout_completed
  FROM workout_executions
  WHERE student_id = p_student_id 
    AND DATE(completed_at) = p_date;

  -- 6. Upsert into daily_goals
  INSERT INTO daily_goals (
    student_id,
    date,
    meals_target,
    meals_completed,
    workout_target,
    workout_completed,
    water_target,
    water_completed,
    sleep_target,
    sleep_completed
  ) VALUES (
    p_student_id,
    p_date,
    v_meals_target,
    v_meals_completed,
    v_workout_target,
    v_workout_completed,
    2000, -- Default water target (ml)
    0,    -- Default water completed
    8,    -- Default sleep target (hours)
    0     -- Default sleep completed
  )
  ON CONFLICT (student_id, date) DO UPDATE SET
    meals_target = EXCLUDED.meals_target,
    meals_completed = EXCLUDED.meals_completed,
    workout_target = EXCLUDED.workout_target,
    workout_completed = EXCLUDED.workout_completed,
    updated_at = NOW();

END;
$$;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ Function calculate_daily_goals updated successfully.';
END $$;
