-- Migration: Consolidate Students into Profiles
-- Description: Phase 1 of database restructuring - migrate data from students to profiles
-- Date: 2025-11-29
-- Part: 2/3 - Migrate data from students to profiles

-- ============================================================================
-- IMPORTANT: Run this AFTER step 1 (add fields)
-- ============================================================================

-- ============================================================================
-- STEP 1: Migrate data from students table to profiles
-- ============================================================================

DO $$
DECLARE
  v_migrated_count INTEGER := 0;
  v_students_count INTEGER;
BEGIN
  -- Count existing students
  SELECT COUNT(*) INTO v_students_count FROM students;
  RAISE NOTICE 'Found % records in students table', v_students_count;
  
  -- Migrate data for students that exist in profiles
  -- (students created via auth have matching profile)
  UPDATE profiles p
  SET 
    weight = s.weight,
    height = s.height,
    birth_date = s.birth_date,
    gender = s.gender,
    notes = s.notes,
    phone = COALESCE(p.phone, s.phone) -- Keep existing phone if set
  FROM students s
  WHERE p.id = s.id
    AND s.id IN (SELECT id FROM auth.users); -- Only migrate auth users
  
  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % student records to profiles', v_migrated_count;
  
  -- Handle pending students (those with invite_code but no auth user yet)
  -- These will be handled by the existing migration system
  RAISE NOTICE 'Pending students with invite codes will be handled by existing invite system';
  
END $$;

-- ============================================================================
-- STEP 2: Verify migration
-- ============================================================================

DO $$
DECLARE
  v_profiles_with_student_data INTEGER;
  v_auth_students INTEGER;
BEGIN
  -- Count profiles that now have student data
  SELECT COUNT(*) INTO v_profiles_with_student_data
  FROM profiles
  WHERE account_type IN ('managed_student', 'autonomous_student')
    AND (weight IS NOT NULL OR height IS NOT NULL OR notes IS NOT NULL);
  
  -- Count students that are auth users
  SELECT COUNT(*) INTO v_auth_students
  FROM students s
  WHERE s.id IN (SELECT id FROM auth.users);
  
  RAISE NOTICE '✓ Profiles with student data: %', v_profiles_with_student_data;
  RAISE NOTICE '✓ Auth students in old table: %', v_auth_students;
  
  IF v_profiles_with_student_data >= v_auth_students THEN
    RAISE NOTICE '✓ Migration successful!';
  ELSE
    RAISE WARNING '⚠ Some data may not have migrated. Please verify.';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create backup of students table (for safety)
-- ============================================================================

DO $$
BEGIN
  -- Create backup table
  CREATE TABLE IF NOT EXISTS students_backup_20251129 AS 
  SELECT * FROM students;
  
  -- Add comment
  EXECUTE 'COMMENT ON TABLE students_backup_20251129 IS ''Backup of students table before consolidation into profiles''';
  
  RAISE NOTICE '✓ Created backup table: students_backup_20251129';
END $$;
