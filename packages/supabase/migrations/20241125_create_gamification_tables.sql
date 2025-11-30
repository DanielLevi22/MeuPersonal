-- Tabela de metas diárias
CREATE TABLE daily_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meals_target INT DEFAULT 4,
  meals_completed INT DEFAULT 0,
  workout_target INT DEFAULT 1,
  workout_completed INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completion_percentage INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Tabela de conquistas
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'streak', 'milestone', 'challenge'
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  points INT DEFAULT 0
);

-- Tabela de sequências
CREATE TABLE student_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies

-- daily_goals
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily goals"
  ON daily_goals FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can update their own daily goals"
  ON daily_goals FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "System can insert daily goals"
  ON daily_goals FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = student_id);

-- student_streaks
ALTER TABLE student_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streaks"
  ON student_streaks FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can update their own streaks"
  ON student_streaks FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "System can insert streaks"
  ON student_streaks FOR INSERT
  WITH CHECK (auth.uid() = student_id);
