-- Migration: Support Pending Client Relationships
-- Description: Allows creating relationships with pending students (students table) before they have a profile
-- Date: 2024-11-25

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_professional_relationships') THEN
    -- Add pending_client_id column
    ALTER TABLE client_professional_relationships
      ADD COLUMN IF NOT EXISTS pending_client_id UUID REFERENCES students(id) ON DELETE SET NULL;

    -- Make client_id nullable
    ALTER TABLE client_professional_relationships
      ALTER COLUMN client_id DROP NOT NULL;

    -- Add constraint: either client_id or pending_client_id must be set
    ALTER TABLE client_professional_relationships DROP CONSTRAINT IF EXISTS client_professional_relationships_client_check;
    
    ALTER TABLE client_professional_relationships
      ADD CONSTRAINT client_professional_relationships_client_check
      CHECK (client_id IS NOT NULL OR pending_client_id IS NOT NULL);
      
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_relationships_pending_client ON client_professional_relationships(pending_client_id);
    
    -- Update unique constraint to include pending_client_id
    -- We need a partial unique index or a complex constraint.
    -- The existing unique constraint is UNIQUE(client_id, professional_id, service_category)
    -- We should probably drop it and add two partial unique indexes.
    
    ALTER TABLE client_professional_relationships DROP CONSTRAINT IF EXISTS client_professional_relationships_client_id_professional_id_key;
    ALTER TABLE client_professional_relationships DROP CONSTRAINT IF EXISTS client_professional_relationships_client_id_professional_id_ser_key; -- Check exact name if possible, but usually it's auto-generated
    
    -- Try to drop by columns if name is unknown (Postgres doesn't support DROP CONSTRAINT BY COLUMNS directly, need name)
    -- We'll assume standard naming or just add the new indexes and let the old constraint fail if it conflicts (it won't if client_id is null)
    
    -- Create unique index for active clients
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_relationship 
    ON client_professional_relationships(client_id, professional_id, service_category) 
    WHERE client_id IS NOT NULL;
    
    -- Create unique index for pending clients
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_relationship 
    ON client_professional_relationships(pending_client_id, professional_id, service_category) 
    WHERE pending_client_id IS NOT NULL;
    
  END IF;
END $$;

-- Update the migration function to also migrate relationships
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
  
  -- Update relationships
  UPDATE client_professional_relationships
  SET client_id = p_new_profile_id,
      pending_client_id = NULL
  WHERE pending_client_id = v_pending_student_id
  AND NOT EXISTS (
    SELECT 1 FROM client_professional_relationships existing
    WHERE existing.client_id = p_new_profile_id
    AND existing.professional_id = client_professional_relationships.professional_id
    AND existing.service_category = client_professional_relationships.service_category
  );
  
  -- If there were conflicts (relationship already existed for profile), we might want to delete the pending ones or merge.
  -- The above UPDATE handles non-conflicting ones.
  -- For conflicting ones, we should probably delete the pending row as the active one takes precedence.
  
  DELETE FROM client_professional_relationships
  WHERE pending_client_id = v_pending_student_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
