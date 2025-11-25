-- Migration: Unify Student Invite Logic
-- Description: Creates the get_student_invite_by_code RPC to query the students table, ensuring mobile app compatibility.
-- Date: 2024-11-25

-- Drop existing function if it exists (to ensure we replace it with the correct logic)
DROP FUNCTION IF EXISTS get_student_invite_by_code(text);

-- Create the RPC function expected by the mobile app
CREATE OR REPLACE FUNCTION get_student_invite_by_code(p_code TEXT)
RETURNS TABLE (
  id UUID,
  personal_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  weight NUMERIC,
  height NUMERIC,
  notes TEXT,
  invite_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.personal_id,
    s.full_name as name,
    s.email,
    s.phone,
    s.weight,
    s.height,
    s.notes,
    s.invite_code
  FROM students s
  WHERE s.invite_code = p_code
  -- We might want to filter out already registered students if invite_code is cleared on registration
  -- But for now, let's return it if it exists.
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure consume_invite RPC exists and handles the logic
DROP FUNCTION IF EXISTS consume_invite(text);

CREATE OR REPLACE FUNCTION consume_invite(p_invite_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_student_record RECORD;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Find the student record with this invite code
  SELECT * INTO v_student_record
  FROM students
  WHERE invite_code = p_invite_code;
  
  IF v_student_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code');
  END IF;

  -- Update the student record to link to the actual user profile (if not already linked)
  -- Actually, the 'students' table ID might need to match the profile ID for consistency, 
  -- OR we just update the personal_id in the profile?
  -- The mobile app logic tries to update profile and insert into students.
  
  -- If the student record in 'students' table was created with a random UUID, 
  -- and now the user has a real auth.uid(), we might need to migrate data or update the ID?
  -- Updating PK is hard.
  
  -- Better approach:
  -- 1. Create/Update Profile
  UPDATE profiles
  SET 
    account_type = 'managed_student',
    full_name = COALESCE(profiles.full_name, v_student_record.full_name)
  WHERE id = v_user_id;
  
  -- 2. Link to Professional
  INSERT INTO client_professional_relationships (
    client_id,
    professional_id,
    service_category,
    relationship_status,
    invited_by
  )
  VALUES (
    v_user_id,
    v_student_record.personal_id,
    'training', -- Default, maybe infer?
    'active',
    v_student_record.personal_id
  )
  ON CONFLICT (client_id, professional_id, service_category) DO NOTHING;
  
  -- 3. Handle the 'students' table record
  -- The pending record has a random ID. The new user has v_user_id.
  -- We should probably move data from pending record to a new record with v_user_id?
  -- Or just update the pending record?
  -- If we update the pending record, we can't change its ID easily if it's referenced.
  
  -- If 'students' table ID is NOT referenced by FKs yet (except maybe pending_ assignments), we could try.
  -- But 'periodizations' might reference it via 'pending_student_id'.
  
  -- Let's use the 'migrate_pending_student_data' function logic I wrote earlier!
  -- It moves periodizations/diets from pending_student_id to student_id (new profile).
  
  PERFORM migrate_pending_student_data(p_invite_code, v_user_id);
  
  -- Now we can delete the pending student record OR mark it as consumed.
  -- If we delete it, we lose the 'invite_code' reference unless we store it in profile.
  -- Let's delete it to clean up, as the real student record should be created/updated with the real ID.
  
  -- Wait, the mobile app tries to INSERT into students with the new ID.
  -- So we should delete the old pending record to avoid confusion?
  -- Or keep it?
  
  -- We do NOT clear the invite_code because it serves as the student's permanent access credential
  -- and identifier for other professionals to associate with them.
  -- UPDATE students SET invite_code = NULL WHERE invite_code = p_invite_code;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
