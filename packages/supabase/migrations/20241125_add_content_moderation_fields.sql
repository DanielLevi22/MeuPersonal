-- Migration: 20241125_add_content_moderation_fields.sql

-- Add moderation fields to exercises
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add moderation fields to foods
ALTER TABLE foods
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercises_status ON exercises(status);
CREATE INDEX IF NOT EXISTS idx_foods_status ON foods(status);
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON exercises(created_by);
CREATE INDEX IF NOT EXISTS idx_foods_created_by ON foods(created_by);

-- Comments
COMMENT ON COLUMN exercises.status IS 'Status de moderação: pending, approved, rejected';
COMMENT ON COLUMN exercises.is_verified IS 'Se o exercício foi verificado pela equipe oficial';
COMMENT ON COLUMN foods.status IS 'Status de moderação: pending, approved, rejected';
COMMENT ON COLUMN foods.is_verified IS 'Se o alimento foi verificado pela equipe oficial';
