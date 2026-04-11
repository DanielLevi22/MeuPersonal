# Web — Workout Management Feature Tracker

Documento de acompanhamento das features de gestão de treinos no web dashboard.
Escopo: **Personal Trainer** — criação e gestão de periodizações, fichas e treinos para alunos.
Execução de treinos é fluxo do aluno (mobile), não entra neste escopo.

---

## Status geral

| Feature | Prioridade | Status | Branch | PR |
|---|---|---|---|---|
| Listagem de periodizações | P0 | 🔲 Pending | - | - |
| Criar periodização | P0 | 🔲 Pending | - | - |
| Detalhes da periodização | P0 | 🔲 Pending | - | - |
| Criar ficha (training plan) | P0 | 🔲 Pending | - | - |
| Detalhes da ficha (phase) | P0 | 🔲 Pending | - | - |
| Criar treino manual | P0 | 🔲 Pending | - | - |
| Selecionar e configurar exercícios | P0 | 🔲 Pending | - | - |
| Detalhes do treino | P0 | 🔲 Pending | - | - |
| Banco de exercícios (listar + criar) | P1 | 🔲 Pending | - | - |
| Duplicar treino | P1 | 🔲 Pending | - | - |
| Geração de treinos com IA | P2 | 🔲 Pending | - | - |

---

## Hierarquia de dados

```
Periodização (training_periodizations)
└── Ficha / Fase (training_plans)
    └── Treino (workouts)
        └── Exercício do Treino (workout_exercises → exercises)
```

---

## Schema das tabelas envolvidas

### training_periodizations
| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | - |
| student_id | uuid FK → profiles | Aluno vinculado |
| personal_id | uuid FK → profiles | Personal que criou |
| professional_id | uuid FK → profiles | Mesmo que personal_id (legado) |
| name | text | Ex: "Hipertrofia - Ciclo 1" |
| objective | text | hypertrophy \| strength \| endurance \| weight_loss \| conditioning |
| start_date | date | - |
| end_date | date | - |
| status | text | planned \| active \| completed |
| notes | text | - |
| created_at | timestamptz | - |
| updated_at | timestamptz | - |

### training_plans (fichas / fases)
| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | - |
| periodization_id | uuid FK | - |
| name | text | Ex: "Ficha A", "Semana 1" |
| description | text | - |
| training_split | text | abc \| abcd \| abcde \| upper_lower \| full_body \| push_pull_legs \| custom |
| weekly_frequency | integer | 1–7 dias/semana |
| start_date | date | - |
| end_date | date | - |
| status | text | draft \| active \| completed |
| type | text | strength \| hypertrophy \| adaptation |
| notes | text | - |

### workouts
| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | - |
| training_plan_id | uuid FK | Ficha a qual pertence |
| title | text | Ex: "Treino A - Peito e Tríceps" |
| description | text | - |
| personal_id | uuid FK | Quem criou |
| muscle_group | text | Peito, Costas, Pernas, etc |
| identifier | text | A, B, C (posição no split) |
| difficulty_level | text | beginner \| intermediate \| advanced |
| estimated_duration | integer | minutos |
| focus_areas | jsonb | ["chest", "triceps"] |

### workout_exercises (itens do treino)
| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | - |
| workout_id | uuid FK | - |
| exercise_id | uuid FK | - |
| sets | integer | Número de séries |
| reps | text | "10", "8-12", "até falha" |
| weight | text | "20kg", "50%", "corporal" |
| rest_time | integer | segundos |
| notes | text | Técnica, observações |
| order | integer | Ordem de execução |

### exercises (banco de exercícios)
| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid PK | - |
| name | text | "Supino Reto", "Rosca Direta" |
| muscle_group | text | Grupo muscular |
| description | text | - |
| video_url | text | Link de demonstração |

---

## Prioridades

