-- Migration: Add Diet Plan Status and Lifecycle Management
-- This migration adds status tracking and enforces lifecycle rules for diet plans

-- Step 1: Add status column with default value
ALTER TABLE diet_plans 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Step 2: Update existing plans based on current state
UPDATE diet_plans 
  SET status = CASE 
    WHEN is_active = true THEN 'active'
    WHEN end_date IS NOT NULL AND end_date < CURRENT_DATE THEN 'completed'
    ELSE 'finished'
  END
  WHERE status = 'active'; -- Only update if not already set

-- Step 3: Add check constraint for valid status values
ALTER TABLE diet_plans
  DROP CONSTRAINT IF EXISTS diet_plans_status_check;

ALTER TABLE diet_plans
  ADD CONSTRAINT diet_plans_status_check 
  CHECK (status IN ('active', 'completed', 'finished', 'draft'));

-- Step 4: Create unique index to ensure only one active plan per student
DROP INDEX IF EXISTS idx_one_active_plan_per_student;

CREATE UNIQUE INDEX idx_one_active_plan_per_student 
  ON diet_plans(student_id) 
  WHERE status = 'active';

-- Step 5: Add index for status queries
CREATE INDEX IF NOT EXISTS idx_diet_plans_status 
  ON diet_plans(student_id, status);

-- Step 6: Add comment explaining the status field
COMMENT ON COLUMN diet_plans.status IS 
  'Plan lifecycle status: active (current), completed (reached end_date), finished (manually ended), draft (not started)';
