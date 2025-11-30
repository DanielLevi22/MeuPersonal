-- Migration: Semantic Renaming - Coaching Context
-- Description: Rename client_professional_relationships to coachings
-- Date: 2025-11-29
-- Phase: 2 - Semantic Renaming

-- ============================================================================
-- STEP 1: Rename table
-- ============================================================================

ALTER TABLE client_professional_relationships RENAME TO coachings;

-- ============================================================================
-- STEP 2: Rename columns for consistency
-- ============================================================================

ALTER TABLE coachings 
  RENAME COLUMN relationship_status TO status;

ALTER TABLE coachings
  RENAME COLUMN service_category TO service_type;

-- ============================================================================
-- STEP 3: Update indexes
-- ============================================================================

ALTER INDEX IF EXISTS idx_relationships_client RENAME TO idx_coachings_client;
ALTER INDEX IF EXISTS idx_relationships_professional RENAME TO idx_coachings_professional;
ALTER INDEX IF EXISTS idx_relationships_status RENAME TO idx_coachings_status;
ALTER INDEX IF EXISTS idx_relationships_service RENAME TO idx_coachings_service;
ALTER INDEX IF EXISTS idx_relationships_client_active RENAME TO idx_coachings_client_active;
ALTER INDEX IF EXISTS idx_relationships_professional_active RENAME TO idx_coachings_professional_active;

-- ============================================================================
-- STEP 4: Update constraints
-- ============================================================================

-- Rename unique constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'client_professional_relationships_client_id_professional_id_key'
  ) THEN
    ALTER TABLE coachings 
      RENAME CONSTRAINT client_professional_relationships_client_id_professional_id_key 
      TO coachings_client_professional_service_key;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Update RLS policies
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "professionals_view_their_students" ON coachings;
DROP POLICY IF EXISTS "professionals_manage_their_students" ON coachings;
DROP POLICY IF EXISTS "clients_view_professional_profiles" ON coachings;
DROP POLICY IF EXISTS "Admins can view all relationships" ON coachings;
DROP POLICY IF EXISTS "Admins can update any relationship" ON coachings;
DROP POLICY IF EXISTS "Admins can delete any relationship" ON coachings;

-- Recreate with semantic names
CREATE POLICY "professionals_view_their_coachings" ON coachings
  FOR SELECT
  USING (professional_id = auth.uid());

CREATE POLICY "clients_view_their_coachings" ON coachings
  FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "professionals_manage_their_coachings" ON coachings
  FOR ALL
  USING (professional_id = auth.uid());

CREATE POLICY "admins_manage_all_coachings" ON coachings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_old_table_exists BOOLEAN;
BEGIN
  -- Check if new table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'coachings'
  ) INTO v_table_exists;
  
  -- Check if old table still exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'client_professional_relationships'
  ) INTO v_old_table_exists;
  
  IF v_table_exists AND NOT v_old_table_exists THEN
    RAISE NOTICE '✓ Successfully renamed to coachings';
  ELSE
    RAISE WARNING 'Rename may have failed. coachings exists: %, old table exists: %', 
      v_table_exists, v_old_table_exists;
  END IF;
END $$;