### P0 — Fluxo core de prescrição (sem isso o personal não consegue prescrever)
- [ ] Listagem de periodizações do profissional
- [ ] Criar periodização (nome, objetivo, aluno, datas)
- [ ] Página de detalhes da periodização (fichas vinculadas)
- [ ] Criar ficha/fase dentro de uma periodização
- [ ] Página de detalhes da ficha (treinos A, B, C...)
- [ ] Criar treino manual (título, grupo muscular)
- [ ] Selecionar exercícios do banco e configurar (sets, reps, peso, descanso)
- [ ] Página de detalhes do treino (lista de exercícios com configuração)

### P1 — Completam a gestão
- [ ] Banco de exercícios: listar todos, criar novo exercício
- [ ] Duplicar treino de uma ficha para outra
- [ ] Editar exercício dentro do treino (alterar sets/reps/ordem)
- [ ] Remover exercício do treino
- [ ] Editar treino (título, grupo muscular)
- [ ] Remover treino de uma ficha
- [ ] Editar ficha (nome, split, datas)
- [ ] Editar periodização

### P2 — Complementar
- [ ] Geração de treinos com IA (replicar AIWorkoutNegotiationModal)
- [ ] Visualização do histórico de sessões do aluno por treino
- [ ] Duplicar periodização inteira

---

## Detalhamento por feature

---

### P0 — Listagem de periodizações

**Rota:** `/dashboard/workouts`

**Objetivo:** Personal vê todas as suas periodizações, agrupadas ou filtradas por aluno.

**Dados exibidos:**
- Nome da periodização
- Nome do aluno vinculado
- Objetivo (label legível: "Hipertrofia", "Força", etc.)
- Datas (início → fim)
- Status com badge colorido (Planejada / Ativa / Concluída)
- Número de fichas

**Ações:**
- Botão "Nova Periodização"
- Clicar no card → vai para detalhes

**API necessária:**
```
GET /api/workouts/periodizations
  → lista training_periodizations WHERE professional_id = caller
  → JOIN com profiles para nome do aluno
```

**Arquivos a criar:**
- `web/src/app/api/workouts/periodizations/route.ts` — GET
- `web/src/modules/workouts/hooks/usePeriodizations.ts`
- `web/src/modules/workouts/pages/PeriodizationsPage.tsx`
- `web/src/app/dashboard/workouts/page.tsx`

---

### P0 — Criar periodização

**Rota:** Modal ou `/dashboard/workouts/new`

**Campos:**
| Campo | Tipo | Obrigatório |
|---|---|---|
| Nome | text | ✅ |
| Objetivo | select (hypertrophy, strength, endurance, weight_loss, conditioning) | ✅ |
| Aluno | select (lista de alunos ativos) | ✅ |
| Data início | date | ✅ |
| Data fim | date | ✅ |
| Observações | textarea | - |

**API necessária:**
```
POST /api/workouts/periodizations
  body: { name, objective, student_id, start_date, end_date, notes }
  → INSERT training_periodizations
```

**Arquivos a criar:**
- `web/src/modules/workouts/components/CreatePeriodizationModal.tsx`
- `web/src/modules/workouts/hooks/useCreatePeriodization.ts`
- POST handler em `web/src/app/api/workouts/periodizations/route.ts`

---

### P0 — Detalhes da periodização

**Rota:** `/dashboard/workouts/periodizations/[id]`

**Dados exibidos:**
- Header: nome, aluno, objetivo, datas, status
- Lista de fichas (training_plans) com: nome, split, datas, status, nº de treinos
- Estado vazio: "Nenhuma ficha criada"

**Ações:**
- "+ Adicionar Ficha"
- Clicar em ficha → vai para detalhes da ficha
- Ativar/concluir periodização (alterar status)

**API necessária:**
```
GET /api/workouts/periodizations/[id]
  → training_periodizations + training_plans + workouts count
```

