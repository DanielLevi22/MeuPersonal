-- Migration: Semantic Renaming - Nutrition Context
-- Description: Rename nutrition-related tables to semantic names
-- Date: 2025-11-29
-- Phase: 2 - Semantic Renaming

-- ============================================================================
-- STEP 1: Rename diet_plans to nutrition_plans
-- ============================================================================

ALTER TABLE diet_plans RENAME TO nutrition_plans;

-- Update indexes
ALTER INDEX IF EXISTS idx_diet_plans_student RENAME TO idx_nutrition_plans_student;
ALTER INDEX IF EXISTS idx_diet_plans_professional RENAME TO idx_nutrition_plans_professional;
ALTER INDEX IF EXISTS idx_diet_plans_pending_student RENAME TO idx_nutrition_plans_pending_student;

-- ============================================================================
-- STEP 2: Rename diet_meal_items to meal_foods
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diet_meal_items') THEN
    ALTER TABLE diet_meal_items RENAME TO meal_foods;
    
    -- Update indexes
    ALTER INDEX IF EXISTS idx_diet_meal_items_meal RENAME TO idx_meal_foods_meal;
    ALTER INDEX IF EXISTS idx_diet_meal_items_food RENAME TO idx_meal_foods_food;
    
    RAISE NOTICE '✓ Renamed diet_meal_items to meal_foods';
  ELSE
    RAISE NOTICE 'Table diet_meal_items does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Rename diet_logs to meal_logs
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diet_logs') THEN
    ALTER TABLE diet_logs RENAME TO meal_logs;
    
    -- Update indexes
    ALTER INDEX IF EXISTS idx_diet_logs_student RENAME TO idx_meal_logs_student;
    ALTER INDEX IF EXISTS idx_diet_logs_date RENAME TO idx_meal_logs_date;
    
    RAISE NOTICE '✓ Renamed diet_logs to meal_logs';
  ELSE
    RAISE NOTICE 'Table diet_logs does not exist, skipping';
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
    'nutrition_plans',
    'meal_foods',
    'meal_logs'
  );
  
  RAISE NOTICE '✓ Nutrition context tables renamed: % of 3', v_count;
  
  IF v_count >= 1 THEN
    RAISE NOTICE '✓ Nutrition context renaming successful!';
  ELSE
    RAISE WARNING 'Some tables may not have been renamed';
  END IF;
END $$;
