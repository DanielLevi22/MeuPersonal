-- Migration: Optimize Paste Day (RPC)
-- Description: Adds a function to handle copying/pasting entire days in a single transaction
-- Date: 2025-12-19

CREATE OR REPLACE FUNCTION paste_diet_day(
  p_diet_plan_id UUID,
  p_day_of_week INTEGER,
  p_meals JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_meal JSONB;
  v_item JSONB;
  v_new_meal_id UUID;
  v_meals_result JSONB[] := ARRAY[]::JSONB[];
  v_meal_record RECORD;
BEGIN
  -- 1. DELETE existing meals for the target day
  -- Cascade delete will handle meal_foods
  DELETE FROM meals 
  WHERE diet_plan_id = p_diet_plan_id 
  AND day_of_week = p_day_of_week;

  -- 2. Loop through input meals and insert
  FOR v_meal IN SELECT * FROM jsonb_array_elements(p_meals)
  LOOP
    -- Insert Meal
    INSERT INTO meals (
      diet_plan_id,
      day_of_week,
      name,
      meal_time,
      meal_type,
      meal_order,
      target_calories
    ) VALUES (
      p_diet_plan_id,
      p_day_of_week,
      v_meal->>'name',
      (v_meal->>'meal_time')::TIME,
      v_meal->>'meal_type',
      (v_meal->>'meal_order')::INTEGER,
      COALESCE((v_meal->>'target_calories')::INTEGER, 0)
    )
    RETURNING id INTO v_new_meal_id;

    -- Add to result array (minimal info needed for cache update if we wanted)
    -- But mostly we will refetch or rely on standard fetch
    
    -- 3. Insert Items for this meal
    IF jsonb_array_length(v_meal->'items') > 0 THEN
      INSERT INTO meal_foods (
        diet_meal_id,
        food_id,
        quantity,
        unit,
        order_index
      )
      SELECT
        v_new_meal_id,
        (item->>'food_id')::UUID,
        (item->>'quantity')::NUMERIC,
        item->>'unit',
        (item->>'order_index')::INTEGER
      FROM jsonb_array_elements(v_meal->'items') AS item;
    END IF;

  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;
