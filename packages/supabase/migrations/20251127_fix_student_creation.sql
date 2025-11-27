-- Migration: Fix Student Creation
-- Description: Adds initial_assessment column to students table to store assessment data during invite.
-- Date: 2025-11-27

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
    -- Add initial_assessment column if it doesn't exist
    ALTER TABLE students
      ADD COLUMN IF NOT EXISTS initial_assessment JSONB DEFAULT NULL;
      
    -- Ensure invite_code is unique if not already
    -- (It should be from previous migrations, but good to ensure)
    -- ALTER TABLE students ADD CONSTRAINT students_invite_code_key UNIQUE (invite_code);
  END IF;
END $$;
