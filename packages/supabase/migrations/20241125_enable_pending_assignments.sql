-- Migration: Enable Pending Assignments
-- Description: Allows assigning periodizations and diet plans to pending students (students table) before they have a profile
-- Date: 2024-11-25

-- 1. Update periodizations table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'periodizations') THEN
    -- Add pending_student_id column
    ALTER TABLE periodizations
      ADD COLUMN IF NOT EXISTS pending_student_id UUID REFERENCES students(id) ON DELETE SET NULL;

    -- Make student_id nullable
    ALTER TABLE periodizations
      ALTER COLUMN student_id DROP NOT NULL;

    -- Add constraint: either student_id or pending_student_id must be set
    -- Drop first to avoid error if exists
    ALTER TABLE periodizations DROP CONSTRAINT IF EXISTS periodizations_student_check;
    
    ALTER TABLE periodizations
      ADD CONSTRAINT periodizations_student_check
      CHECK (student_id IS NOT NULL OR pending_student_id IS NOT NULL);
      
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_periodizations_pending_student ON periodizations(pending_student_id);
  END IF;
END $$;

-- 2. Update diet_plans table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diet_plans') THEN
    -- Add pending_student_id column
    ALTER TABLE diet_plans
      ADD COLUMN IF NOT EXISTS pending_student_id UUID REFERENCES students(id) ON DELETE SET NULL;

    -- Make student_id nullable
    ALTER TABLE diet_plans
      ALTER COLUMN student_id DROP NOT NULL;

    -- Add constraint
    ALTER TABLE diet_plans DROP CONSTRAINT IF EXISTS diet_plans_student_check;
    
    ALTER TABLE diet_plans
      ADD CONSTRAINT diet_plans_student_check
      CHECK (student_id IS NOT NULL OR pending_student_id IS NOT NULL);
      
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_diet_plans_pending_student ON diet_plans(pending_student_id);
  END IF;
END $$;

-- 3. Add function to migrate data when student accepts invite
CREATE OR REPLACE FUNCTION migrate_pending_student_data(
  p_invite_code TEXT,
  p_new_profile_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_pending_student_id UUID;
BEGIN
  -- Get pending student id
  SELECT id INTO v_pending_student_id
  FROM students
  WHERE invite_code = p_invite_code;
  
  IF v_pending_student_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Update periodizations
  UPDATE periodizations
  SET student_id = p_new_profile_id,
      pending_student_id = NULL
  WHERE pending_student_id = v_pending_student_id;

  -- Update diet_plans
  UPDATE diet_plans
  SET student_id = p_new_profile_id,
      pending_student_id = NULL
  WHERE pending_student_id = v_pending_student_id;
  
  -- Mark student as converted (optional, or delete)
  -- For now we keep it but maybe clear the invite code so it can't be used again
  -- UPDATE students SET invite_code = NULL WHERE id = v_pending_student_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
