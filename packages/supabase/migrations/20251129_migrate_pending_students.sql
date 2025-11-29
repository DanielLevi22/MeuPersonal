-- Migration: Migrate Pending Students to Auth Users
-- Description: Converts existing pending students to permanent auth users with fixed IDs
-- Date: 2025-11-29

-- This script will:
-- 1. Get all pending students from 'students' table
-- 2. Create auth users for each one
-- 3. Update periodizations to point to new IDs
-- 4. Clean up old pending student records

DO $$
DECLARE
  v_student RECORD;
  v_new_student_id UUID;
  v_invite_code TEXT;
  v_email TEXT;
  v_password TEXT;
  v_result JSONB;
BEGIN
  -- Loop through all pending students
  FOR v_student IN 
    SELECT * FROM students 
    WHERE invite_code IS NOT NULL
  LOOP
    RAISE NOTICE 'Migrating student: % (ID: %)', v_student.full_name, v_student.id;
    
    -- Call the create_student_with_auth function to create permanent user
    SELECT create_student_with_auth(
      v_student.personal_id,
      v_student.full_name,
      v_student.phone,
      v_student.weight,
      v_student.height,
      v_student.notes,
      v_student.initial_assessment
    ) INTO v_result;
    
    -- Check if creation was successful
    IF (v_result->>'success')::BOOLEAN THEN
      v_new_student_id := (v_result->>'student_id')::UUID;
      v_invite_code := v_result->>'invite_code';
      
      RAISE NOTICE 'Created new auth user with ID: % and invite code: %', v_new_student_id, v_invite_code;
      
      -- Update all periodizations that reference the old student ID
      UPDATE periodizations
      SET student_id = v_new_student_id
      WHERE student_id = v_student.id;
      
      RAISE NOTICE 'Updated periodizations for student';
      
      -- Update all diet_plans that reference the old student ID
      UPDATE diet_plans
      SET student_id = v_new_student_id
      WHERE student_id = v_student.id;
      
      RAISE NOTICE 'Updated diet_plans for student';
      
      -- Update client_professional_relationships if exists
      UPDATE client_professional_relationships
      SET pending_client_id = NULL,
          client_id = v_new_student_id
      WHERE pending_client_id = v_student.id;
      
      RAISE NOTICE 'Updated client_professional_relationships for student';
      
      -- Delete the old pending student record
      DELETE FROM students WHERE id = v_student.id;
      
      RAISE NOTICE 'Deleted old pending student record';
      RAISE NOTICE '---';
    ELSE
      RAISE WARNING 'Failed to create auth user for student %: %', v_student.full_name, v_result->>'error';
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration completed!';
END $$;
