# PRD: schema-architecture

**Data de criação:** 2026-04-13
**Status:** approved
**Branch:** feature/schema-architecture
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Arquitetar e documentar todas as tabelas e relações do banco de dados do MeuPersonal, módulo por módulo, antes de escrever qualquer migration. O resultado é um `docs/DATABASE_SCHEMA.md` completo e aprovado que serve como fonte da verdade para gerar as migrations finais.

### Por quê?
As migrations existentes foram criadas com campos incorretos, campos em tabelas erradas e relações não discutidas (ex: `is_super_admin`, `birth_date`, `gender` em `profiles`). Gerar migrations sem arquitetura aprovada cria dívida técnica desde o início. O schema é a fundação — precisa estar certo antes de qualquer linha de SQL.

### Como saberemos que está pronto?
- [x] `docs/DATABASE_SCHEMA.md` criado com todos os módulos documentados
- [x] Cada tabela tem: campos, tipos, constraints, relações e justificativa das decisões
- [x] Migrations antigas deletadas (`app/drizzle/migrations/` e `supabase/migrations/`)
- [x] Novas migrations geradas via `drizzle-kit generate` e validadas com `supabase db reset`
- [x] Schema Drizzle centralizado em `shared/src/database/schema/` (fonte única de verdade)

---

## Contexto

Durante o desenvolvimento das primeiras features de Auth, identificamos campos problemáticos no schema:
- `is_super_admin` — redundante com `account_type = 'admin'`
- `birth_date` e `gender` em `profiles` — pertencem ao módulo de Students
- `account_status` com valor `pending` — removido do fluxo de onboarding

Em vez de corrigir com patches, decidimos arquitetar o banco inteiro antes de gerar qualquer migration.

---

## Processo de trabalho

### Ordem dos módulos
1. **Auth** — `profiles`, `professional_services`
2. **Students** — `student_professionals`, `physical_assessments`, `student_anamnesis`
3. **Nutrition** — `foods`, `diet_plans`, `diet_meals`, `diet_meal_items`, `meal_logs`
4. **Workouts** — `exercises`, `periodizations`, `training_plans`, `workouts`, `workout_exercises`, `workout_sessions`, `workout_session_exercises`
5. **Gamification** — `student_streaks`, `daily_goals`, `achievements`
6. **Chat** — `conversations`, `messages`
7. **System** — `feature_flags`, `feature_access`

### Estrutura de arquivos

**Schema por módulo** — cada módulo tem seu próprio arquivo em `docs/schema/`:

| Módulo | Schema | PRDs do módulo |
|--------|--------|----------------|
| Auth | `docs/schema/auth.md` | `docs/PRDs/auth/` |
| Students | `docs/schema/students.md` | `docs/PRDs/students/` |
| Nutrition | `docs/schema/nutrition.md` | `docs/PRDs/nutrition/` |
| Workouts | `docs/schema/workouts.md` | `docs/PRDs/workouts/` |
| Gamification | `docs/schema/gamification.md` | `docs/PRDs/gamification/` |
| Chat | `docs/schema/chat.md` | `docs/PRDs/chat/` |
| System | `docs/schema/system.md` | `docs/PRDs/system/` |

**PRDs gerais** (cross-cutting, sem módulo específico) ficam na raiz `docs/PRDs/`.

`docs/DATABASE_SCHEMA.md` é o índice — lista o status de cada módulo e aponta para os arquivos acima.

### Por módulo
Para cada módulo, discutir e documentar:
- Quais tabelas existem e por quê
- Cada campo: nome, tipo, nullable, default, justificativa
- Relações com outras tabelas (FK, cascade)
- O que NÃO entra nesta tabela (e por quê, para evitar dúvidas futuras)

### Regra de ouro
> Nenhuma migration é escrita enquanto não tivermos discutido todos os 7 módulos.

---

## Escopo

### Incluído
- Discussão e aprovação de todos os 7 módulos
- Criação de `docs/DATABASE_SCHEMA.md` como fonte da verdade
- Deleção das migrations antigas
- Atualização do schema Drizzle
- Geração das migrations finais
- Validação com `supabase db reset`

### Fora do escopo
- RLS policies (vêm depois, junto com a implementação de cada feature)
- Triggers e RPCs (idem)
- Seed data (separado)

---

## Checklist de done

- [x] Todos os módulos discutidos e aprovados (Auth, Students, Assessment, Nutrition, Workouts, Gamification — Chat removido, System pendente)
- [x] `docs/DATABASE_SCHEMA.md` completo
- [x] Migrations antigas deletadas
- [x] Schema Drizzle centralizado em `shared/src/database/schema/`
- [x] Novas migrations geradas e validadas
- [ ] PR mergeado em `development`
- [ ] `docs/STATUS.md` atualizado
