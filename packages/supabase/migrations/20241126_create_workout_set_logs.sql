-- Create workout_set_logs table to track individual set performance
CREATE TABLE IF NOT EXISTS workout_set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  workout_item_id UUID NOT NULL REFERENCES workout_items(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps_completed INTEGER NOT NULL,
  weight_used DECIMAL(5,2),
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT workout_set_logs_set_number_check CHECK (set_number > 0),
  CONSTRAINT workout_set_logs_reps_check CHECK (reps_completed > 0)
);

-- Create indexes
CREATE INDEX idx_workout_set_logs_workout_log_id ON workout_set_logs(workout_log_id);
CREATE INDEX idx_workout_set_logs_workout_item_id ON workout_set_logs(workout_item_id);

-- Enable RLS
ALTER TABLE workout_set_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own set logs
CREATE POLICY "Students can view own set logs"
  ON workout_set_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs wl
      WHERE wl.id = workout_set_logs.workout_log_id
      AND wl.student_id = auth.uid()
    )
  );

-- Students can insert their own set logs
CREATE POLICY "Students can insert own set logs"
  ON workout_set_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_logs wl
      WHERE wl.id = workout_set_logs.workout_log_id
      AND wl.student_id = auth.uid()
    )
  );

-- Professionals can view set logs of their students
CREATE POLICY "Professionals can view student set logs"
  ON workout_set_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs wl
      WHERE wl.id = workout_set_logs.workout_log_id
      AND EXISTS (
        SELECT 1 FROM client_professional_relationships cpr
        WHERE cpr.client_id = wl.student_id
        AND cpr.professional_id = auth.uid()
        AND cpr.relationship_status = 'active'
      )
    )
  );

-- Function to calculate performance metrics
CREATE OR REPLACE FUNCTION calculate_workout_performance(p_workout_log_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_sets', COUNT(*),
    'completed_sets', COUNT(*) FILTER (WHERE completed = true),
    'total_reps', SUM(reps_completed),
    'total_volume', SUM(reps_completed * COALESCE(weight_used, 0)),
    'avg_reps_per_set', AVG(reps_completed),
    'exercises_completed', COUNT(DISTINCT workout_item_id)
  )
  INTO v_result
  FROM workout_set_logs
  WHERE workout_log_id = p_workout_log_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to compare planned vs actual performance
CREATE OR REPLACE FUNCTION compare_workout_performance(p_workout_log_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH planned AS (
    SELECT 
      wi.id as item_id,
      wi.exercise_id,
      wi.sets as planned_sets,
      wi.reps::INTEGER as planned_reps,
      wi.weight::DECIMAL as planned_weight
    FROM workout_logs wl
    JOIN workout_items wi ON wi.workout_id = wl.workout_id
    WHERE wl.id = p_workout_log_id
  ),
  actual AS (
    SELECT 
      workout_item_id,
      COUNT(*) as actual_sets,
      AVG(reps_completed) as avg_reps,
      AVG(weight_used) as avg_weight
    FROM workout_set_logs
    WHERE workout_log_id = p_workout_log_id
    GROUP BY workout_item_id
  )
  SELECT json_agg(
    json_build_object(
      'exercise_id', p.exercise_id,
      'planned_sets', p.planned_sets,
      'actual_sets', COALESCE(a.actual_sets, 0),
      'planned_reps', p.planned_reps,
      'actual_reps', COALESCE(a.avg_reps, 0),
      'planned_weight', p.planned_weight,
      'actual_weight', COALESCE(a.avg_weight, 0),
      'completion_rate', CASE 
        WHEN p.planned_sets > 0 THEN (COALESCE(a.actual_sets, 0)::DECIMAL / p.planned_sets) * 100
        ELSE 0
      END
    )
  )
  INTO v_result
  FROM planned p
  LEFT JOIN actual a ON a.workout_item_id = p.item_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_workout_performance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION compare_workout_performance(UUID) TO authenticated;

-- Comment
COMMENT ON TABLE workout_set_logs IS 'Tracks individual set performance during workout execution';
COMMENT ON FUNCTION calculate_workout_performance IS 'Calculates overall performance metrics for a workout session';
COMMENT ON FUNCTION compare_workout_performance IS 'Compares planned workout vs actual execution';
