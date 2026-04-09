-- Migration: Create periodizations table
-- Description: Creates the periodizations table for managing training cycles

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
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_duration CHECK (end_date - start_date <= 365) -- Max 1 year
);

-- Create indexes for performance
CREATE INDEX idx_periodizations_student ON periodizations(student_id);
CREATE INDEX idx_periodizations_personal ON periodizations(personal_id);
CREATE INDEX idx_periodizations_status ON periodizations(status);
CREATE INDEX idx_periodizations_dates ON periodizations(start_date, end_date);
CREATE INDEX idx_periodizations_active ON periodizations(student_id, status) WHERE status = 'active';

-- Enable Row Level Security
ALTER TABLE periodizations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Personal trainers can manage their periodizations
CREATE POLICY "Personal trainers can manage their periodizations"
ON periodizations FOR ALL
USING (personal_id = auth.uid());

-- RLS Policy: Students can view their periodizations
CREATE POLICY "Students can view their periodizations"
ON periodizations FOR SELECT
USING (student_id = auth.uid());

-- Create trigger for updated_at
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

-- Add comment
COMMENT ON TABLE periodizations IS 'Training periodization cycles for students';
COMMENT ON COLUMN periodizations.objective IS 'Main objective of the periodization: hypertrophy, strength, endurance, weight_loss, conditioning, general_fitness';
COMMENT ON COLUMN periodizations.status IS 'Current status: planned, active, completed, cancelled';
