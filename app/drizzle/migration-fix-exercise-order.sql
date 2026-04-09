-- Fix exercise order for existing workout items
-- This script updates the 'order' field based on the current position in the workout

-- For each workout, update the order field sequentially
WITH ranked_exercises AS (
  SELECT 
    id,
    workout_id,
    ROW_NUMBER() OVER (PARTITION BY workout_id ORDER BY id) - 1 AS new_order
  FROM workout_exercises
)
UPDATE workout_exercises
SET "order" = ranked_exercises.new_order
FROM ranked_exercises
WHERE workout_exercises.id = ranked_exercises.id;

-- Verify the update
SELECT 
  w.title as workout_name,
  e.name as exercise_name,
  we."order" as exercise_order
FROM workout_exercises we
JOIN workouts w ON we.workout_id = w.id
JOIN exercises e ON we.exercise_id = e.id
ORDER BY w.title, we."order";
