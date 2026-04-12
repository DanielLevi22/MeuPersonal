# Feature: database-schema

**Status:** active
**PRD:** [database-audit-and-refactor](../PRDs/database-audit-and-refactor.md)
**Plataformas:** infra (mobile + web)
**Última atualização:** 2026-04-12

---

## O que é

Schema canônico do banco de dados MeuPersonal. Schema limpo escrito do zero em Drizzle ORM, substituindo 60+ migrations acumuladas com tabelas mortas, schemas duplicadas e FKs quebradas.

---

## Arquivos

```
app/drizzle/
  schema/
    auth.ts           → profiles
    students.ts       → student_professionals, student_invites, physical_assessments
    nutrition.ts      → foods, diet_plans, diet_meals, diet_meal_items, meal_logs
    workouts.ts       → exercises, periodizations, training_plans, workouts,
                        workout_exercises, workout_sessions, workout_session_exercises
    gamification.ts   → achievements, student_streaks, daily_goals
    system.ts         → feature_flags, feature_access
    index.ts          → re-exporta tudo
  migrations/
    0000_jazzy_mordo.sql      → CREATE TABLE de todas as 21 tabelas + FKs
    0001_rls_and_triggers.sql → RLS em todas as tabelas + trigger de auth + helper is_professional_of()
    0002_create_student_rpc.sql → RPC create_student_account (criação de aluno pelo professional)
  seeds/
    foods.sql       → 50 alimentos baseados na tabela TACO
    exercises.sql   → 55 exercícios por grupo muscular
```

---

## Tabelas — mapa por domínio

### Auth
| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfil de cada usuário (= auth.users). Role: `professional` ou `student` |

### Alunos
| Tabela | Descrição |
|--------|-----------|
| `student_professionals` | Vínculo ativo entre aluno e personal. Status: `pending`, `active`, `inactive` |
| `student_invites` | **Futuro** — hoje o professional cria a conta diretamente. Ver fluxo abaixo. |
| `physical_assessments` | Avaliações físicas (peso, altura, %gordura, fotos) |

### Nutrição
| Tabela | Descrição |
|--------|-----------|
| `foods` | Catálogo de alimentos com macros por 100g + serving_size |
| `diet_plans` | Plano alimentar criado pelo professional para um aluno |
| `diet_meals` | Refeições dentro de um plano (café, almoço, lanche...) |
| `diet_meal_items` | Alimentos de cada refeição com quantidade em gramas |
| `meal_logs` | Registro diário do aluno (refeição X foi completada no dia Y) |

### Treinos
| Tabela | Descrição |
|--------|-----------|
| `exercises` | Catálogo de exercícios verificados + criados por professionals |
| `periodizations` | Periodização de treino de um aluno |
| `training_plans` | Planos dentro de uma periodização (fase, semana) |
| `workouts` | Treino específico (ex: Treino A, Treino B) |
| `workout_exercises` | Exercícios do treino com séries, reps, descanso |
| `workout_sessions` | Uma execução real de treino pelo aluno |
| `workout_session_exercises` | Exercícios executados na sessão com sets_data (jsonb) |

### Gamificação
| Tabela | Descrição |
|--------|-----------|
| `achievements` | Conquistas do aluno (tipo, pontos, data) |
| `student_streaks` | Sequência de dias ativos (current + longest) |
| `daily_goals` | Metas diárias de refeições, treino e água — 1 registro por (aluno, data) |

### Sistema
| Tabela | Descrição |
|--------|-----------|
| `feature_flags` | Flags globais por chave (ligado/desligado) |
| `feature_access` | Controle de acesso por tier de assinatura |

---

## Fluxos de negócio documentados

### Fluxo atual: professional cria conta do aluno

```
Professional (app) → cria aluno com nome + email + senha
    → chama RPC create_student_account()
    → RPC (SECURITY DEFINER) cria auth.users + profile + student_professionals
    → trigger on_auth_user_created cria o profile automaticamente
    → professional repassa email/senha ao aluno (WhatsApp, etc.)
    → aluno faz login com as credenciais recebidas
```

**Por que RPC e não direto no cliente:**
O `auth.users` requer `service_role` para inserção direta. A `service_role` nunca pode ser exposta no cliente. A RPC roda com `SECURITY DEFINER` (contexto postgres), permitindo a operação de forma segura sem expor a chave.

**Futuro (PRD pendente):** fluxo de convite onde o aluno recebe um link por email e cria a própria senha. A tabela `student_invites` já existe no schema para quando esse fluxo for implementado.

---

### Fluxo: macros de uma refeição

```
quantity (gramas inseridas pelo professional)
serving_size (gramas por porção padrão da tabela foods)
macro_por_100g (proteína/carb/fat/fibra da tabela foods)

macro_na_refeicao = (quantity / 100) * macro_por_100g
```

Exemplo: 150g de frango (peito grelhado, 32g proteína/100g)
→ proteína = (150 / 100) * 32 = 48g

---

### Fluxo: execução de treino

```
Aluno abre treino → cria workout_session (started_at = now())
    → executa cada exercício
    → para cada exercício: insere workout_session_exercise
        → sets_data: [{set: 1, reps: 10, weight: 80, completed: true}, ...]
    → finaliza: atualiza workout_session (finished_at = now())
    → trigger (futuro): incrementa student_streaks + daily_goals
```

`sets_data` é `jsonb` — flexível para diferentes tipos de exercício (séries normais, AMRAP, tempo).

---

## RLS — resumo das políticas

| Tabela | Professional vê | Aluno vê |
|--------|----------------|----------|
| profiles | próprio + seus alunos | próprio + seus professionals |
| student_professionals | seus alunos | seus professionals |
| diet_plans | planos que criou | próprios planos |
| diet_meals | via plano | via plano |
| meal_logs | logs dos seus alunos | próprios logs |
| workouts | treinos que criou | próprios treinos |
| workout_sessions | sessões dos seus alunos | próprias sessões |
| achievements | conquistas dos seus alunos | próprias conquistas |
| foods | todos | todos |
| exercises | todos | todos |

Helper `is_professional_of(student_uuid)`: verifica se o usuário logado tem vínculo ativo com o aluno — usado nas políticas de select das tabelas de aluno.

---

## Segurança — decisões não-óbvias

- **`service_role` nunca no cliente**: toda operação que requer permissão elevada usa RPC com `SECURITY DEFINER`
- **Email confirmado automaticamente na criação pelo professional**: o professional criou a conta, então não faz sentido pedir confirmação de email ao aluno
- **Cascade delete controlado**: `diet_plans → diet_meals → diet_meal_items` e `workouts → workout_exercises` deletam em cascata. Relações de dados do aluno (sessões, logs) não deletam em cascata — preservação de histórico
- **`student_id` nullable em `student_professionals`**: reservado para o fluxo futuro de convite onde o vínculo existe antes do aluno ter conta

---

## Como aplicar as migrations em um novo projeto Supabase

1. Acesse o **SQL Editor** do projeto Supabase
2. Execute na ordem:
   ```
   0000_jazzy_mordo.sql         → tabelas e FKs
   0001_rls_and_triggers.sql    → RLS + trigger de auth
   0002_create_student_rpc.sql  → RPC de criação de aluno
   ```
3. Execute os seeds (opcional, recomendado):
   ```
   seeds/foods.sql
   seeds/exercises.sql
   ```

> Não rodar fora de ordem — o `0001` depende das tabelas do `0000`.
