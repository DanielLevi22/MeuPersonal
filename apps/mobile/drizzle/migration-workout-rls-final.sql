-- FINAL FIX: Completely avoid recursion by using security definer function
-- This is the most reliable approach for complex RLS scenarios

-- Step 1: Disable RLS temporarily
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'workouts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON workouts';
    END LOOP;
END $$;

-- Step 3: Create a security definer function to check if student has access
CREATE OR REPLACE FUNCTION is_workout_assigned_to_student(workout_uuid UUID, student_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workout_assignments
    WHERE workout_id = workout_uuid
    AND student_id = student_uuid
  );
END;
$$;

-- Step 4: Re-enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, non-recursive policies

-- Personal trainers can do everything with their own workouts
CREATE POLICY "personal_full_access"
ON workouts
FOR ALL
USING (personal_id = auth.uid())
WITH CHECK (personal_id = auth.uid());

-- Students can view workouts assigned to them
-- Using the security definer function avoids recursion
CREATE POLICY "student_view_assigned"
ON workouts
FOR SELECT
USING (
  is_workout_assigned_to_student(id, auth.uid())
  OR
  student_id = auth.uid()
);
