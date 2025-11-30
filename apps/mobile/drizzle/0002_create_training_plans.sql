-- Migration: Create training_plans table
-- Description: Creates the training_plans table for managing workout plans within periodizations

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
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_duration CHECK (end_date - start_date <= 180) -- Max 6 months
);

-- Create indexes for performance
CREATE INDEX idx_training_plans_periodization ON training_plans(periodization_id);
CREATE INDEX idx_training_plans_status ON training_plans(status);
CREATE INDEX idx_training_plans_dates ON training_plans(start_date, end_date);
CREATE INDEX idx_training_plans_active ON training_plans(periodization_id, status) WHERE status = 'active';

-- Enable Row Level Security
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Personal trainers can manage training plans
CREATE POLICY "Personal trainers can manage training plans"
ON training_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM periodizations
    WHERE periodizations.id = training_plans.periodization_id
    AND periodizations.personal_id = auth.uid()
  )
);

-- RLS Policy: Students can view their training plans
CREATE POLICY "Students can view their training plans"
ON training_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM periodizations
    WHERE periodizations.id = training_plans.periodization_id
    AND periodizations.student_id = auth.uid()
  )
);

-- Create trigger for updated_at
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

-- Add comments
COMMENT ON TABLE training_plans IS 'Training plans (fichas) within periodizations';
COMMENT ON COLUMN training_plans.training_split IS 'Type of training split: abc, abcd, upper_lower, full_body, push_pull_legs, custom';
COMMENT ON COLUMN training_plans.weekly_frequency IS 'Number of training sessions per week (1-7)';
COMMENT ON COLUMN training_plans.status IS 'Current status: draft, active, completed';
COMMENT ON COLUMN training_plans.goals IS 'JSON array of specific goals for this training plan';
