-- =====================================================
-- Create Test Personal Trainer User
-- Execute this in Supabase SQL Editor
-- =====================================================

-- Note: Supabase handles password hashing automatically
-- You'll need to create the user through Supabase Auth API or Dashboard
-- This script creates the profile after the user is created

-- Option 1: Use Supabase Dashboard
-- Go to Authentication > Users > Add User
-- Email: personal@test.com
-- Password: Test123456!
-- Then run this SQL to update the profile:

-- Update the profile to be a personal trainer
UPDATE profiles 
SET 
  full_name = 'Personal Trainer Teste',
  role = 'personal'
WHERE email = 'personal@test.com';

-- If the profile doesn't exist yet, create it manually:
-- (Replace 'USER_ID_HERE' with the actual UUID from auth.users)

INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'USER_ID_HERE', -- Get this from auth.users table after creating user
  'personal@test.com',
  'Personal Trainer Teste',
  'personal'
)
ON CONFLICT (id) DO UPDATE
SET 
  full_name = 'Personal Trainer Teste',
  role = 'personal';

-- =====================================================
-- Alternative: Create user via SQL (Advanced)
-- This requires admin privileges
-- =====================================================

-- Step 1: Insert into auth.users (requires Supabase service role)
-- You can do this via Supabase Dashboard instead

-- Step 2: After user is created, verify the profile
SELECT * FROM profiles WHERE email = 'personal@test.com';

-- =====================================================
-- Add some test data for the dashboard
-- =====================================================

-- Get the personal trainer's ID
DO $$
DECLARE
  personal_id UUID;
  student_id UUID;
  workout_id UUID;
BEGIN
  -- Get personal trainer ID
  SELECT id INTO personal_id FROM profiles WHERE email = 'personal@test.com';
  
  IF personal_id IS NOT NULL THEN
    -- Create a test student
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
      gen_random_uuid(),
      'aluno.teste@test.com',
      'Aluno Teste',
      'student'
    )
    RETURNING id INTO student_id;
    
    -- Link student to personal
    INSERT INTO students_personals (personal_id, student_id, status)
    VALUES (personal_id, student_id, 'active');
    
    -- Create a test workout
    INSERT INTO workouts (personal_id, title, description)
    VALUES (
      personal_id,
      'Treino A - Peito e Tríceps',
      'Treino focado em peito e tríceps para iniciantes'
    )
    RETURNING id INTO workout_id;
    
    -- Add exercises to the workout
    INSERT INTO workout_items (workout_id, exercise_id, sets, reps, weight, rest_time, "order")
    SELECT 
      workout_id,
      e.id,
      4,
      '10-12',
      '20kg',
      60,
      ROW_NUMBER() OVER () - 1
    FROM exercises e
    WHERE e.name IN ('Supino Reto', 'Supino Inclinado', 'Tríceps Testa')
    LIMIT 3;
    
    -- Create a test diet plan
    INSERT INTO diet_plans (personal_id, student_id, status, goal, plan_type)
    VALUES (
      personal_id,
      student_id,
      'active',
      'cutting',
      'unique'
    );
    
    RAISE NOTICE 'Test data created successfully!';
  ELSE
    RAISE NOTICE 'Personal trainer not found. Please create the user first.';
  END IF;
END $$;

-- =====================================================
-- Verify the data
-- =====================================================

SELECT 
  'Students' as type,
  COUNT(*) as count
FROM students_personals sp
JOIN profiles p ON sp.personal_id = p.id
WHERE p.email = 'personal@test.com'

UNION ALL

SELECT 
  'Workouts' as type,
  COUNT(*) as count
FROM workouts w
JOIN profiles p ON w.personal_id = p.id
WHERE p.email = 'personal@test.com'

UNION ALL

SELECT 
  'Diets' as type,
  COUNT(*) as count
FROM diet_plans dp
JOIN profiles p ON dp.personal_id = p.id
WHERE p.email = 'personal@test.com';
