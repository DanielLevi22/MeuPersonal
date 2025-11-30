-- Migration: Rename diet_meals to meals
-- Description: Rename diet_meals table to meals (missed in previous migration)
-- Date: 2025-11-29
-- Phase: 2 - Semantic Renaming (Fix)

-- ============================================================================
-- STEP 1: Rename diet_meals to meals
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diet_meals') THEN
    ALTER TABLE diet_meals RENAME TO meals;
    
    -- Update indexes
    ALTER INDEX IF EXISTS idx_diet_meals_plan RENAME TO idx_meals_plan;
    ALTER INDEX IF EXISTS idx_diet_meals_day RENAME TO idx_meals_day;
    
    RAISE NOTICE '✓ Renamed diet_meals to meals';
  ELSE
    RAISE NOTICE 'Table diet_meals does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'meals'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE '✓ Table meals exists';
  ELSE
    RAISE WARNING 'Table meals does not exist';
  END IF;
END $$;
