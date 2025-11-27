-- Migration: Add missing columns to daily_goals
-- Description: Adds water_target, water_completed, sleep_target, sleep_completed columns
-- Date: 2025-11-27

ALTER TABLE daily_goals 
ADD COLUMN IF NOT EXISTS water_target INT DEFAULT 2000,
ADD COLUMN IF NOT EXISTS water_completed INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sleep_target INT DEFAULT 8,
ADD COLUMN IF NOT EXISTS sleep_completed INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add completion_percentage calculation trigger
CREATE OR REPLACE FUNCTION update_daily_goal_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_total_target INT;
  v_total_completed INT;
BEGIN
  -- Calculate total targets and completed
  v_total_target := NEW.meals_target + NEW.workout_target;
  v_total_completed := NEW.meals_completed + NEW.workout_completed;
  
  -- Calculate percentage
  IF v_total_target > 0 THEN
    NEW.completion_percentage := ROUND((v_total_completed::FLOAT / v_total_target::FLOAT) * 100);
  ELSE
    NEW.completion_percentage := 0;
  END IF;
  
  -- Mark as completed if 100%
  NEW.completed := (NEW.completion_percentage >= 100);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_completion ON daily_goals;
CREATE TRIGGER trigger_update_completion
  BEFORE INSERT OR UPDATE ON daily_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_goal_completion();
