-- Migration: atualizar trigger handle_new_user
-- Profissional agora recebe account_status = 'active' imediatamente (sem pending).
-- Trigger também insere professional_services com base no metadata service_types.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_type text;
begin
  insert into profiles (id, email, full_name, account_type, account_status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(
      (new.raw_user_meta_data->>'account_type')::account_type,
      'managed_student'
    ),
    case
      when (new.raw_user_meta_data->>'account_type') = 'professional'
        then 'active'::account_status
      else null
    end
  );

  -- Inserir professional_services para cada tipo de serviço declarado no cadastro
  if (new.raw_user_meta_data->>'account_type') = 'professional' then
    for v_service_type in
      select jsonb_array_elements_text(new.raw_user_meta_data->'service_types')
    loop
      insert into professional_services (professional_id, service_type, is_active)
      values (new.id, v_service_type::service_type, true)
      on conflict do nothing;
    end loop;
  end if;

  return new;
end;
$$;
