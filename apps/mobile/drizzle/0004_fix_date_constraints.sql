-- Fix: Update valid_date_range constraint to allow same-day periodizations
-- This allows start_date and end_date to be equal

-- Drop the old constraint
ALTER TABLE periodizations DROP CONSTRAINT IF EXISTS valid_date_range;

-- Add the corrected constraint (>= instead of >)
ALTER TABLE periodizations ADD CONSTRAINT valid_date_range CHECK (end_date >= start_date);

-- Do the same for training_plans
ALTER TABLE training_plans DROP CONSTRAINT IF EXISTS valid_date_range;
ALTER TABLE training_plans ADD CONSTRAINT valid_date_range CHECK (end_date >= start_date);
