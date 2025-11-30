-- Diagnostic: Check for students without auth users
-- Description: Counts students with invite codes that don't have a corresponding auth.user
-- Date: 2025-11-29

DO $$
DECLARE
  v_total_students INTEGER;
  v_students_with_code INTEGER;
  v_orphaned_students INTEGER;
  v_auth_users_count INTEGER;
BEGIN
  -- 1. Count total students in the old 'students' table (if it still exists)
  SELECT COUNT(*) INTO v_total_students FROM students;
  
  -- 2. Count students with invite codes
  SELECT COUNT(*) INTO v_students_with_code FROM students WHERE invite_code IS NOT NULL;
  
  -- 3. Count auth users that look like students (email starts with 'aluno')
  SELECT COUNT(*) INTO v_auth_users_count FROM auth.users WHERE email LIKE 'aluno%@test.com';
  
  -- 4. Check for students with invite code but no corresponding auth user
  -- We check if an auth user exists with email = 'aluno' + invite_code + '@test.com'
  SELECT COUNT(*) INTO v_orphaned_students 
  FROM students s
  WHERE s.invite_code IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.email = 'aluno' || LOWER(s.invite_code) || '@test.com'
  );

  RAISE NOTICE 'Diagnostic Results:';
  RAISE NOTICE '-------------------';
  RAISE NOTICE 'Total students in legacy table: %', v_total_students;
  RAISE NOTICE 'Students with invite codes: %', v_students_with_code;
  RAISE NOTICE 'Auth users with student email pattern: %', v_auth_users_count;
  RAISE NOTICE 'Orphaned students (have code but no auth user): %', v_orphaned_students;
  
  IF v_orphaned_students > 0 THEN
    RAISE NOTICE 'WARNING: Found % students who cannot log in. Migration required.', v_orphaned_students;
  ELSE
    RAISE NOTICE 'SUCCESS: All students with invite codes have auth users.';
  END IF;

END $$;
