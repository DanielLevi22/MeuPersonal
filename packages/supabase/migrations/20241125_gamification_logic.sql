-- Migration: Gamification Logic (Functions & Triggers)
-- Description: Automates the calculation of daily goals and progress
-- Date: 2024-11-25

-- ============================================================================
-- 1. FUNCTION: Calculate Daily Goals
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_daily_goals(
  p_student_id UUID,
  p_date DATE
)
RETURNS void AS $$
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
    SELECT COUNT(*) INTO v_meals_target
    FROM meals
    WHERE nutrition_plan_id = v_nutrition_plan_id AND day_of_week = v_day_of_week;
  END IF;

  -- 3. Calculate Meals Completed
  SELECT COUNT(*) INTO v_meals_completed
  FROM meal_logs
  WHERE student_id = p_student_id 
    AND logged_date = p_date 
    AND completed = true;

  -- 4. Calculate Workout Target
  -- Logic: If student has ANY assigned workouts, target is 1 per day (simplification)
  IF EXISTS (SELECT 1 FROM workout_assignments WHERE student_id = p_student_id) THEN
    v_workout_target := 1;
  END IF;

  -- 5. Calculate Workout Completed
  SELECT COUNT(*) INTO v_workout_completed
  FROM workout_executions
  WHERE student_id = p_student_id 
    AND DATE(completed_at) = p_date;

  -- 6. Upsert into daily_goals
  -- We use ON CONFLICT to update existing records without losing manual data (water/sleep)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. TRIGGERS
-- ============================================================================

-- Trigger 1: On Meal Log Change (Insert/Update/Delete)
CREATE OR REPLACE FUNCTION trigger_calc_goals_meal_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate for the affected date
  PERFORM calculate_daily_goals(
    COALESCE(NEW.student_id, OLD.student_id), 
    COALESCE(NEW.logged_date, OLD.logged_date)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_meal_log_change ON meal_logs;
CREATE TRIGGER on_meal_log_change
  AFTER INSERT OR UPDATE OR DELETE ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calc_goals_meal_log();

-- Trigger 2: On Workout Execution Completion
CREATE OR REPLACE FUNCTION trigger_calc_goals_workout_execution()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate if completed_at changed (completed or uncompleted)
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR NEW.completed_at != OLD.completed_at) THEN
    PERFORM calculate_daily_goals(NEW.student_id, DATE(NEW.completed_at));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_workout_execution_complete ON workout_executions;
CREATE TRIGGER on_workout_execution_complete
  AFTER UPDATE OF completed_at ON workout_executions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calc_goals_workout_execution();

-- Trigger 3: On Meal Change (Plan Update)
CREATE OR REPLACE FUNCTION trigger_calc_goals_meal()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
BEGIN
  -- Find the student associated with this meal's plan
  SELECT student_id INTO v_student_id
  FROM nutrition_plans
  WHERE id = COALESCE(NEW.nutrition_plan_id, OLD.nutrition_plan_id);
  
  IF v_student_id IS NOT NULL THEN
    -- Recalculate for today since targets might have changed
    PERFORM calculate_daily_goals(v_student_id, CURRENT_DATE);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_meal_change ON meals;
CREATE TRIGGER on_meal_change
  AFTER INSERT OR UPDATE OR DELETE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calc_goals_meal();
