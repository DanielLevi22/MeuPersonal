-- Migration: Fix trigger_calc_goals_meal column reference
-- Description: Updates the trigger function to use 'diet_plan_id' instead of 'nutrition_plan_id'
-- which matches the actual column name in the 'meals' table.

BEGIN;

CREATE OR REPLACE FUNCTION public.trigger_calc_goals_meal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_student_id UUID;
BEGIN
  -- Fixed: Changed nutrition_plan_id to diet_plan_id
  SELECT student_id INTO v_student_id
  FROM nutrition_plans
  WHERE id = COALESCE(NEW.diet_plan_id, OLD.diet_plan_id);
  
  IF v_student_id IS NOT NULL THEN
    PERFORM calculate_daily_goals(v_student_id, CURRENT_DATE);
  END IF;
  
  RETURN NEW;
END;
$$;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✓ Function trigger_calc_goals_meal updated successfully.';
END $$;
