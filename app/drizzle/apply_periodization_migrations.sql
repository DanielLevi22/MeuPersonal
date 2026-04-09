-- ============================================================================
-- PERIODIZATION SYSTEM - DATABASE MIGRATIONS
-- ============================================================================
-- Description: Complete database schema for the periodization system
-- Version: 1.0.0
-- Date: 2024-01-23
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Create periodizations table
-- ============================================================================

-- Create periodizations table
CREATE TABLE IF NOT EXISTS periodizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT NOT NULL CHECK (objective IN ('hypertrophy', 'strength', 'endurance', 'weight_loss', 'conditioning', 'general_fitness')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_duration CHECK (end_date - start_date <= 365)
);

-- Create indexes
CREATE INDEX idx_periodizations_student ON periodizations(student_id);
CREATE INDEX idx_periodizations_personal ON periodizations(personal_id);
CREATE INDEX idx_periodizations_status ON periodizations(status);
CREATE INDEX idx_periodizations_dates ON periodizations(start_date, end_date);
CREATE INDEX idx_periodizations_active ON periodizations(student_id, status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE periodizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Personal trainers can manage their periodizations"
ON periodizations FOR ALL
USING (personal_id = auth.uid());

CREATE POLICY "Students can view their periodizations"
ON periodizations FOR SELECT
USING (student_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_periodizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_periodizations_updated_at
BEFORE UPDATE ON periodizations
FOR EACH ROW
EXECUTE FUNCTION update_periodizations_updated_at();

-- ============================================================================
-- MIGRATION 2: Create training_plans table
-- ============================================================================

-- Create training_plans table
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  periodization_id UUID NOT NULL REFERENCES periodizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  training_split TEXT NOT NULL CHECK (training_split IN ('abc', 'abcd', 'abcde', 'abcdef', 'upper_lower', 'full_body', 'push_pull_legs', 'custom')),
  weekly_frequency INTEGER NOT NULL CHECK (weekly_frequency BETWEEN 1 AND 7),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  notes TEXT,
  goals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_duration CHECK (end_date - start_date <= 180)
);

-- Create indexes
CREATE INDEX idx_training_plans_periodization ON training_plans(periodization_id);
CREATE INDEX idx_training_plans_status ON training_plans(status);
CREATE INDEX idx_training_plans_dates ON training_plans(start_date, end_date);
CREATE INDEX idx_training_plans_active ON training_plans(periodization_id, status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Personal trainers can manage training plans"
ON training_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM periodizations
    WHERE periodizations.id = training_plans.periodization_id
    AND periodizations.personal_id = auth.uid()
  )
);

CREATE POLICY "Students can view their training plans"
ON training_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM periodizations
    WHERE periodizations.id = training_plans.periodization_id
    AND periodizations.student_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_training_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_training_plans_updated_at
BEFORE UPDATE ON training_plans
FOR EACH ROW
EXECUTE FUNCTION update_training_plans_updated_at();

-- ============================================================================
-- MIGRATION 3: Update workouts table
-- ============================================================================

-- Add new columns
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS training_plan_id UUID REFERENCES training_plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS identifier TEXT,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS focus_areas JSONB DEFAULT '[]'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workouts_training_plan ON workouts(training_plan_id);
CREATE INDEX IF NOT EXISTS idx_workouts_identifier ON workouts(identifier);
CREATE INDEX IF NOT EXISTS idx_workouts_difficulty ON workouts(difficulty_level);

-- Update RLS policies
DROP POLICY IF EXISTS "Personal trainers can manage workouts via training plans" ON workouts;
DROP POLICY IF EXISTS "Students can view workouts via training plans" ON workouts;

CREATE POLICY "Personal trainers can manage workouts via training plans"
ON workouts FOR ALL
USING (
  personal_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM training_plans tp
    JOIN periodizations p ON p.id = tp.periodization_id
    WHERE tp.id = workouts.training_plan_id
    AND p.personal_id = auth.uid()
  )
);

CREATE POLICY "Students can view workouts via training plans"
ON workouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_assignments
    WHERE workout_assignments.workout_id = workouts.id
    AND workout_assignments.student_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM training_plans tp
    JOIN periodizations p ON p.id = tp.periodization_id
    WHERE tp.id = workouts.training_plan_id
    AND p.student_id = auth.uid()
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('periodizations', 'training_plans', 'workouts')
ORDER BY table_name;

-- Verify indexes
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('periodizations', 'training_plans', 'workouts')
ORDER BY tablename, indexname;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('periodizations', 'training_plans', 'workouts');

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
-- Get a test personal trainer and student
DO $$
DECLARE
  v_personal_id UUID;
  v_student_id UUID;
  v_periodization_id UUID;
  v_training_plan_id UUID;
BEGIN
  -- Get first personal trainer
  SELECT id INTO v_personal_id FROM profiles WHERE role = 'personal' LIMIT 1;
  
  -- Get first student
  SELECT id INTO v_student_id FROM profiles WHERE role = 'student' LIMIT 1;
  
  IF v_personal_id IS NOT NULL AND v_student_id IS NOT NULL THEN
    -- Create sample periodization
    INSERT INTO periodizations (
      student_id,
      personal_id,
      name,
      objective,
      start_date,
      end_date,
      status
    ) VALUES (
      v_student_id,
      v_personal_id,
      'Ciclo de Hipertrofia - Q1 2024',
      'hypertrophy',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '8 weeks',
      'active'
    ) RETURNING id INTO v_periodization_id;
    
    -- Create sample training plan
    INSERT INTO training_plans (
      periodization_id,
      name,
      training_split,
      weekly_frequency,
      start_date,
      end_date,
      status
    ) VALUES (
      v_periodization_id,
      'Ficha ABC - Semanas 1-4',
      'abc',
      3,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '4 weeks',
      'active'
    ) RETURNING id INTO v_training_plan_id;
    
    RAISE NOTICE 'Sample data created successfully!';
    RAISE NOTICE 'Periodization ID: %', v_periodization_id;
    RAISE NOTICE 'Training Plan ID: %', v_training_plan_id;
  ELSE
    RAISE NOTICE 'No personal trainer or student found. Skipping sample data.';
  END IF;
END $$;
*/
