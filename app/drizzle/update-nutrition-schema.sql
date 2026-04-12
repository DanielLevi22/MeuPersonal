-- Update Nutrition Schema: Fix Meal Creation and Add Features

-- 1. Relax day_of_week constraint to allow -1 (Unique Plan)
ALTER TABLE meals 
DROP CONSTRAINT IF EXISTS meals_day_of_week_check;

ALTER TABLE meals 
ADD CONSTRAINT meals_day_of_week_check 
CHECK (day_of_week >= -1 AND day_of_week <= 6);

-- 2. Add meal_time column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'meals' AND COLUMN_NAME = 'meal_time') THEN
        ALTER TABLE meals ADD COLUMN meal_time TEXT;
    END IF;
END $$;

-- 3. Add meal_type and meal_order if missing (consistency check)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'meals' AND COLUMN_NAME = 'meal_type') THEN
        ALTER TABLE meals ADD COLUMN meal_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'meals' AND COLUMN_NAME = 'meal_order') THEN
        ALTER TABLE meals ADD COLUMN meal_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Add target macros per meal (Performance improvement for dashboard)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'meals' AND COLUMN_NAME = 'target_protein') THEN
        ALTER TABLE meals ADD COLUMN target_protein NUMERIC DEFAULT 0;
        ALTER TABLE meals ADD COLUMN target_carbs NUMERIC DEFAULT 0;
        ALTER TABLE meals ADD COLUMN target_fat NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 5. Comments for documentation
COMMENT ON COLUMN meals.day_of_week IS '-1 for unique plans, 0-6 for cyclic plans';
COMMENT ON COLUMN meals.meal_time IS 'Format HH:MM';
