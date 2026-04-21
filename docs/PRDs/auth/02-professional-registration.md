# PRD: auth-professional-registration

**Data de criação:** 2026-04-13
**Status:** approved
**Branch:** feature/auth-professional-registration
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Tela de cadastro de profissional (personal trainer / nutricionista) disponível em web e mobile. O profissional preenche nome, email, senha e seleciona os tipos de serviço que oferece. Ao confirmar, a conta é criada com `account_status = 'active'` imediatamente — sem etapa de aprovação.

### Por quê?
É a porta de entrada do produto. Sem cadastro não há profissional, sem profissional não há alunos. O fluxo de aprovação manual foi removido para eliminar fricção no onboarding.

### Como saberemos que está pronto?
- [ ] Profissional consegue se cadastrar via web com nome, email, senha e seleção de serviço(s)
- [ ] Profissional consegue se cadastrar via mobile com os mesmos campos
- [ ] Pode selecionar Personal Training, Nutrição, ou ambos
- [ ] Após o cadastro entra direto no dashboard (sem tela de pending)
- [ ] Trigger `handle_new_user()` cria o profile com `account_status = 'active'`
- [ ] `professional_services` são inseridas corretamente para cada serviço selecionado
- [ ] Validação de campos: nome obrigatório, email válido, senha mínimo 8 caracteres, ao menos 1 serviço selecionado
- [ ] Erro de email já cadastrado exibido de forma clara
- [ ] `biome check` e `tsc --noEmit` limpos

---

## Contexto

Fluxo anterior tinha aprovação manual pelo admin (`pending` → `active`). Foi simplificado: o profissional cadastra e acessa imediatamente. O trigger no banco precisa refletir isso.

## Escopo

### Incluído
- Tela/página de cadastro: web (`web/src/modules/auth/`) + mobile (`app/src/modules/auth/`)
- Migration SQL: atualizar trigger `handle_new_user()` para criar profile com `account_status = 'active'` para professionals
- Após cadastro: redireciona para dashboard do profissional
- Validação de formulário no frontend (campos obrigatórios, formato email, mínimo senha)
- Registro de `professional_services` via trigger

### Fora do escopo
- Tela de pending/aprovação (removida)
- Cadastro de aluno autônomo (roadmap)
- Upload de foto de perfil no cadastro
- Verificação de email (desabilitada no ambiente local, fora do MVP)

---

## Campos do formulário

| Campo | Tipo | Validação |
|-------|------|-----------|
| `full_name` | text input | obrigatório, mín 2 chars |
| `email` | email input | obrigatório, formato válido |
| `password` | password input | obrigatório, mín 8 chars |
| `confirm_password` | password input | obrigatório, igual ao password |
| `service_types` | checkbox/toggle | obrigatório, mín 1 selecionado |

**Opções de serviço** (conforme glossary.md):
- Personal Training (`personal_training`)
- Nutrição (`nutrition_consulting`)

---

## Fluxo de dados

```
Usuário preenche formulário
  → AuthService.signUpProfessional({ email, password, full_name, service_types })
  → supabase.auth.signUp() com metadata { account_type: 'professional', service_types }
  → Trigger handle_new_user() cria profile com account_status = 'active'
  → Trigger insere linhas em professional_services para cada service_type
  ← { data: { session, user }, error }
  → authStore.setSession() + authStore.setProfile()
  → Redireciona para dashboard
```

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `profiles` | INSERT | via trigger handle_new_user(), account_status = 'active' |
| `professional_services` | INSERT | via trigger, uma linha por service_type |

## Impacto em outros módulos

- Depende de `@elevapro/shared` (AuthService, authStore, tipos)
- Nenhum outro módulo afetado

---

## Decisões técnicas

- **Sem aprovação manual**: `account_status = 'active'` no momento do cadastro. O campo existe no schema mas não é usado no fluxo de onboarding.
- **service_types no metadata do Supabase Auth**: os tipos de serviço passam como `user_metadata` no signUp. O trigger lê esse metadata para criar as linhas em `professional_services`.
- **Migration nova**: a atualização do trigger vai em uma nova migration (`0003_update_professional_trigger.sql`), não altera as migrations existentes.
- **Campos idênticos web/mobile**: per glossary.md, nomenclatura canônica usada em ambas as plataformas.

---

## Checklist de done

- [ ] Código funciona e passou em lint + typecheck
- [ ] `supabase db reset` local passa com a nova migration
- [ ] PR mergeado em `development`
- [ ] `docs/features/auth-professional-registration.md` criado
- [ ] `docs/STATUS.md` atualizado
