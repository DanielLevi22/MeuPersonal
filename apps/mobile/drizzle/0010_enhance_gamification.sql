-- Create daily_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  date DATE NOT NULL,
  meals_target INTEGER DEFAULT 4,
  meals_completed INTEGER DEFAULT 0,
  workout_target INTEGER DEFAULT 1,
  workout_completed INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL, -- 'streak', 'milestone', 'challenge'
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points INTEGER DEFAULT 0
);

-- Create streaks table if it doesn't exist (renamed from student_streaks in design to match service)
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Streak Freeze columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streaks' AND column_name = 'freeze_available') THEN
        ALTER TABLE streaks ADD COLUMN freeze_available INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streaks' AND column_name = 'last_freeze_date') THEN
        ALTER TABLE streaks ADD COLUMN last_freeze_date DATE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own daily goals" ON daily_goals;
CREATE POLICY "Users can view their own daily goals" ON daily_goals
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can update their own daily goals" ON daily_goals;
CREATE POLICY "Users can update their own daily goals" ON daily_goals
  FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can insert their own daily goals" ON daily_goals;
CREATE POLICY "Users can insert their own daily goals" ON daily_goals
  FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can view their own achievements" ON achievements;
CREATE POLICY "Users can view their own achievements" ON achievements
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can view their own streaks" ON streaks;
CREATE POLICY "Users can view their own streaks" ON streaks
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can update their own streaks" ON streaks;
CREATE POLICY "Users can update their own streaks" ON streaks
  FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can insert their own streaks" ON streaks;
CREATE POLICY "Users can insert their own streaks" ON streaks
  FOR INSERT WITH CHECK (auth.uid() = student_id);
