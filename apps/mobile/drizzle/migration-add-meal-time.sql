-- Add meal_time column to diet_meals table
ALTER TABLE diet_meals ADD COLUMN IF NOT EXISTS meal_time TIME;

-- Add comment
COMMENT ON COLUMN diet_meals.meal_time IS 'Suggested time for this meal (e.g., 08:00, 12:00, 18:00)';
