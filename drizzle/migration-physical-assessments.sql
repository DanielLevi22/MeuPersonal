-- Create physical_assessments table
CREATE TABLE IF NOT EXISTS physical_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Anthropometric Measurements
  weight NUMERIC,
  height NUMERIC,
  neck NUMERIC,
  shoulder NUMERIC,
  chest NUMERIC,
  arm_right_relaxed NUMERIC,
  arm_left_relaxed NUMERIC,
  arm_right_contracted NUMERIC,
  arm_left_contracted NUMERIC,
  forearm NUMERIC,
  waist NUMERIC,
  abdomen NUMERIC,
  hips NUMERIC,
  thigh_proximal NUMERIC,
  thigh_distal NUMERIC,
  calf NUMERIC,
  
  -- Skinfolds (Jackson & Pollock 7 or 3)
  skinfold_chest NUMERIC,
  skinfold_abdominal NUMERIC,
  skinfold_thigh NUMERIC,
  skinfold_triceps NUMERIC,
  skinfold_suprailiac NUMERIC,
  skinfold_subscapular NUMERIC,
  skinfold_midaxillary NUMERIC,
  
  -- Calculated Composition
  body_fat_percentage NUMERIC,
  lean_mass_kg NUMERIC,
  fat_mass_kg NUMERIC,
  bmi NUMERIC,
  bmr NUMERIC,
  tdee NUMERIC,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE physical_assessments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Personals can manage assessments for their students"
  ON physical_assessments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students_personals sp
      WHERE sp.student_id = physical_assessments.student_id
      AND sp.personal_id = auth.uid()
    )
    OR personal_id = auth.uid()
  );

CREATE POLICY "Students can view their own assessments"
  ON physical_assessments
  FOR SELECT
  USING (student_id = auth.uid());

-- Allow students to insert their own initial assessment during signup
CREATE POLICY "Students can create their own assessments"
  ON physical_assessments
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Add initial_assessment column to student_invites to store data before account creation
ALTER TABLE student_invites 
ADD COLUMN IF NOT EXISTS initial_assessment JSONB;
