-- Fix: Student Login Credentials
-- Description: Ensures all students with invite codes have the correct auth email and password for "Login with Code"
-- Date: 2025-11-29

DO $$
DECLARE
  v_profile RECORD;
  v_expected_email TEXT;
  v_updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting credential fix for students...';

  -- Loop through all profiles that have an invite code
  FOR v_profile IN 
    SELECT * FROM profiles 
    WHERE invite_code IS NOT NULL
  LOOP
    -- Construct the expected email
    v_expected_email := 'aluno' || LOWER(v_profile.invite_code) || '@test.com';
    
    -- Update auth.users to match the expected email and set password to the invite code
    -- We do this blindly to ensure even if email matches, the password is definitely the code
    UPDATE auth.users
    SET 
      email = v_expected_email,
      encrypted_password = crypt(v_profile.invite_code, gen_salt('bf')),
      raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
          'invite_code', v_profile.invite_code,
          'account_type', 'managed_student'
        )
    WHERE id = v_profile.id
    AND (
      email != v_expected_email 
      OR encrypted_password != crypt(v_profile.invite_code, encrypted_password) -- This check is approximate, crypt comparison might not work directly like this in WHERE
      OR true -- Force update to be safe
    );
    
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
      RAISE NOTICE 'Fixed credentials for student: % (Code: %)', v_profile.full_name, v_profile.invite_code;
    END IF;
    
  END LOOP;

  RAISE NOTICE '----------------------------------';
  RAISE NOTICE 'Completed! Fixed credentials for % students.', v_updated_count;
  RAISE NOTICE 'All students should now be able to log in with their code.';

END $$;
