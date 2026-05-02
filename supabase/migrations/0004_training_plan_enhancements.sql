-- Add missing fields needed for AI-generated periodization and training plans

ALTER TABLE training_periodizations
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS duration_weeks integer;

ALTER TABLE training_plans
  ADD COLUMN IF NOT EXISTS duration_weeks integer,
  ADD COLUMN IF NOT EXISTS focus text;
