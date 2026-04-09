-- Drop mistakenly created tables if they exist (cleanup from previous attempt)
DROP TABLE IF EXISTS diet_logs;
DROP TABLE IF EXISTS diet_meal_items;
DROP TABLE IF EXISTS diet_meals;
DROP TABLE IF EXISTS diet_plans;
-- Note: Not dropping 'foods' as it might be shared/used.

-- ============================================
-- DIET LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS diet_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  diet_plan_id UUID REFERENCES nutrition_plans(id),
  diet_meal_id UUID REFERENCES meals(id),
  logged_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  actual_items JSONB,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diet_logs_student ON diet_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_diet_logs_date ON diet_logs(student_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_diet_logs_meal ON diet_logs(diet_meal_id);

ALTER TABLE diet_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage their own logs" ON diet_logs;
CREATE POLICY "Students can manage their own logs" ON diet_logs FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Personals can view their students logs" ON diet_logs;
CREATE POLICY "Personals can view their students logs" ON diet_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students_personals sp
    WHERE sp.student_id = diet_logs.student_id
    AND sp.personal_id = auth.uid()
    AND sp.status = 'active'
  )
);

-- ============================================
-- NUTRITION PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL,
  weight NUMERIC,
  body_fat_percentage NUMERIC,
  waist_cm NUMERIC,
  chest_cm NUMERIC,
  arm_left_cm NUMERIC,
  arm_right_cm NUMERIC,
  thigh_left_cm NUMERIC,
  thigh_right_cm NUMERIC,
  hip_cm NUMERIC,
  photo_front_url TEXT,
  photo_side_url TEXT,
  photo_back_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, recorded_date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_progress_student ON nutrition_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_progress_date ON nutrition_progress(student_id, recorded_date DESC);

ALTER TABLE nutrition_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage their own progress" ON nutrition_progress;
CREATE POLICY "Students can manage their own progress" ON nutrition_progress FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Personals can view their students progress" ON nutrition_progress;
CREATE POLICY "Personals can view their students progress" ON nutrition_progress FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students_personals sp
    WHERE sp.student_id = nutrition_progress.student_id
    AND sp.personal_id = auth.uid()
    AND sp.status = 'active'
  )
);
