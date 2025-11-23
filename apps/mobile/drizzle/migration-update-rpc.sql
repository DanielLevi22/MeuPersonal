DROP FUNCTION IF EXISTS get_student_invite_by_code(text);

CREATE OR REPLACE FUNCTION get_student_invite_by_code(p_code text)
RETURNS TABLE (
  id UUID,
  personal_id UUID,
  name TEXT,
  phone TEXT,
  weight NUMERIC,
  height NUMERIC,
  notes TEXT,
  initial_assessment JSONB
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
    si.notes,
    si.initial_assessment
  FROM student_invites si
  WHERE si.invite_code = p_code
  LIMIT 1;
END;
$$;
