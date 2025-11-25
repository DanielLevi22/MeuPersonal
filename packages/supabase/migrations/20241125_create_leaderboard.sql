-- Migration: Create Leaderboard System
-- Description: Tables and functions for the gamification leaderboard
-- Date: 2024-11-25

-- ============================================================================
-- 1. TABLE: leaderboard_scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboard_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- Always the Monday of the week
  points INTEGER DEFAULT 0,
  breakdown JSONB DEFAULT '{}'::jsonb, -- { workouts: 100, meals: 50, streak: 20 }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one score per student per week
  UNIQUE(student_id, week_start_date)
);

-- Indexes
CREATE INDEX idx_leaderboard_week ON leaderboard_scores(week_start_date);
CREATE INDEX idx_leaderboard_points ON leaderboard_scores(points DESC);

-- ============================================================================
-- 2. RLS POLICIES
-- ============================================================================

ALTER TABLE leaderboard_scores ENABLE ROW LEVEL SECURITY;

-- Everyone can read leaderboard scores (public ranking)
CREATE POLICY "Everyone can view leaderboard" ON leaderboard_scores
  FOR SELECT USING (true);

-- Only system/triggers can insert/update (no direct user access needed usually, but we'll allow service role)
-- For now, we rely on the functions being SECURITY DEFINER

-- ============================================================================
-- 3. FUNCTION: Calculate Weekly Score
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_weekly_score(
  p_student_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
  v_week_start DATE;
  v_points_workouts INTEGER := 0;
  v_points_meals INTEGER := 0;
  v_points_streak INTEGER := 0;
  v_total_points INTEGER := 0;
  v_breakdown JSONB;
BEGIN
  -- 1. Determine Week Start (Monday)
  v_week_start := date_trunc('week', p_date)::DATE;

  -- 2. Calculate Workout Points (100 pts per completed workout session this week)
  SELECT COUNT(*) * 100 INTO v_points_workouts
  FROM workout_sessions
  WHERE student_id = p_student_id
    AND completed_at >= v_week_start
    AND completed_at < v_week_start + INTERVAL '7 days';

  -- 3. Calculate Meal Points (10 pts per completed meal this week)
  SELECT COUNT(*) * 10 INTO v_points_meals
  FROM diet_logs
  WHERE student_id = p_student_id
    AND logged_date >= v_week_start
    AND logged_date < v_week_start + INTERVAL '7 days'
    AND completed = true;

  -- 4. Calculate Streak Points (20 pts per active streak day, simplified to current streak * 20 for now, or just add fixed bonus)
  -- Better approach: Sum of daily streak bonuses for days in this week.
  -- For simplicity V1: We'll just take the current streak if it's active today.
  -- Let's stick to the design: +20 points per day of streak.
  -- We can approximate this by checking daily_goals completion.
  -- For now, let's just use a simple metric: 20 pts for every day where daily goal was 100% completed.
  
  -- Let's use daily_goals completion percentage for a more robust score
  -- 50 pts for every day with > 80% completion of goals
  SELECT COUNT(*) * 50 INTO v_points_streak
  FROM daily_goals
  WHERE student_id = p_student_id
    AND date >= v_week_start
    AND date < v_week_start + INTERVAL '7 days'
    AND (meals_completed >= meals_target AND workout_completed >= workout_target);

  v_total_points := v_points_workouts + v_points_meals + v_points_streak;
  
  v_breakdown := jsonb_build_object(
    'workouts', v_points_workouts,
    'meals', v_points_meals,
    'streak', v_points_streak
  );

  -- 5. Upsert Score
  INSERT INTO leaderboard_scores (
    student_id,
    week_start_date,
    points,
    breakdown
  ) VALUES (
    p_student_id,
    v_week_start,
    v_total_points,
    v_breakdown
  )
  ON CONFLICT (student_id, week_start_date) DO UPDATE SET
    points = EXCLUDED.points,
    breakdown = EXCLUDED.breakdown,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. TRIGGERS (Hook into existing triggers)
-- ============================================================================

-- We need to call calculate_weekly_score whenever daily_goals or workout_sessions change.
-- Since we already have triggers for calculate_daily_goals, we can chain them or add new ones.

-- Trigger on daily_goals change (covers meals and workout completion indirectly if we rely on daily_goals)
-- But daily_goals is updated by triggers.
-- Let's add a trigger on daily_goals to update the leaderboard.

CREATE OR REPLACE FUNCTION trigger_update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_weekly_score(NEW.student_id, NEW.date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_daily_goal_update ON daily_goals;
CREATE TRIGGER on_daily_goal_update
  AFTER INSERT OR UPDATE ON daily_goals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_leaderboard();

-- Also trigger on workout_sessions directly for faster feedback on workouts
CREATE OR REPLACE FUNCTION trigger_update_leaderboard_workout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL THEN
    PERFORM calculate_weekly_score(NEW.student_id, DATE(NEW.completed_at));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_workout_session_leaderboard ON workout_sessions;
CREATE TRIGGER on_workout_session_leaderboard
  AFTER UPDATE OF completed_at ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_leaderboard_workout();
