-- Clean all existing policies on workouts table and recreate them correctly
-- This fixes the infinite recursion issue

-- Drop ALL existing policies on workouts
DROP POLICY IF EXISTS "Students can view assigned workouts" ON workouts;
DROP POLICY IF EXISTS "Personals can view their workouts" ON workouts;
DROP POLICY IF EXISTS "Personals can insert workouts" ON workouts;
DROP POLICY IF EXISTS "Personals can update their workouts" ON workouts;
DROP POLICY IF EXISTS "Personals can delete their workouts" ON workouts;
DROP POLICY IF EXISTS "Users can view their own workouts" ON workouts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON workouts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON workouts;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON workouts;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON workouts;

-- Ensure RLS is enabled
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Personal trainers can view their own workouts
CREATE POLICY "Personals can view their workouts"
ON workouts
FOR SELECT
USING (personal_id = auth.uid());

-- Policy 2: Students can view workouts assigned to them
-- IMPORTANT: Use column names directly (id, student_id) not table.column to avoid recursion
CREATE POLICY "Students can view assigned workouts"
ON workouts
FOR SELECT
USING (
  -- Check if there's an assignment in workout_assignments table
  id IN (
    SELECT workout_id 
    FROM workout_assignments 
    WHERE student_id = auth.uid()
  )
  OR
  -- Also support legacy student_id field
  student_id = auth.uid()
);

-- Policy 3: Personal trainers can insert their own workouts
CREATE POLICY "Personals can insert workouts"
ON workouts
FOR INSERT
WITH CHECK (personal_id = auth.uid());

-- Policy 4: Personal trainers can update their own workouts
CREATE POLICY "Personals can update their workouts"
ON workouts
FOR UPDATE
USING (personal_id = auth.uid())
WITH CHECK (personal_id = auth.uid());

-- Policy 5: Personal trainers can delete their own workouts
CREATE POLICY "Personals can delete their workouts"
ON workouts
FOR DELETE
USING (personal_id = auth.uid());
