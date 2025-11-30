-- Migration: Extensible Multi-Role Access Control System
-- Description: Implements semantic account types, professional services, client relationships, and freemium model
-- Author: MeuPersonal Team
-- Date: 2024-11-24
-- FIXED: Changed all references from 'users' to 'profiles'

-- ============================================================================
-- PART 1: CREATE ENUMS
-- ============================================================================

-- Account type for profiles
CREATE TYPE account_type AS ENUM (
  'professional',        -- Profissional (Personal, Nutricionista, etc)
  'managed_student',     -- Aluno gerenciado por profissional
  'autonomous_student'   -- Aluno autônomo (freemium/premium)
);

-- ============================================================================
-- PART 1.1: ENSURE BASE TABLES EXIST
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_id UUID REFERENCES profiles(id),
  email TEXT,
  full_name TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT,
  weight NUMERIC,
  height NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service categories that professionals can offer
CREATE TYPE service_category AS ENUM (
  'training',           -- Treinos e periodização
  'nutrition',          -- Nutrição e dietas
  'physiotherapy',      -- Fisioterapia (futuro)
  'psychology'          -- Psicologia esportiva (futuro)
);

-- Subscription tiers for autonomous students
CREATE TYPE subscription_tier AS ENUM (
  'free',              -- Freemium - acesso limitado
  'basic',             -- Básico - mais recursos
  'premium',           -- Premium - acesso completo
  'enterprise'         -- Empresarial (futuro)
);

-- Status of subscription
CREATE TYPE subscription_status AS ENUM (
  'active',            -- Ativa
  'past_due',          -- Vencida
  'canceled',          -- Cancelada
  'trialing'           -- Em período de teste
);

-- Status of client-professional relationship
CREATE TYPE relationship_status AS ENUM (
  'pending',           -- Convite enviado, aguardando aceitação
  'active',            -- Relacionamento ativo
  'paused',            -- Temporariamente pausado
  'ended'              -- Finalizado
);

-- Feature keys for access control
CREATE TYPE feature_key AS ENUM (
  -- Treinos
  'workouts_view',
  'workouts_create',
  'workouts_track',
  'workouts_history',
  
  -- Nutrição
  'nutrition_view',
  'nutrition_create',
  'nutrition_track',
  'nutrition_history',
  
  -- Periodização
  'periodization_view',
  'periodization_create',
  
  -- Analytics
  'analytics_basic',
  'analytics_advanced',
  
  -- Social/Community
  'community_access',
  'challenges_access',
  
  -- Limites numéricos
  'max_workouts_per_month',
  'max_meals_per_day',
  'max_students'
);

-- ============================================================================
-- PART 2: UPDATE PROFILES TABLE
-- ============================================================================

-- ============================================================================
-- PART 1.5: DROP LEGACY POLICIES
-- ============================================================================

-- Drop policies that depend on the 'role' column to allow dropping it
-- Foods table policies
DROP POLICY IF EXISTS "Personals can create custom foods" ON foods;
DROP POLICY IF EXISTS "Personals can update own foods" ON foods;
DROP POLICY IF EXISTS "Personals can delete own foods" ON foods;
DROP POLICY IF EXISTS "Students can view foods" ON foods;

-- Workouts table policies (preventative)
DROP POLICY IF EXISTS "Personals can create workouts" ON workouts;
DROP POLICY IF EXISTS "Personals can update own workouts" ON workouts;
DROP POLICY IF EXISTS "Personals can delete own workouts" ON workouts;

-- Exercises table policies (preventative)
DROP POLICY IF EXISTS "Personals can create exercises" ON exercises;
DROP POLICY IF EXISTS "Personals can update own exercises" ON exercises;
DROP POLICY IF EXISTS "Personals can delete own exercises" ON exercises;

