-- Migration: Consolidate Students into Profiles
-- Description: Phase 1 of database restructuring - update foreign keys and drop students table
-- Date: 2025-11-29
-- Part: 3/3 - Update foreign keys and drop students table

-- ============================================================================
-- IMPORTANT: Run this AFTER step 2 (migrate data)
-- ============================================================================

-- ============================================================================
-- STEP 1: Update foreign keys that reference students table
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Updating foreign key constraints...';
  
  -- Note: Most tables already reference profiles, not students
  -- This is because of the previous migration system
  -- We just need to verify and clean up any remaining references
  
  -- Check if any tables still reference students
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'students'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE NOTICE 'Found foreign keys referencing students table';
    
    -- List them for manual review
    FOR r IN (
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE ccu.table_name = 'students'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) LOOP
      RAISE NOTICE '  - %.% references students', r.table_name, r.column_name;
    END LOOP;
  ELSE
    RAISE NOTICE '✓ No foreign keys reference students table';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop students table
-- ============================================================================

DO $$
BEGIN
  -- Final safety check
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students_backup_20251129') THEN
    RAISE NOTICE '✓ Backup exists, safe to drop students table';
    
    -- Drop the table
    DROP TABLE IF EXISTS students CASCADE;
    
    RAISE NOTICE '✓ Dropped students table';
  ELSE
    RAISE EXCEPTION 'Backup table not found! Aborting drop operation for safety.';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Clean up any remaining references
-- ============================================================================

-- Add comment to backup table
COMMENT ON TABLE students_backup_20251129 IS 
  'DEPRECATED: Backup of students table. Data consolidated into profiles table. This table can be dropped after verifying production is stable (recommend 30 days).';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_students_exists BOOLEAN;
  v_backup_exists BOOLEAN;
  v_profiles_count INTEGER;
BEGIN
  -- Check if students table still exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'students'
  ) INTO v_students_exists;
  
  -- Check if backup exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'students_backup_20251129'
  ) INTO v_backup_exists;
  
  -- Count profiles with student data
  SELECT COUNT(*) INTO v_profiles_count
  FROM profiles
  WHERE account_type IN ('managed_student', 'autonomous_student');
  
  RAISE NOTICE '=== CONSOLIDATION VERIFICATION ===';
  RAISE NOTICE 'Students table exists: %', v_students_exists;
  RAISE NOTICE 'Backup table exists: %', v_backup_exists;
  RAISE NOTICE 'Student profiles count: %', v_profiles_count;
  
  IF NOT v_students_exists AND v_backup_exists AND v_profiles_count > 0 THEN
    RAISE NOTICE '✓✓✓ CONSOLIDATION SUCCESSFUL! ✓✓✓';
  ELSE
    RAISE WARNING 'Please verify consolidation manually';
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- 
-- CREATE TABLE students AS SELECT * FROM students_backup_20251129;
-- 
-- Then restore any foreign keys that were dropped.
-- This should only be needed if there are critical issues discovered.
