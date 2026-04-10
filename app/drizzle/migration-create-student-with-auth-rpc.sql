-- Migration: create_student_with_auth RPC
-- Cria um aluno com usuário auth, perfil e vínculo de coaching em uma única operação.
-- Chamado pelo profissional ao cadastrar um aluno novo pelo app ou dashboard web.

CREATE OR REPLACE FUNCTION create_student_with_auth(
  p_professional_id uuid,
  p_full_name text,
  p_email text,
  p_password text,
  p_phone text DEFAULT NULL,
  p_weight numeric DEFAULT NULL,
  p_height numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_experience_level text DEFAULT NULL,
  p_initial_assessment jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  v_instance_id uuid;
BEGIN
  -- Pega instance_id do projeto (necessário para auth.users)
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  -- Cria usuário auth
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    new_user_id,
    v_instance_id,
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', p_full_name,
      'account_type', 'managed_student',
      'phone', p_phone
    ),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '', '', '', ''
  );

  -- Cria identidade para login por email
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', p_email),
    'email',
    p_email,
    now(),
    now(),
    now()
  );

  -- Cria perfil do aluno
  INSERT INTO profiles (
    id,
    email,
    full_name,
    account_type,
    account_status,
    phone
  ) VALUES (
    new_user_id,
    p_email,
    p_full_name,
    'managed_student',
    'active',
    p_phone
  )
  ON CONFLICT (id) DO NOTHING;

  -- Cria vínculos de coaching para cada serviço ativo do profissional
  INSERT INTO coachings (client_id, professional_id, service_type, status)
  SELECT new_user_id, p_professional_id, ps.service_category, 'active'
  FROM professional_services ps
  WHERE ps.user_id = p_professional_id AND ps.is_active = true
  ON CONFLICT DO NOTHING;

  -- Fallback: profissional sem serviços configurados recebe personal_training
  IF NOT EXISTS (
    SELECT 1 FROM coachings
    WHERE client_id = new_user_id AND professional_id = p_professional_id
  ) THEN
    INSERT INTO coachings (client_id, professional_id, service_type, status)
    VALUES (new_user_id, p_professional_id, 'personal_training', 'active')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'student_id', new_user_id);

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email já cadastrado');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Permite que usuários autenticados chamem a função
GRANT EXECUTE ON FUNCTION create_student_with_auth TO authenticated;
