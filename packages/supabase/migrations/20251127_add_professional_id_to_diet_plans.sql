-- Migration: Add professional_id to diet_plans
-- Description: Adds professional_id column to diet_plans table to track which professional created/manages the diet plan
-- Date: 2025-11-27

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diet_plans') THEN
    -- Add professional_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diet_plans' AND column_name = 'professional_id') THEN
      ALTER TABLE diet_plans
      ADD COLUMN professional_id UUID REFERENCES profiles(id);
      
      -- Create index for performance
      CREATE INDEX idx_diet_plans_professional_id ON diet_plans(professional_id);
    END IF;
  END IF;
END $$;

-- Update RLS policies to use professional_id for direct access
-- This allows professionals to see diet plans they created/manage directly

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "professionals_manage_own_diet_plans" ON diet_plans;

-- Create new policy
CREATE POLICY "professionals_manage_own_diet_plans" ON diet_plans
FOR ALL
USING (
  professional_id = auth.uid()
);
