-- Migration: Semantic Renaming - Training Context
-- Description: Rename training-related tables to semantic names
-- Date: 2025-11-29
-- Phase: 2 - Semantic Renaming

-- ============================================================================
-- STEP 1: Rename periodizations to training_periodizations
-- ============================================================================

ALTER TABLE periodizations RENAME TO training_periodizations;

-- Update indexes
ALTER INDEX IF EXISTS idx_periodizations_student RENAME TO idx_training_periodizations_student;
ALTER INDEX IF EXISTS idx_periodizations_professional RENAME TO idx_training_periodizations_professional;
ALTER INDEX IF EXISTS idx_periodizations_pending_student RENAME TO idx_training_periodizations_pending_student;

-- ============================================================================
-- STEP 2: Rename workout_sessions to workout_executions
-- ============================================================================

ALTER TABLE workout_sessions RENAME TO workout_executions;

-- Update indexes
ALTER INDEX IF EXISTS idx_workout_sessions_student RENAME TO idx_workout_executions_student;
ALTER INDEX IF EXISTS idx_workout_sessions_workout RENAME TO idx_workout_executions_workout;
ALTER INDEX IF EXISTS idx_workout_sessions_date RENAME TO idx_workout_executions_date;

-- ============================================================================
-- STEP 3: Rename workout_set_logs to executed_sets
-- ============================================================================

ALTER TABLE workout_set_logs RENAME TO executed_sets;

-- Update foreign key column name for clarity
ALTER TABLE executed_sets
  RENAME COLUMN workout_log_id TO workout_execution_id;

-- Update indexes
ALTER INDEX IF EXISTS idx_workout_set_logs_workout_log RENAME TO idx_executed_sets_workout_execution;
ALTER INDEX IF EXISTS idx_workout_set_logs_exercise RENAME TO idx_executed_sets_exercise;

-- ============================================================================
-- STEP 4: Rename workout_items to workout_exercises
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_items') THEN
    ALTER TABLE workout_items RENAME TO workout_exercises;
    
    -- Update indexes
    ALTER INDEX IF EXISTS idx_workout_items_workout RENAME TO idx_workout_exercises_workout;
    ALTER INDEX IF EXISTS idx_workout_items_exercise RENAME TO idx_workout_exercises_exercise;
    
    RAISE NOTICE '✓ Renamed workout_items to workout_exercises';
  ELSE
    RAISE NOTICE 'Table workout_items does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Count renamed tables
  SELECT COUNT(*) INTO v_count
  FROM information_schema.tables
  WHERE table_name IN (
    'training_periodizations',
    'workout_executions', 
    'executed_sets',
    'workout_exercises'
  );
  
  RAISE NOTICE '✓ Training context tables renamed: % of 4', v_count;
  
  IF v_count >= 3 THEN
    RAISE NOTICE '✓ Training context renaming successful!';
  ELSE
    RAISE WARNING 'Some tables may not have been renamed';
  END IF;
END $$;
