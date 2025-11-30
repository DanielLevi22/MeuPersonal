-- Add substituted_exercise_id column to workout_set_logs to track exercise substitutions
ALTER TABLE workout_set_logs 
ADD COLUMN IF NOT EXISTS substituted_exercise_id UUID REFERENCES exercises(id);

-- Add comment
COMMENT ON COLUMN workout_set_logs.substituted_exercise_id IS 'Tracks if the student substituted the original exercise with a different one';

-- Function to get exercise substitutions for a workout log
CREATE OR REPLACE FUNCTION get_exercise_substitutions(p_workout_log_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'workout_item_id', wsl.workout_item_id,
      'original_exercise', json_build_object(
        'id', e1.id,
        'name', e1.name,
        'muscle_group', e1.muscle_group
      ),
      'substituted_exercise', json_build_object(
        'id', e2.id,
        'name', e2.name,
        'muscle_group', e2.muscle_group
      ),
      'sets_count', COUNT(*)
    )
  )
  INTO v_result
  FROM workout_set_logs wsl
  JOIN workout_items wi ON wi.id = wsl.workout_item_id
  JOIN exercises e1 ON e1.id = wi.exercise_id
  JOIN exercises e2 ON e2.id = wsl.substituted_exercise_id
  WHERE wsl.workout_log_id = p_workout_log_id
    AND wsl.substituted_exercise_id IS NOT NULL
  GROUP BY wsl.workout_item_id, e1.id, e1.name, e1.muscle_group, e2.id, e2.name, e2.muscle_group;
  
  RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_exercise_substitutions(UUID) TO authenticated;

COMMENT ON FUNCTION get_exercise_substitutions IS 'Returns list of exercise substitutions made during workout execution';
