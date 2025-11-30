-- Migration: Consolidate Students into Profiles
-- Description: Phase 1 of database restructuring - merge students table into profiles
-- Date: 2025-11-29
-- Part: 1/3 - Add student fields to profiles

-- ============================================================================
-- STEP 1: Add student-specific fields to profiles table
-- ============================================================================

DO $$
BEGIN
  -- Add weight column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'weight') THEN
    ALTER TABLE profiles ADD COLUMN weight NUMERIC;
    RAISE NOTICE 'Added weight column to profiles';
  END IF;
  
  -- Add height column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'height') THEN
    ALTER TABLE profiles ADD COLUMN height NUMERIC;
    RAISE NOTICE 'Added height column to profiles';
  END IF;
  
  -- Add birth_date column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'birth_date') THEN
    ALTER TABLE profiles ADD COLUMN birth_date DATE;
    RAISE NOTICE 'Added birth_date column to profiles';
  END IF;
  
  -- Add gender column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
    ALTER TABLE profiles ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));
    RAISE NOTICE 'Added gender column to profiles';
  END IF;
  
  -- Add notes column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notes') THEN
    ALTER TABLE profiles ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column to profiles';
  END IF;
  
  RAISE NOTICE '✓ Student fields migration completed';
END $$;

-- ============================================================================
-- STEP 2: Create indexes for new fields
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON profiles(birth_date);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);

-- ============================================================================
-- STEP 3: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN profiles.weight IS 'Student weight in kg (for managed/autonomous students)';
COMMENT ON COLUMN profiles.height IS 'Student height in cm (for managed/autonomous students)';
COMMENT ON COLUMN profiles.birth_date IS 'Student birth date (for managed/autonomous students)';
COMMENT ON COLUMN profiles.gender IS 'Student gender (for managed/autonomous students)';
COMMENT ON COLUMN profiles.notes IS 'General notes about the student (for managed/autonomous students)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify columns were added
DO $$
DECLARE
  v_column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name IN ('weight', 'height', 'birth_date', 'gender', 'notes');
  
  IF v_column_count = 5 THEN
    RAISE NOTICE '✓ All 5 student fields successfully added to profiles';
  ELSE
    RAISE WARNING '✗ Expected 5 fields, found %', v_column_count;
  END IF;
END $$;
