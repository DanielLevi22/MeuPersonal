-- Migration: Fix Student Creation and Migrate Data
-- Description: Migrates data from students_personals to coachings and updates the creation function
-- Date: 2025-11-29

-- 1. Migrate data from students_personals to coachings
DO $$
BEGIN
  INSERT INTO coachings (
    id,
    client_id,
    professional_id,
    status,
    service_type,
    created_at
  )
  SELECT
    gen_random_uuid(), -- Generate new ID for coaching
    student_id,
    personal_id,
    CASE 
      WHEN status::text = 'invited' THEN 'pending'::relationship_status
      WHEN status::text = 'inactive' THEN 'ended'::relationship_status
      ELSE status::text::relationship_status
    END,
    'personal_training', -- Default service type
    created_at
  FROM students_personals sp
  WHERE NOT EXISTS (
    SELECT 1 FROM coachings c
    WHERE c.client_id = sp.student_id AND c.professional_id = sp.personal_id
  );
  
  RAISE NOTICE '✓ Migrated data from students_personals to coachings';
END $$;

-- 2. Update create_student_with_auth function to use coachings
CREATE OR REPLACE FUNCTION create_student_with_auth(
  p_professional_id UUID,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_weight NUMERIC DEFAULT NULL,
  p_height NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_initial_assessment JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite_code TEXT;
  v_email TEXT;
  v_password TEXT;
  v_user_id UUID;
  v_error TEXT;
BEGIN
  -- Generate unique invite code
  v_invite_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
  
  -- Generate email and password
  v_email := 'aluno' || LOWER(v_invite_code) || '@test.com';
  v_password := v_invite_code;
  
  -- Create auth user
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object(
        'full_name', p_full_name,
        'account_type', 'managed_student',
        'invite_code', v_invite_code,
        'phone', p_phone
      ),
      NOW(),
      NOW(),
      '',
      ''
    )
    RETURNING id INTO v_user_id;
    
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create auth user: ' || v_error
    );
  END;
  
  -- Update profile
  BEGIN
    UPDATE profiles
    SET 
      invite_code = v_invite_code,
      phone = p_phone
    WHERE id = v_user_id;
    
    IF NOT FOUND THEN
      v_error := 'Profile was not created by trigger';
      DELETE FROM auth.users WHERE id = v_user_id;
      RETURN jsonb_build_object(
        'success', false,
        'error', v_error
      );
    END IF;
  END;
  
  -- Link to professional (using coachings table)
  BEGIN
    INSERT INTO coachings (
      id,
      client_id,
      professional_id,
      status,
      service_type,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      p_professional_id,
      'active',
      'personal_training',
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    DELETE FROM profiles WHERE id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to link to professional: ' || v_error
    );
  END;
  
  -- Create initial physical assessment
  IF p_weight IS NOT NULL OR p_height IS NOT NULL OR p_initial_assessment IS NOT NULL THEN
    BEGIN
      INSERT INTO physical_assessments (
        student_id,
        personal_id,
        weight,
        height,
        notes,
        neck,
        shoulder,
        chest,
        arm_right_relaxed,
        arm_left_relaxed,
        arm_right_contracted,
        arm_left_contracted,
        forearm,
        waist,
        abdomen,
        hips,
        thigh_proximal,
        thigh_distal,
        calf,
        skinfold_chest,
        skinfold_abdominal,
        skinfold_thigh,
        skinfold_triceps,
        skinfold_suprailiac,
        skinfold_subscapular,
        skinfold_midaxillary,
        created_at
      ) VALUES (
        v_user_id,
        p_professional_id,
        p_weight,
        p_height,
        p_notes,
        (p_initial_assessment->>'neck')::NUMERIC,
        (p_initial_assessment->>'shoulder')::NUMERIC,
        (p_initial_assessment->>'chest')::NUMERIC,
        (p_initial_assessment->>'arm_right_relaxed')::NUMERIC,
        (p_initial_assessment->>'arm_left_relaxed')::NUMERIC,
        (p_initial_assessment->>'arm_right_contracted')::NUMERIC,
        (p_initial_assessment->>'arm_left_contracted')::NUMERIC,
        (p_initial_assessment->>'forearm')::NUMERIC,
        (p_initial_assessment->>'waist')::NUMERIC,
        (p_initial_assessment->>'abdomen')::NUMERIC,
        (p_initial_assessment->>'hips')::NUMERIC,
        (p_initial_assessment->>'thigh_proximal')::NUMERIC,
        (p_initial_assessment->>'thigh_distal')::NUMERIC,
        (p_initial_assessment->>'calf')::NUMERIC,
        (p_initial_assessment->>'skinfold_chest')::NUMERIC,
        (p_initial_assessment->>'skinfold_abdominal')::NUMERIC,
        (p_initial_assessment->>'skinfold_thigh')::NUMERIC,
        (p_initial_assessment->>'skinfold_triceps')::NUMERIC,
        (p_initial_assessment->>'skinfold_suprailiac')::NUMERIC,
        (p_initial_assessment->>'skinfold_subscapular')::NUMERIC,
        (p_initial_assessment->>'skinfold_midaxillary')::NUMERIC,
        NOW()
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create initial assessment: %', SQLERRM;
    END;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'student_id', v_user_id,
    'invite_code', v_invite_code,
    'email', v_email,
    'password', v_password
  );
END;
$$;