**Arquivos a criar:**
- `web/src/app/api/workouts/periodizations/[id]/route.ts` — GET, PATCH
- `web/src/modules/workouts/hooks/usePeriodizationDetails.ts`
- `web/src/modules/workouts/pages/PeriodizationDetailsPage.tsx`
- `web/src/app/dashboard/workouts/periodizations/[id]/page.tsx`

---

### P0 — Criar ficha (training plan)

**Rota:** Modal aberto dentro da periodização

**Campos:**
| Campo | Tipo | Obrigatório |
|---|---|---|
| Nome | text | ✅ (ex: "Ficha A") |
| Split | select (ABC, ABCD, Upper/Lower, Full Body, Push/Pull/Legs, Custom) | ✅ |
| Frequência semanal | number (1–7) | ✅ |
| Data início | date | ✅ |
| Data fim | date | ✅ |
| Tipo | select (strength, hypertrophy, adaptation) | - |
| Descrição | textarea | - |

**API necessária:**
```
POST /api/workouts/periodizations/[id]/plans
  body: { name, training_split, weekly_frequency, start_date, end_date, type, description }
  → INSERT training_plans WHERE periodization_id = id
```

**Arquivos a criar:**
- `web/src/app/api/workouts/periodizations/[id]/plans/route.ts` — GET, POST
- `web/src/modules/workouts/components/CreateTrainingPlanModal.tsx`
- `web/src/modules/workouts/hooks/useCreateTrainingPlan.ts`

---

### P0 — Detalhes da ficha (phase)

**Rota:** `/dashboard/workouts/periodizations/[id]/phases/[phaseId]`

**Dados exibidos:**
- Header: nome da ficha, split, tipo, datas
- Lista de treinos (workouts) da ficha: identificador (A/B/C), título, grupo muscular, nº exercícios
- Estado vazio: "Nenhum treino criado"

**Ações:**
- "+ Criar Treino Manual"
- "+ Gerar com IA" (P2)
- Clicar em treino → vai para detalhes do treino

**API necessária:**
```
GET /api/workouts/plans/[phaseId]
  → training_plans + workouts (com count de workout_exercises)
```

**Arquivos a criar:**
- `web/src/app/api/workouts/plans/[phaseId]/route.ts` — GET, PATCH
- `web/src/modules/workouts/hooks/usePhaseDetails.ts`
- `web/src/modules/workouts/pages/PhaseDetailsPage.tsx`
- `web/src/app/dashboard/workouts/periodizations/[id]/phases/[phaseId]/page.tsx`

---

### P0 — Criar treino manual

**Rota:** Modal aberto dentro da ficha

**Campos:**
| Campo | Tipo | Obrigatório |
|---|---|---|
| Título | text | ✅ (ex: "Treino A - Peito e Tríceps") |
| Identificador | select (A, B, C, D, E, F) | ✅ |
| Grupo muscular | select (Peito, Costas, Ombros, Bíceps, Tríceps, Pernas, Abdômen, Full Body) | - |
| Nível de dificuldade | select (beginner, intermediate, advanced) | - |
| Duração estimada | number (minutos) | - |
| Descrição | textarea | - |

**Fluxo:** Após criar o treino → abre automaticamente a tela de seleção de exercícios.

**API necessária:**
```
POST /api/workouts/plans/[phaseId]/workouts
  body: { title, identifier, muscle_group, difficulty_level, estimated_duration, description }
  → INSERT workouts WHERE training_plan_id = phaseId
```

**Arquivos a criar:**
- `web/src/app/api/workouts/plans/[phaseId]/workouts/route.ts` — POST
- `web/src/modules/workouts/components/CreateWorkoutModal.tsx`
- `web/src/modules/workouts/hooks/useCreateWorkout.ts`

---

### P0 — Selecionar e configurar exercícios

**Rota:** `/dashboard/workouts/[workoutId]/exercises` (ou modal/drawer)

