-- Migration: Row Level Security Policies for Multi-Role Access System
-- Description: Implements RLS policies for the new multi-role access control system
-- Author: MeuPersonal Team
-- Date: 2024-11-24
-- FIXED: Changed all references from 'users' to 'profiles'

-- ============================================================================
-- PART 1: ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_professional_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: PROFESSIONAL_SERVICES POLICIES
-- ============================================================================

-- Professionals can view their own services
CREATE POLICY "professionals_view_own_services" ON professional_services
FOR SELECT
USING (user_id = auth.uid());

-- Professionals can manage their own services
CREATE POLICY "professionals_manage_own_services" ON professional_services
FOR ALL
USING (user_id = auth.uid());

-- Public can view active services (for discovery/search)
CREATE POLICY "public_view_active_services" ON professional_services
FOR SELECT
USING (is_active = true);

-- ============================================================================
-- PART 3: CLIENT_PROFESSIONAL_RELATIONSHIPS POLICIES
-- ============================================================================

-- Clients can view their own relationships
CREATE POLICY "clients_view_own_relationships" ON client_professional_relationships
FOR SELECT
USING (client_id = auth.uid());

-- Professionals can view relationships where they are the professional
CREATE POLICY "professionals_view_their_relationships" ON client_professional_relationships
FOR SELECT
USING (professional_id = auth.uid());

-- Clients can create relationships (invite professionals)
CREATE POLICY "clients_invite_professionals" ON client_professional_relationships
FOR INSERT
WITH CHECK (
  client_id = auth.uid() AND
  invited_by = auth.uid()
);

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

-- Both parties can update relationship status
CREATE POLICY "parties_update_relationship_status" ON client_professional_relationships
FOR UPDATE
USING (
  client_id = auth.uid() OR
  professional_id = auth.uid()
);

-- Only the party who created can delete (before acceptance)
CREATE POLICY "creator_delete_pending_relationship" ON client_professional_relationships
FOR DELETE
USING (
  invited_by = auth.uid() AND
  relationship_status = 'pending'
);

-- ============================================================================
-- PART 4: FEATURE_ACCESS POLICIES
-- ============================================================================

-- Everyone can read feature access (public information)
CREATE POLICY "public_read_feature_access" ON feature_access
FOR SELECT
USING (true);

-- Only admins can modify (handled by service role)
-- No INSERT/UPDATE/DELETE policies for regular users

-- ============================================================================
-- PART 5: UPDATE PROFILES TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "profiles_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_profile" ON profiles;

-- Profiles can view their own profile
CREATE POLICY "profiles_view_own_profile" ON profiles
FOR SELECT
USING (id = auth.uid());

-- Profiles can update their own profile
CREATE POLICY "profiles_update_own_profile" ON profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Professionals can view profiles of their clients
CREATE POLICY "professionals_view_client_profiles" ON profiles
FOR SELECT
USING (
  id IN (
    SELECT client_id
    FROM client_professional_relationships
    WHERE professional_id = auth.uid()
    AND relationship_status = 'active'
  )
);

-- Clients can view profiles of their professionals
CREATE POLICY "clients_view_professional_profiles" ON profiles
FOR SELECT
USING (
  id IN (
    SELECT professional_id
    FROM client_professional_relationships
    WHERE client_id = auth.uid()
    AND relationship_status = 'active'
  )
);

-- ============================================================================
-- PART 6: UPDATE STUDENTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "personal_manage_students" ON students;
DROP POLICY IF EXISTS "students_view_own_profile" ON students;

-- Professionals can view students they have relationships with
CREATE POLICY "professionals_view_their_students" ON students
FOR SELECT
USING (
  id IN (
    SELECT client_id
    FROM client_professional_relationships
    WHERE professional_id = auth.uid()
    AND relationship_status = 'active'
  )
);

-- Professionals can manage students they have relationships with
CREATE POLICY "professionals_manage_their_students" ON students
FOR ALL
USING (
  id IN (
    SELECT client_id
    FROM client_professional_relationships
    WHERE professional_id = auth.uid()
    AND relationship_status = 'active'
  )
);

-- Students can view their own profile
CREATE POLICY "students_view_own_profile" ON students
FOR SELECT
USING (
  id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  )
);

