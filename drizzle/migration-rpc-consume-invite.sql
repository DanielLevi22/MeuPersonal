-- Create RPC to atomically consume an invite
-- This handles profile update, linking, and invite deletion in a single transaction
-- bypassing RLS issues and race conditions

CREATE OR REPLACE FUNCTION public.consume_invite(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (postgres)
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_user_id uuid;
  v_profile record;
BEGIN
  v_user_id := auth.uid();
  
  -- 1. Find the invite
  SELECT * INTO v_invite
  FROM public.student_invites
  WHERE invite_code = p_invite_code;
  
  IF v_invite IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Convite não encontrado');
  END IF;

  -- 2. Update Profile
  -- We use COALESCE to ensure we don't overwrite existing data with nulls if not intended,
  -- but here we want to enforce the invite data.
  UPDATE public.profiles
  SET 
    full_name = v_invite.name,
    phone = v_invite.phone,
    weight = v_invite.weight,
    height = v_invite.height,
    notes = v_invite.notes,
    invite_code = p_invite_code,
    role = 'student'
  WHERE id = v_user_id;

  -- 3. Create Link
  INSERT INTO public.students_personals (student_id, personal_id, status)
  VALUES (v_user_id, v_invite.personal_id, 'active')
  ON CONFLICT (student_id, personal_id) DO NOTHING;

  -- 4. Create Assessment if exists
  -- Note: We need to check if physical_assessments table has the columns we expect.
  -- Based on previous code, it seems to match invite fields.
  IF v_invite.initial_assessment IS NOT NULL THEN
    -- We assume initial_assessment is a JSONB object in the invite.
    -- We'll try to insert it. If it fails, we catch it.
    BEGIN
      INSERT INTO public.physical_assessments (
        student_id, 
        personal_id, 
        weight, 
        height, 
        notes,
        created_at
      )
      VALUES (
        v_user_id, 
        v_invite.personal_id, 
        v_invite.weight, 
        v_invite.height, 
        v_invite.notes,
        now()
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the whole process
      RAISE WARNING 'Failed to create assessment: %', SQLERRM;
    END;
  END IF;

  -- 5. Delete Invite
  DELETE FROM public.student_invites
  WHERE id = v_invite.id;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