**Comportamento:**
1. Lista todos os exercícios do banco (`exercises` table)
2. Filtros: busca por nome, filtro por grupo muscular
3. Personal seleciona um exercício → abre painel de configuração lateral
4. Configura: sets, reps, peso, descanso (segundos), observações, ordem
5. Exercício aparece na lista de "selecionados"
6. Confirmar → bulk insert em `workout_exercises`

**Campos de configuração por exercício:**
| Campo | Tipo | Default |
|---|---|---|
| Séries (sets) | number | 3 |
| Repetições (reps) | text | "10" (suporta "8-12", "até falha") |
| Carga (weight) | text | "" |
| Descanso (rest_time) | number (segundos) | 60 |
| Observações | text | "" |
| Ordem | number | auto |

**API necessária:**
```
GET /api/exercises
  → SELECT * FROM exercises ORDER BY name
POST /api/workouts/[workoutId]/exercises
  body: { items: [{ exercise_id, sets, reps, weight, rest_time, notes, order }] }
  → bulk INSERT workout_exercises
DELETE /api/workouts/[workoutId]/exercises/[itemId]
PATCH /api/workouts/[workoutId]/exercises/[itemId]
```

**Arquivos a criar:**
- `web/src/app/api/exercises/route.ts` — GET (listar), POST (criar)
- `web/src/app/api/workouts/[workoutId]/exercises/route.ts` — POST (bulk)
- `web/src/app/api/workouts/[workoutId]/exercises/[itemId]/route.ts` — PATCH, DELETE
- `web/src/modules/workouts/hooks/useExercises.ts`
- `web/src/modules/workouts/hooks/useWorkoutExercises.ts`
- `web/src/modules/workouts/pages/SelectExercisesPage.tsx`

---

### P0 — Detalhes do treino

**Rota:** `/dashboard/workouts/[workoutId]`

**Dados exibidos:**
- Header: título, identificador, grupo muscular, dificuldade, duração estimada
- Breadcrumb: Periodização → Ficha → Treino
- Lista de exercícios com: ordem, nome, grupo muscular, sets × reps, carga, descanso, observações
- Estado vazio: "Nenhum exercício adicionado"

**Ações:**
- "+ Adicionar Exercícios" → vai para SelectExercisesPage
- Drag-and-drop ou setas para reordenar exercícios
- Ícone de editar por item → altera configuração inline ou modal
- Ícone de remover por item
- Botão "Editar Treino" (título, descrição)

**API necessária:**
```
GET /api/workouts/[workoutId]
  → workouts JOIN workout_exercises JOIN exercises
```

**Arquivos a criar:**
- `web/src/app/api/workouts/[workoutId]/route.ts` — GET, PATCH, DELETE
- `web/src/modules/workouts/hooks/useWorkoutDetails.ts`
- `web/src/modules/workouts/pages/WorkoutDetailsPage.tsx`
- `web/src/app/dashboard/workouts/[workoutId]/page.tsx`

---

### P1 — Banco de exercícios

**Rota:** `/dashboard/exercises`

**Dados exibidos:**
- Grid/lista de exercícios: nome, grupo muscular, video (se tiver)
- Filtro por grupo muscular
- Busca por nome

**Ações:**
- "+ Novo Exercício" → modal com: nome (obrigatório), grupo muscular, descrição, URL do vídeo

**Arquivos a criar:**
- `web/src/modules/workouts/pages/ExercisesPage.tsx`
- `web/src/modules/workouts/components/CreateExerciseModal.tsx`
- `web/src/modules/workouts/hooks/useCreateExercise.ts`
- `web/src/app/dashboard/exercises/page.tsx`

---

### P2 — Geração de treinos com IA

**Rota:** Modal dentro dos detalhes da ficha

**Fluxo:**
1. Personal clica "Gerar com IA" em uma ficha
2. Modal coleta contexto:
   - Preferências do aluno (exercícios que gosta/não gosta)
   - Restrições/lesões
   - Observações adicionais