-- Add new columns to profiles table
ALTER TABLE profiles 
  -- Remove old role column if exists (will be replaced by account_type)
  DROP COLUMN IF EXISTS role,
  
  -- Add new account type system
  ADD COLUMN account_type account_type NOT NULL DEFAULT 'managed_student',
  
  -- Subscription fields (for autonomous students)
  ADD COLUMN subscription_tier subscription_tier DEFAULT NULL,
  ADD COLUMN subscription_status subscription_status DEFAULT NULL,
  ADD COLUMN subscription_expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Professional metadata
  ADD COLUMN professional_name TEXT DEFAULT NULL,
  ADD COLUMN professional_bio TEXT DEFAULT NULL,
  ADD COLUMN cref TEXT DEFAULT NULL, -- Conselho Regional de Educação Física
  ADD COLUMN crn TEXT DEFAULT NULL,  -- Conselho Regional de Nutricionistas
  
  -- Verification
  ADD COLUMN is_verified BOOLEAN DEFAULT false,
  ADD COLUMN verified_at TIMESTAMPTZ DEFAULT NULL;

-- Add constraints
ALTER TABLE profiles
  ADD CONSTRAINT check_autonomous_has_subscription
    CHECK (
      account_type != 'autonomous_student' OR 
      subscription_tier IS NOT NULL
    );

-- Add indexes
CREATE INDEX idx_profiles_account_type ON profiles(account_type);
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier) WHERE subscription_tier IS NOT NULL;

-- ============================================================================
-- PART 3: CREATE PROFESSIONAL_SERVICES TABLE
-- ============================================================================

CREATE TABLE professional_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_category service_category NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Certification info
  certification_number TEXT,
  certification_expires_at DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique service per user
  UNIQUE(user_id, service_category)
);

-- Indexes
CREATE INDEX idx_professional_services_user ON professional_services(user_id);
CREATE INDEX idx_professional_services_category ON professional_services(service_category);
CREATE INDEX idx_professional_services_active ON professional_services(is_active) WHERE is_active = true;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_professional_services_updated_at
  BEFORE UPDATE ON professional_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 4: CREATE CLIENT_PROFESSIONAL_RELATIONSHIPS TABLE
-- ============================================================================

CREATE TABLE client_professional_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_category service_category NOT NULL,
  relationship_status relationship_status DEFAULT 'pending',
  
  -- Tracking
  invited_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ DEFAULT NULL,
  ended_reason TEXT DEFAULT NULL,
  
  -- Metadata
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique relationship
  UNIQUE(client_id, professional_id, service_category),
  
  -- Prevent self-relationship
  CHECK (client_id != professional_id)
);

-- Indexes
CREATE INDEX idx_relationships_client ON client_professional_relationships(client_id);
CREATE INDEX idx_relationships_professional ON client_professional_relationships(professional_id);
CREATE INDEX idx_relationships_status ON client_professional_relationships(relationship_status);
CREATE INDEX idx_relationships_service ON client_professional_relationships(service_category);

-- Composite indexes for common queries
CREATE INDEX idx_relationships_client_active ON client_professional_relationships(client_id, relationship_status) 
  WHERE relationship_status = 'active';
CREATE INDEX idx_relationships_professional_active ON client_professional_relationships(professional_id, relationship_status) 
  WHERE relationship_status = 'active';

-- Trigger to update updated_at
CREATE TRIGGER update_client_professional_relationships_updated_at
  BEFORE UPDATE ON client_professional_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 5: CREATE FEATURE_ACCESS TABLE
-- ============================================================================

CREATE TABLE feature_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_tier subscription_tier NOT NULL,
  feature_key feature_key NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  limit_value INTEGER DEFAULT NULL, -- For numeric limits
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique feature per tier
  UNIQUE(subscription_tier, feature_key)
);

-- Index
CREATE INDEX idx_feature_access_tier ON feature_access(subscription_tier);

-- ============================================================================
-- PART 6: SEED FEATURE_ACCESS
-- ============================================================================

-- FREE TIER (Freemium)
INSERT INTO feature_access (subscription_tier, feature_key, is_enabled, limit_value) VALUES
('free', 'workouts_view', true, NULL),
('free', 'workouts_create', false, NULL),
('free', 'workouts_track', true, NULL),
('free', 'max_workouts_per_month', true, 5),
('free', 'nutrition_view', true, NULL),
('free', 'nutrition_create', false, NULL),
('free', 'analytics_basic', false, NULL),
('free', 'community_access', false, NULL);

