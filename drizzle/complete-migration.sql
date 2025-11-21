-- =====================================================
-- MeuPersonal - Complete Database Migration (SAFE VERSION)
-- Execute this SQL in Supabase SQL Editor
-- This version skips objects that already exist
-- =====================================================

-- 1. Create ENUMS (skip if exists)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('personal', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM ('active', 'pending', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Create students_personals relationship table
CREATE TABLE IF NOT EXISTS students_personals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status invite_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(personal_id, student_id)
);

-- 4. Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. Create workout_items table
CREATE TABLE IF NOT EXISTS workout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER,
  reps TEXT,
  weight TEXT,
  rest_time INTEGER,
  notes TEXT,
  "order" INTEGER DEFAULT 0
);

-- 7. Create workout_sessions table
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- 8. Create workout_session_items table
CREATE TABLE IF NOT EXISTS workout_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  workout_item_id UUID NOT NULL REFERENCES workout_items(id) ON DELETE CASCADE,
  sets_completed INTEGER DEFAULT 0,
  actual_weight TEXT,
  actual_reps TEXT,
  notes TEXT
);

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_personals ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view exercises" ON exercises;
DROP POLICY IF EXISTS "Authenticated users can create exercises" ON exercises;
DROP POLICY IF EXISTS "Personals can view their workouts" ON workouts;
DROP POLICY IF EXISTS "Students can view assigned workouts" ON workouts;
DROP POLICY IF EXISTS "Personals can create workouts" ON workouts;
DROP POLICY IF EXISTS "Personals can update their workouts" ON workouts;
DROP POLICY IF EXISTS "Personals can delete their workouts" ON workouts;
DROP POLICY IF EXISTS "Users can view workout items" ON workout_items;
DROP POLICY IF EXISTS "Personals can manage workout items" ON workout_items;
DROP POLICY IF EXISTS "Students can view their sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Students can create sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Students can update their sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can view their relationships" ON students_personals;
DROP POLICY IF EXISTS "Personals can create relationships" ON students_personals;

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Exercises: Everyone can read, only authenticated users can create
CREATE POLICY "Anyone can view exercises" ON exercises
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create exercises" ON exercises
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Workouts: Personals can manage their workouts, students can view assigned workouts
CREATE POLICY "Personals can view their workouts" ON workouts
  FOR SELECT USING (auth.uid() = personal_id);

CREATE POLICY "Students can view assigned workouts" ON workouts
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Personals can create workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = personal_id);

CREATE POLICY "Personals can update their workouts" ON workouts
  FOR UPDATE USING (auth.uid() = personal_id);

CREATE POLICY "Personals can delete their workouts" ON workouts
  FOR DELETE USING (auth.uid() = personal_id);

-- Workout Items: Follow workout permissions
CREATE POLICY "Users can view workout items" ON workout_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workouts 
      WHERE workouts.id = workout_items.workout_id 
      AND (workouts.personal_id = auth.uid() OR workouts.student_id = auth.uid())
    )
  );

CREATE POLICY "Personals can manage workout items" ON workout_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workouts 
      WHERE workouts.id = workout_items.workout_id 
      AND workouts.personal_id = auth.uid()
    )
  );

-- Workout Sessions: Students can manage their sessions
CREATE POLICY "Students can view their sessions" ON workout_sessions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create sessions" ON workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their sessions" ON workout_sessions
  FOR UPDATE USING (auth.uid() = student_id);

-- Students_Personals: Both parties can view, personals can create
CREATE POLICY "Users can view their relationships" ON students_personals
  FOR SELECT USING (auth.uid() = personal_id OR auth.uid() = student_id);

CREATE POLICY "Personals can create relationships" ON students_personals
  FOR INSERT WITH CHECK (auth.uid() = personal_id);

-- =====================================================
-- Triggers for auto-creating profile on signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Seed Data: Sample Exercises
-- =====================================================

INSERT INTO exercises (name, muscle_group) VALUES
  -- Peito
  ('Supino Reto', 'Peito'),
  ('Supino Inclinado', 'Peito'),
  ('Crucifixo', 'Peito'),
  ('Flexão', 'Peito'),
  
  -- Costas
  ('Barra Fixa', 'Costas'),
  ('Remada Curvada', 'Costas'),
  ('Puxada Frontal', 'Costas'),
  ('Remada Cavalinho', 'Costas'),
  
  -- Pernas
  ('Agachamento', 'Pernas'),
  ('Leg Press', 'Pernas'),
  ('Cadeira Extensora', 'Pernas'),
  ('Cadeira Flexora', 'Pernas'),
  ('Stiff', 'Pernas'),
  
  -- Ombros
  ('Desenvolvimento', 'Ombros'),
  ('Elevação Lateral', 'Ombros'),
  ('Elevação Frontal', 'Ombros'),
  
  -- Bíceps
  ('Rosca Direta', 'Bíceps'),
  ('Rosca Alternada', 'Bíceps'),
  ('Rosca Martelo', 'Bíceps'),
  
  -- Tríceps
  ('Tríceps Testa', 'Tríceps'),
  ('Tríceps Corda', 'Tríceps'),
  ('Mergulho', 'Tríceps')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Done! 🎉
-- =====================================================
