-- Migration: Add RPG Levels
-- Description: Adds XP and Level columns to profiles and automation logic
-- Date: 2024-11-25

-- ============================================================================
-- 1. ALTER TABLE: profiles
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- ============================================================================
-- 2. FUNCTION: Calculate Level
-- ============================================================================

-- Formula: Level = floor(0.05 * sqrt(XP)) + 1
-- Inverse: XP = ((Level - 1) * 20)^2
CREATE OR REPLACE FUNCTION calculate_level_from_xp(p_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Prevent negative XP
  IF p_xp < 0 THEN
    RETURN 1;
  END IF;
  
  RETURN FLOOR(0.05 * SQRT(p_xp)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 3. TRIGGER: Update Level on XP Change
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_level()
RETURNS TRIGGER AS $$
DECLARE
  v_new_level INTEGER;
BEGIN
  -- Only recalculate if XP changed
  IF NEW.xp IS DISTINCT FROM OLD.xp THEN
    v_new_level := calculate_level_from_xp(NEW.xp);
    
    -- If level changed, we could add a notification or achievement here in the future
    NEW.level := v_new_level;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_xp_change ON profiles;
CREATE TRIGGER on_xp_change
  BEFORE INSERT OR UPDATE OF xp ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_level();

-- ============================================================================
-- 4. TRIGGER: Award XP for Activities (Integration)
-- ============================================================================

-- Trigger to award XP when Leaderboard Score updates (since it aggregates points)
-- Or better, award XP directly from the source activities to be real-time.

-- 4.1 XP for Workouts (+100 XP)
CREATE OR REPLACE FUNCTION trigger_award_xp_workout()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award if completed_at is set and was null/different
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR NEW.completed_at != OLD.completed_at) THEN
    UPDATE profiles
    SET xp = xp + 100
    WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_workout_xp ON workout_sessions;
CREATE TRIGGER on_workout_xp
  AFTER UPDATE OF completed_at ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_award_xp_workout();

-- 4.2 XP for Meals (+10 XP)
CREATE OR REPLACE FUNCTION trigger_award_xp_meal()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award if completed is true
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    UPDATE profiles
    SET xp = xp + 10
    WHERE id = NEW.student_id;
  -- Remove XP if unchecked (optional, but fair)
  ELSIF NEW.completed = false AND OLD.completed = true THEN
    UPDATE profiles
    SET xp = GREATEST(0, xp - 10)
    WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_meal_xp ON diet_logs;
CREATE TRIGGER on_meal_xp
  AFTER INSERT OR UPDATE OF completed ON diet_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_award_xp_meal();
