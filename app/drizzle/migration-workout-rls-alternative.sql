-- ALTERNATIVE APPROACH: Disable RLS, drop all policies, then recreate
-- This ensures we start from a clean slate

-- Step 1: Disable RLS temporarily
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies (this will work even if RLS is disabled)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'workouts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON workouts';
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Step 4: Create clean, simple policies

-- Policy 1: Personal trainers can do everything with their own workouts
CREATE POLICY "personal_full_access"
ON workouts
FOR ALL
USING (personal_id = auth.uid())
WITH CHECK (personal_id = auth.uid());

-- Policy 2: Students can view workouts assigned to them
-- Using a subquery that doesn't reference the workouts table
CREATE POLICY "student_view_assigned"
ON workouts
FOR SELECT
USING (
  auth.uid() IN (
    SELECT wa.student_id 
    FROM workout_assignments wa 
    WHERE wa.workout_id = workouts.id
  )
  OR
  student_id = auth.uid()
);
