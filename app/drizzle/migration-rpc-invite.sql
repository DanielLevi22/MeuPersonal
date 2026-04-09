-- Function to safely look up a personal trainer by invite code
-- This is needed because unauthenticated users (students trying to login)
-- cannot query the profiles table directly due to RLS.

CREATE OR REPLACE FUNCTION get_personal_by_invite_code(code text)
RETURNS TABLE (id uuid, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name
  FROM profiles p
  WHERE p.invite_code = code
  AND p.role = 'personal'
  LIMIT 1;
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_personal_by_invite_code(text) TO anon, authenticated, service_role;