-- Students can update their own profile
CREATE POLICY "students_update_own_profile" ON students
FOR UPDATE
USING (
  id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- PART 7: UPDATE DIET_PLANS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "personal_manage_diet_plans" ON diet_plans;
DROP POLICY IF EXISTS "students_view_own_diet_plans" ON diet_plans;
DROP POLICY IF EXISTS "nutritionists_manage_client_diets" ON diet_plans;
DROP POLICY IF EXISTS "trainers_view_client_diets" ON diet_plans;
DROP POLICY IF EXISTS "students_view_own_diets" ON diet_plans;
DROP POLICY IF EXISTS "autonomous_students_manage_own_diets" ON diet_plans;

-- Nutritionists can manage diet plans for their clients
CREATE POLICY "nutritionists_manage_client_diets" ON diet_plans
FOR ALL
USING (
  student_id IN (
    SELECT client_id
    FROM client_professional_relationships
    WHERE professional_id = auth.uid()
    AND service_category IN ('nutrition')
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
    AND service_category IN ('training')
    AND relationship_status = 'active'
  )
);

-- Students can view their own diet plans
CREATE POLICY "students_view_own_diets" ON diet_plans
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  )
);

-- Autonomous students with nutrition_create can manage their own diets
CREATE POLICY "autonomous_students_manage_own_diets" ON diet_plans
FOR ALL
USING (
  student_id IN (
    SELECT id FROM profiles 
    WHERE id = auth.uid() 
    AND account_type = 'autonomous_student'
  )
  AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN feature_access fa ON fa.subscription_tier = p.subscription_tier
    WHERE p.id = auth.uid()
    AND fa.feature_key = 'nutrition_create'
    AND fa.is_enabled = true
  )
);

-- ============================================================================
-- PART 8: UPDATE PERIODIZATIONS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "personal_manage_periodizations" ON periodizations;
DROP POLICY IF EXISTS "students_view_periodizations" ON periodizations;
DROP POLICY IF EXISTS "trainers_manage_client_periodizations" ON periodizations;
DROP POLICY IF EXISTS "nutritionists_view_client_periodizations" ON periodizations;
DROP POLICY IF EXISTS "students_view_own_periodizations" ON periodizations;
DROP POLICY IF EXISTS "autonomous_students_manage_own_periodizations" ON periodizations;

-- Personal trainers can manage periodizations for their clients
CREATE POLICY "trainers_manage_client_periodizations" ON periodizations
FOR ALL
USING (
  student_id IN (
    SELECT client_id
    FROM client_professional_relationships
    WHERE professional_id = auth.uid()
    AND service_category IN ('training')
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
    AND service_category IN ('nutrition')
    AND relationship_status = 'active'
  )
);

-- Students can view their own periodizations
CREATE POLICY "students_view_own_periodizations" ON periodizations
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  )
);

-- Autonomous students with periodization_create can manage their own
CREATE POLICY "autonomous_students_manage_own_periodizations" ON periodizations
FOR ALL
USING (
  student_id IN (
    SELECT id FROM profiles 
    WHERE id = auth.uid() 
    AND account_type = 'autonomous_student'
  )
  AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN feature_access fa ON fa.subscription_tier = p.subscription_tier
    WHERE p.id = auth.uid()
    AND fa.feature_key = 'periodization_create'
    AND fa.is_enabled = true
  )
);

-- ============================================================================
-- PART 9: HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has a specific feature
CREATE OR REPLACE FUNCTION user_has_feature(user_id UUID, feature feature_key)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles p
    JOIN feature_access fa ON fa.subscription_tier = p.subscription_tier
    WHERE p.id = user_id
    AND p.account_type = 'autonomous_student'
    AND fa.feature_key = feature
    AND fa.is_enabled = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's feature limit
CREATE OR REPLACE FUNCTION user_feature_limit(user_id UUID, feature feature_key)
RETURNS INTEGER AS $$
DECLARE
  limit_val INTEGER;
BEGIN
  SELECT fa.limit_value INTO limit_val
  FROM profiles p
  JOIN feature_access fa ON fa.subscription_tier = p.subscription_tier
  WHERE p.id = user_id
  AND p.account_type = 'autonomous_student'
  AND fa.feature_key = feature;
  
  RETURN COALESCE(limit_val, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION user_has_feature IS 'Check if autonomous student has access to a specific feature';
COMMENT ON FUNCTION user_feature_limit IS 'Get numeric limit for a feature (e.g., max workouts per month)';
COMMENT ON FUNCTION can_access_client_data IS 'Check if professional can access client data for a specific service';




-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION user_has_feature IS 'Check if autonomous student has access to a specific feature';
COMMENT ON FUNCTION user_feature_limit IS 'Get numeric limit for a feature (e.g., max workouts per month)';
COMMENT ON FUNCTION can_access_client_data IS 'Check if professional can access client data for a specific service';