-- BASIC TIER
INSERT INTO feature_access (subscription_tier, feature_key, is_enabled, limit_value) VALUES
('basic', 'workouts_view', true, NULL),
('basic', 'workouts_create', true, NULL),
('basic', 'workouts_track', true, NULL),
('basic', 'max_workouts_per_month', true, 20),
('basic', 'nutrition_view', true, NULL),
('basic', 'nutrition_create', true, NULL),
('basic', 'max_meals_per_day', true, 6),
('basic', 'analytics_basic', true, NULL),
('basic', 'community_access', true, NULL);

-- PREMIUM TIER (Unlimited)
INSERT INTO feature_access (subscription_tier, feature_key, is_enabled, limit_value) VALUES
('premium', 'workouts_view', true, NULL),
('premium', 'workouts_create', true, NULL),
('premium', 'workouts_track', true, NULL),
('premium', 'workouts_history', true, NULL),
('premium', 'periodization_view', true, NULL),
('premium', 'periodization_create', true, NULL),
('premium', 'nutrition_view', true, NULL),
('premium', 'nutrition_create', true, NULL),
('premium', 'nutrition_track', true, NULL),
('premium', 'nutrition_history', true, NULL),
('premium', 'analytics_basic', true, NULL),
('premium', 'analytics_advanced', true, NULL),
('premium', 'community_access', true, NULL),
('premium', 'challenges_access', true, NULL);

-- ============================================================================
-- PART 7: UPDATE STUDENTS TABLE
-- ============================================================================

-- Add tracking columns to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Index for invite codes
CREATE INDEX IF NOT EXISTS idx_students_invite_code ON students(invite_code) WHERE invite_code IS NOT NULL;

-- ============================================================================
-- PART 8: MIGRATE EXISTING DATA
-- ============================================================================

-- Note: This migration assumes profiles table has a 'role' column with values 'personal' or 'student'
-- If the role column doesn't exist or has different values, adjust accordingly

DO $$
BEGIN
  -- Check if role column exists before migrating
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    -- Update professionals (if role column exists)
    UPDATE profiles 
    SET account_type = 'professional'
    WHERE role = 'personal';
    
    -- Create professional_services entries for existing personals
    INSERT INTO professional_services (user_id, service_category, is_active)
    SELECT id, 'training', true
    FROM profiles
    WHERE role = 'personal'
    ON CONFLICT (user_id, service_category) DO NOTHING;
    
    -- Update students
    UPDATE profiles
    SET account_type = 'managed_student'
    WHERE role = 'student';
  ELSE
    -- If no role column, set all existing users as managed_student by default
    UPDATE profiles
    SET account_type = 'managed_student'
    WHERE account_type IS NULL;
  END IF;
END $$;

-- Migrate existing student-personal relationships (if students table has personal_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'personal_id'
  ) THEN
    INSERT INTO client_professional_relationships (
      client_id,
      professional_id,
      service_category,
      relationship_status,
      started_at
    )
    SELECT 
      s.id as client_id,
      s.personal_id as professional_id,
      'training' as service_category,
      'active' as relationship_status,
      s.created_at as started_at
    FROM students s
    WHERE s.personal_id IS NOT NULL
    ON CONFLICT (client_id, professional_id, service_category) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- PART 9: COMMENTS
-- ============================================================================

COMMENT ON TYPE account_type IS 'Type of user account: professional, managed student, or autonomous student';
COMMENT ON TYPE service_category IS 'Categories of services that professionals can offer';
COMMENT ON TYPE subscription_tier IS 'Subscription tiers for autonomous students';
COMMENT ON TYPE relationship_status IS 'Status of client-professional relationship';

COMMENT ON TABLE professional_services IS 'Services offered by professional users';
COMMENT ON TABLE client_professional_relationships IS 'Relationships between clients and professionals';
COMMENT ON TABLE feature_access IS 'Feature access control by subscription tier';

COMMENT ON COLUMN profiles.account_type IS 'Type of account: professional, managed_student, or autonomous_student';
COMMENT ON COLUMN profiles.subscription_tier IS 'Subscription tier for autonomous students';
COMMENT ON COLUMN profiles.professional_name IS 'Professional display name';
COMMENT ON COLUMN profiles.cref IS 'CREF registration number for personal trainers';
COMMENT ON COLUMN profiles.crn IS 'CRN registration number for nutritionists';
