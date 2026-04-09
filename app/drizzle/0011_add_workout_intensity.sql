-- Add intensity column to workout_sessions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_sessions' AND column_name = 'intensity') THEN
        ALTER TABLE workout_sessions ADD COLUMN intensity INTEGER;
    END IF;
END $$;
