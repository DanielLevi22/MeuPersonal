-- Migration: Fix Training Split Check Constraint
-- Description: Updates training_split to allow any combination of uppercase letters
-- Date: 2025-11-28

-- Drop the existing constraint
ALTER TABLE training_plans DROP CONSTRAINT IF EXISTS training_plans_training_split_check;

-- Update any existing invalid values to 'ABC' (default safe value)
UPDATE training_plans 
SET training_split = 'ABC' 
WHERE training_split IS NULL 
   OR training_split = '' 
   OR training_split !~ '^[A-Z]+$';

-- Add the new constraint to allow any uppercase letter combination
ALTER TABLE training_plans ADD CONSTRAINT training_plans_training_split_check 
CHECK (training_split ~ '^[A-Z]+$');