3. Envia para a API de IA (Gemini, mesmo serviço do mobile)
4. Exibe plano gerado para revisão
5. Personal confirma → workouts e workout_exercises são inseridos em batch

**Referência mobile:** `AIWorkoutNegotiationModal.tsx` + `WorkoutAIService.ts`

---

## Arquitetura web

### Estrutura de módulo

```
web/src/
  app/
    api/
      exercises/
        route.ts                              ← GET, POST
      workouts/
        periodizations/
          route.ts                            ← GET, POST
          [id]/
            route.ts                          ← GET, PATCH, DELETE
            plans/
              route.ts                        ← GET, POST
        plans/
          [phaseId]/
            route.ts                          ← GET, PATCH
            workouts/
              route.ts                        ← POST
        [workoutId]/
          route.ts                            ← GET, PATCH, DELETE
          exercises/
            route.ts                          ← POST (bulk)
            [itemId]/
              route.ts                        ← PATCH, DELETE
    dashboard/
      workouts/
        page.tsx                              ← PeriodizationsPage
        periodizations/
          [id]/
            page.tsx                          ← PeriodizationDetailsPage
            phases/
              [phaseId]/
                page.tsx                      ← PhaseDetailsPage
      exercises/
        page.tsx                              ← ExercisesPage
  modules/workouts/
    components/
      CreatePeriodizationModal.tsx
      CreateTrainingPlanModal.tsx
      CreateWorkoutModal.tsx
      CreateExerciseModal.tsx
      ExerciseConfigPanel.tsx                 ← configurar sets/reps inline
    hooks/
      usePeriodizations.ts
      useCreatePeriodization.ts
      usePeriodizationDetails.ts
      useCreateTrainingPlan.ts
      usePhaseDetails.ts
      useCreateWorkout.ts
      useWorkoutDetails.ts
      useWorkoutExercises.ts
      useExercises.ts
      useCreateExercise.ts
    pages/
      PeriodizationsPage.tsx
      PeriodizationDetailsPage.tsx
      PhaseDetailsPage.tsx
      WorkoutDetailsPage.tsx
      SelectExercisesPage.tsx
      ExercisesPage.tsx
    types.ts
    index.ts
```

### Acesso ao banco (RLS)

| Tabela | Quem acessa via web | Como |
|---|---|---|
| training_periodizations | Professional (lê e cria os seus) | `professional_id = auth.uid()` |
| training_plans | Professional (via periodização) | `supabaseAdmin` + verificação de ownership |
| workouts | Professional (via training_plan) | `supabaseAdmin` + verificação de ownership |
| workout_exercises | Professional (via workout) | `supabaseAdmin` + verificação de ownership |
| exercises | Todos (leitura pública) | Direto |

> **Nota:** Usar `supabaseAdmin` nas API routes para garantir acesso sem conflito de RLS, com verificação manual de ownership (igual ao padrão já usado em `/api/students`).

---

## Sequência de implementação sugerida

```
Sprint 1 — Estrutura base (Periodizações)
  1. GET/POST /api/workouts/periodizations
  2. usePeriodizations + useCreatePeriodization
  3. PeriodizationsPage (listagem)
  4. CreatePeriodizationModal

Sprint 2 — Fichas
  5. GET/POST /api/workouts/periodizations/[id] + /plans
  6. PeriodizationDetailsPage
  7. CreateTrainingPlanModal

Sprint 3 — Treinos
  8. POST /api/workouts/plans/[phaseId]/workouts
  9. PhaseDetailsPage
  10. CreateWorkoutModal

Sprint 4 — Exercícios
  11. GET/POST /api/exercises
  12. POST/PATCH/DELETE /api/workouts/[workoutId]/exercises
  13. SelectExercisesPage + ExerciseConfigPanel
  14. WorkoutDetailsPage

Sprint 5 — P1
  15. ExercisesPage + CreateExerciseModal
  16. Editar/remover exercício do treino
  17. Duplicar treino
```
