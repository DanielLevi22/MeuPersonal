-- Create student_invites table
CREATE TABLE IF NOT EXISTS student_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  weight NUMERIC,
  height NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE student_invites ENABLE ROW LEVEL SECURITY;

-- Policy for Personal Trainer (CRUD own invites)
CREATE POLICY "Personals can manage their own invites"
  ON student_invites
  FOR ALL
  USING (auth.uid() = personal_id);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_student_invites_code ON student_invites(invite_code);

-- RPC function to safely look up invite by code (for student login)
CREATE OR REPLACE FUNCTION get_student_invite_by_code(code text)
RETURNS TABLE (
  id UUID,
  personal_id UUID,
  name TEXT,
  phone TEXT,
  weight NUMERIC,
  height NUMERIC,
  notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id,
    si.personal_id,
    si.name,
    si.phone,
    si.weight,
    si.height,
    si.notes
  FROM student_invites si
  WHERE si.invite_code = code
  LIMIT 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_student_invite_by_code(text) TO anon, authenticated, service_role;
