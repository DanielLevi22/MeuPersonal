-- Migration: Rename service categories to semantic names
-- Description: Changes 'training' to 'personal_training' and 'nutrition' to 'nutrition_consulting'
-- Author: MeuPersonal Team
-- Date: 2024-11-26

-- ============================================================================
-- PART 1: DROP POLICIES THAT DEPEND ON service_category
-- ============================================================================

-- Drop policies on client_professional_relationships
DROP POLICY IF EXISTS "professionals_invite_clients" ON client_professional_relationships;
DROP POLICY IF EXISTS "nutritionists_manage_client_diets" ON diet_plans;
DROP POLICY IF EXISTS "trainers_view_client_diets" ON diet_plans;
DROP POLICY IF EXISTS "trainers_manage_client_periodizations" ON periodizations;
DROP POLICY IF EXISTS "nutritionists_view_client_periodizations" ON periodizations;

-- Drop helper function that uses service_category
DROP FUNCTION IF EXISTS can_access_client_data(UUID, UUID, service_category);

-- ============================================================================
-- PART 2: CREATE NEW ENUM WITH SEMANTIC NAMES
-- ============================================================================

-- Create new enum type with semantic names
CREATE TYPE service_category_new AS ENUM (
  'personal_training',      -- Personal Trainer (formerly 'training')
  'nutrition_consulting',   -- Nutricionista (formerly 'nutrition')
  'physiotherapy',          -- Fisioterapia (future)
  'sports_psychology'       -- Psicologia Esportiva (future, renamed from 'psychology')
);

-- ============================================================================
-- PART 3: UPDATE TABLES TO USE NEW ENUM
-- ============================================================================

-- Update professional_services table
ALTER TABLE professional_services 
  ALTER COLUMN service_category TYPE service_category_new 
  USING (
    CASE service_category::text
      WHEN 'training' THEN 'personal_training'::service_category_new
      WHEN 'nutrition' THEN 'nutrition_consulting'::service_category_new
      WHEN 'physiotherapy' THEN 'physiotherapy'::service_category_new
      WHEN 'psychology' THEN 'sports_psychology'::service_category_new
      ELSE service_category::text::service_category_new
    END
  );

-- Update client_professional_relationships table
ALTER TABLE client_professional_relationships 
  ALTER COLUMN service_category TYPE service_category_new 
  USING (
    CASE service_category::text
      WHEN 'training' THEN 'personal_training'::service_category_new
      WHEN 'nutrition' THEN 'nutrition_consulting'::service_category_new
      WHEN 'physiotherapy' THEN 'physiotherapy'::service_category_new
      WHEN 'psychology' THEN 'sports_psychology'::service_category_new
      ELSE service_category::text::service_category_new
    END
  );

-- Update student_transfer_requests table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'student_transfer_requests'
  ) THEN
    ALTER TABLE student_transfer_requests 
      ALTER COLUMN service_category TYPE service_category_new 
      USING (
        CASE service_category::text
          WHEN 'training' THEN 'personal_training'::service_category_new
          WHEN 'nutrition' THEN 'nutrition_consulting'::service_category_new
          WHEN 'physiotherapy' THEN 'physiotherapy'::service_category_new
          WHEN 'psychology' THEN 'sports_psychology'::service_category_new
          ELSE service_category::text::service_category_new
        END
      );
  END IF;
END $$;

-- Update relationship_transfers table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'relationship_transfers'
  ) THEN
    ALTER TABLE relationship_transfers 
      ALTER COLUMN service_category TYPE service_category_new 
      USING (
        CASE service_category::text
          WHEN 'training' THEN 'personal_training'::service_category_new
          WHEN 'nutrition' THEN 'nutrition_consulting'::service_category_new
          WHEN 'physiotherapy' THEN 'physiotherapy'::service_category_new
          WHEN 'psychology' THEN 'sports_psychology'::service_category_new
          ELSE service_category::text::service_category_new
        END
      );
  END IF;
END $$;

-- ============================================================================
-- PART 4: DROP OLD ENUM AND RENAME NEW ONE
-- ============================================================================

-- Drop old enum type
DROP TYPE service_category;

-- Rename new enum to original name
ALTER TYPE service_category_new RENAME TO service_category;

-- ============================================================================
-- PART 5: RECREATE POLICIES WITH NEW VALUES
-- ============================================================================

-- Professionals can create relationships (invite clients)
CREATE POLICY "professionals_invite_clients" ON client_professional_relationships
FOR INSERT
WITH CHECK (
  professional_id = auth.uid() AND
  invited_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM professional_services
    WHERE user_id = auth.uid()
    AND service_category = client_professional_relationships.service_category
    AND is_active = true
  )
);

-- Nutritionists can manage diet plans for their clients
CREATE POLICY "nutritionists_manage_client_diets" ON diet_plans
FOR ALL
USING (
  student_id IN (
    SELECT client_id
    FROM client_professional_relationships
    WHERE professional_id = auth.uid()
    AND service_category IN ('nutrition_consulting')
    AND relationship_status = 'active'
  )
);

-- Personal trainers can VIEW diet plans of their clients
CREATE POLICY "trainers_view_client_diets" ON diet_plans
FOR SELECT
USING (
  student_id IN (
    SELECT client_id
    FROM client_professional_relationships
    WHERE professional_id = auth.uid()
    AND service_category IN ('personal_training')
    AND relationship_status = 'active'
  )
);

-- Personal trainers can manage periodizations for their clients
CREATE POLICY "trainers_manage_client_periodizations" ON periodizations
FOR ALL
USING (
  student_id IN (
    SELECT client_id
    FROM client_professional_relationships
    WHERE professional_id = auth.uid()
    AND service_category IN ('personal_training')
    AND relationship_status = 'active'
  )
);

-- Nutritionists can VIEW periodizations of their clients
CREATE POLICY "nutritionists_view_client_periodizations" ON periodizations
FOR SELECT
USING (
  student_id IN (
    SELECT client_id
    FROM client_professional_relationships
    WHERE professional_id = auth.uid()
    AND service_category IN ('nutrition_consulting')
    AND relationship_status = 'active'
  )
);

-- ============================================================================
-- PART 6: RECREATE HELPER FUNCTION
-- ============================================================================

-- Function to check if user can access a client's data
CREATE OR REPLACE FUNCTION can_access_client_data(
  professional_user_id UUID,
  client_user_id UUID,
  required_service service_category
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM client_professional_relationships
    WHERE professional_id = professional_user_id
    AND client_id = client_user_id
    AND service_category = required_service
    AND relationship_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: UPDATE COMMENTS
-- ============================================================================

COMMENT ON TYPE service_category IS 'Categories of services that professionals can offer (semantic names)';
COMMENT ON FUNCTION can_access_client_data IS 'Check if professional can access client data for a specific service';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify the migration worked:
-- SELECT service_category, COUNT(*) 
-- FROM professional_services 
-- GROUP BY service_category;
