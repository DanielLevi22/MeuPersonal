-- Migration: Add professional_id to periodizations
-- Description: Adds professional_id column to periodizations table to track which professional created/manages the periodization
-- Date: 2025-11-27

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'periodizations') THEN
    -- Add professional_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'periodizations' AND column_name = 'professional_id') THEN
      ALTER TABLE periodizations
      ADD COLUMN professional_id UUID REFERENCES profiles(id);
      
      -- Create index for performance
      CREATE INDEX idx_periodizations_professional_id ON periodizations(professional_id);
    END IF;
  END IF;
END $$;

-- Update RLS policies to use professional_id for direct access
-- This allows professionals to see periodizations they created/manage directly

-- Drop existing policy if it exists (to avoid conflicts or duplicates)
DROP POLICY IF EXISTS "professionals_manage_own_periodizations" ON periodizations;

-- Create new policy
CREATE POLICY "professionals_manage_own_periodizations" ON periodizations
FOR ALL
USING (
  professional_id = auth.uid()
);
