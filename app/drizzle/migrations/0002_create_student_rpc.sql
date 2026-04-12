-- ============================================================
-- RPC: create_student_account
-- Permite que o professional crie a conta do aluno diretamente.
--
-- Fluxo atual do produto:
--   1. Professional preenche nome + email + senha do aluno no app
--   2. Esta função cria o usuário no auth.users + profile + vínculo
--   3. Professional repassa as credenciais ao aluno (ex: WhatsApp)
--   4. Aluno loga com email/senha recebidos
--
-- Por que RPC e não service_role no cliente:
--   A criação de usuários no auth.users requer service_role, que nunca
--   deve ser exposta no cliente. A função roda com SECURITY DEFINER
--   (contexto do postgres, não do usuário logado), o que permite
--   inserir em auth.users de forma segura.
--
-- Futuro (PRD pendente): substituir por fluxo de convite por email
--   onde o aluno cria a própria senha (student_invites table).
-- ============================================================

create or replace function public.create_student_account(
  p_email      text,
  p_password   text,
  p_full_name  text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id    uuid;
  v_profile    json;
begin
  -- Valida que quem chama é um professional
  if not exists (
    select 1 from profiles
    where id = auth.uid() and role = 'professional'
  ) then
    raise exception 'Apenas profissionais podem criar contas de alunos';
  end if;

  -- Valida email
  if p_email is null or p_email = '' then
    raise exception 'Email é obrigatório';
  end if;

  -- Valida senha mínima
  if length(p_password) < 6 then
    raise exception 'Senha deve ter no mínimo 6 caracteres';
  end if;

  -- Valida nome
  if p_full_name is null or p_full_name = '' then
    raise exception 'Nome é obrigatório';
  end if;

  -- Cria usuário no auth (requer service_role — seguro aqui via SECURITY DEFINER)
  v_user_id := extensions.uuid_generate_v4();

  insert into auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    role,
    aud,
    created_at,
    updated_at
  ) values (
    v_user_id,
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(), -- confirma email automaticamente (professional criou a conta)
    jsonb_build_object('full_name', p_full_name, 'role', 'student'),
    'authenticated',
    'authenticated',
    now(),
    now()
  );

  -- O trigger on_auth_user_created já cria o profile automaticamente.
  -- Aguarda o trigger executar inserindo no auth.users acima.

  -- Cria o vínculo professional-aluno
  insert into student_professionals (
    professional_id,
    student_id,
    status,
    invited_by
  ) values (
    auth.uid(),
    v_user_id,
    'active',   -- já ativo — professional criou a conta diretamente
    auth.uid()
  );

  -- Retorna dados do aluno criado
  select json_build_object(
    'id',         p.id,
    'email',      p.email,
    'full_name',  p.full_name,
    'role',       p.role,
    'created_at', p.created_at
  ) into v_profile
  from profiles p
  where p.id = v_user_id;

  return v_profile;

exception
  when unique_violation then
    raise exception 'Já existe uma conta com este email';
  when others then
    raise exception 'Erro ao criar conta: %', sqlerrm;
end;
$$;

-- Garante que apenas usuários autenticados podem chamar
revoke all on function public.create_student_account from anon;
grant execute on function public.create_student_account to authenticated;
