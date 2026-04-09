-- Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_code text;

-- Create physical_assessments table
CREATE TABLE IF NOT EXISTS physical_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) NOT NULL,
  personal_id uuid REFERENCES profiles(id) NOT NULL,
  weight numeric,
  height numeric,
  neck numeric,
  shoulder numeric,
  chest numeric,
  arm_right_relaxed numeric,
  arm_left_relaxed numeric,
  arm_right_contracted numeric,
  arm_left_contracted numeric,
  forearm numeric,
  waist numeric,
  abdomen numeric,
  hips numeric,
  thigh_proximal numeric,
  thigh_distal numeric,
  calf numeric,
  skinfold_chest numeric,
  skinfold_abdominal numeric,
  skinfold_thigh numeric,
  skinfold_triceps numeric,
  skinfold_suprailiac numeric,
  skinfold_subscapular numeric,
  skinfold_midaxillary numeric,
  notes text,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Add RLS policies for physical_assessments
ALTER TABLE physical_assessments ENABLE ROW LEVEL SECURITY;

-- Personals can view/insert/update/delete assessments for their students
DROP POLICY IF EXISTS "Personals can manage assessments for their students" ON physical_assessments;
CREATE POLICY "Personals can manage assessments for their students"
ON physical_assessments
FOR ALL
USING (
  auth.uid() = personal_id
);

-- Students can view their own assessments
DROP POLICY IF EXISTS "Students can view own assessments" ON physical_assessments;
CREATE POLICY "Students can view own assessments"
ON physical_assessments
FOR SELECT
USING (
  auth.uid() = student_id
);
