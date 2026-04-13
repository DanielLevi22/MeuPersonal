-- Migration: RPCs essenciais
-- Operações que precisam de permissão elevada rodam via SECURITY DEFINER.
-- A service_role nunca é exposta no cliente.

-- ============================================================
-- RPC: create_student_account
-- Cria conta de aluno pelo profissional:
--   auth.users + profile + vínculo em student_professionals
-- ============================================================

create or replace function create_student_account(
  p_email      text,
  p_password   text,
  p_full_name  text,
  p_service_type service_type
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_professional_id uuid;
begin
  -- Valida que o chamador é um profissional ativo
  select id into v_professional_id
  from profiles
  where id = auth.uid()
    and account_type = 'professional'
    and account_status = 'active';

  if v_professional_id is null then
    raise exception 'Apenas profissionais aprovados podem criar alunos.';
  end if;

  -- Valida inputs
  if p_email is null or trim(p_email) = '' then
    raise exception 'Email é obrigatório.';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Senha deve ter pelo menos 6 caracteres.';
  end if;

  -- Cria usuário no Supabase Auth
  v_student_id := (
    select id from auth.users
    where email = lower(trim(p_email))
    limit 1
  );

  if v_student_id is not null then
    raise exception 'Já existe uma conta com este email.';
  end if;

  insert into auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,  -- confirmado automaticamente: profissional criou a conta
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object(
      'full_name',    p_full_name,
      'account_type', 'managed_student'
    ),
    now(),
    now()
  )
  returning id into v_student_id;

  -- O trigger handle_new_user() cria o profile automaticamente.
  -- Aguarda o trigger e cria o vínculo.
  insert into student_professionals (
    professional_id,
    student_id,
    service_type,
    status
  )
  values (
    v_professional_id,
    v_student_id,
    p_service_type,
    'active'
  );

  return v_student_id;
end;
$$;
