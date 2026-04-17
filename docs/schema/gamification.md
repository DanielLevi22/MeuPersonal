# Schema — Módulo Gamification

> **Status:** ✅ Aprovado
> Parte do [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) — fonte da verdade para geração das migrations.

---

## Contexto e responsabilidade do módulo

O módulo Gamification mantém o engajamento do aluno de forma **100% automática** — o especialista nunca configura nada aqui. Ele cria os planos de dieta e treino, e o sistema deriva tudo automaticamente.

Três mecanismos:
1. **Metas diárias** — acompanha progresso de refeições e treinos do dia (`daily_goals`)
2. **Sequência** — rastreia dias consecutivos de atividade com proteção via freeze (`student_streaks`)
3. **Conquistas** — registra badges desbloqueados por marcos alcançados (`achievements`)

---

## Como os módulos se conectam

```
Nutrition (meal_logs.completed)  ──→  daily_goals.meals_completed
Workouts (workout_sessions)      ──→  daily_goals.workout_completed
daily_goals.completed = true     ──→  student_streaks (atualiza sequência)
student_streaks / daily_goals    ──→  achievements (verifica conquistas)
```

A atualização acontece em cascata na camada de aplicação, sempre que o aluno registra uma ação:
1. Aluno faz check-in de refeição → atualiza `meal_logs` → chama `updateMealProgress`
2. Aluno registra sessão de treino → atualiza `workout_sessions` → chama `updateWorkoutProgress`
3. Após qualquer atualização de progresso → verifica se o dia foi completado → atualiza streak → verifica conquistas

---

## Tabela `daily_goals` — metas diárias

```
daily_goals
├── id                    uuid        PK
├── student_id            uuid        NOT NULL FK → profiles.id CASCADE DELETE
├── date                  date        NOT NULL
│
├── — Dieta —
├── meals_target          integer     NOT NULL DEFAULT 0
├── meals_completed       integer     NOT NULL DEFAULT 0
│
├── — Treino —
├── workout_target        integer     NOT NULL DEFAULT 0
├── workout_completed     integer     NOT NULL DEFAULT 0
│
├── completed             boolean     NOT NULL DEFAULT false
├── completion_percentage integer     NOT NULL DEFAULT 0  — 0 a 100
│
└── created_at            timestamptz NOT NULL DEFAULT now()

UNIQUE(student_id, date)
```

### Como `meals_target` é calculado

Executado pela RPC `calculate_daily_goals(p_student_id, p_date)` ao abrir o app:

```
1. Busca diet_plan ativo do aluno (status = 'active')
2. Se plan_type = 'unique':
       meals_target = COUNT(diet_meals WHERE diet_plan_id = plano AND day_of_week IS NULL)
   Se plan_type = 'cyclic':
       meals_target = COUNT(diet_meals WHERE diet_plan_id = plano AND day_of_week = dia_da_semana(p_date))
3. Se não há plano ativo:
       meals_target = 0
```

### Como `workout_target` é calculado

```
1. Busca training_plan ativo do aluno (status = 'active') via training_periodizations
2. workout_target = COUNT(workouts WHERE training_plan_id = plano AND day_of_week = dia_da_semana(p_date))
3. Se não há plano ativo:
       workout_target = 0
```

### Como `completion_percentage` é calculado

```
total_target    = meals_target + workout_target
total_completed = meals_completed + workout_completed

completion_percentage = CASE
  WHEN total_target = 0 THEN 0
  ELSE ROUND((total_completed::numeric / total_target) * 100)
END
```

Dieta e treino têm peso igual na porcentagem. Se o aluno não tem plano de treino ativo, apenas a dieta conta (e vice-versa).

### Como `completed` é atualizado

```
completed = (completion_percentage = 100)
```

Setado junto com `completion_percentage` a cada atualização. `true` apenas quando o aluno completou **todas** as refeições e **todos** os treinos do dia.

### Por que persistir `meals_target` e `completion_percentage`

Esses valores são **derivados** dos planos ativos — poderiam ser calculados on-the-fly. Persistimos porque:
- Se o especialista editar o plano depois, o histórico do dia anterior não deve mudar
- O gráfico semanal lê 7 registros de uma vez — recalcular em tempo real exigiria joins complexos com `diet_meals` e `workouts` para cada dia

### UNIQUE(student_id, date)

Um registro por aluno por dia. A RPC faz upsert — cria se não existe, atualiza `meals_target` e `workout_target` se o plano mudou desde a última abertura do app.

---

## Tabela `student_streaks` — sequência de dias

```
student_streaks
├── id                  uuid        PK
├── student_id          uuid        NOT NULL UNIQUE FK → profiles.id CASCADE DELETE
├── current_streak      integer     NOT NULL DEFAULT 0
├── longest_streak      integer     NOT NULL DEFAULT 0
├── last_activity_date  date        NULL
├── freeze_available    integer     NOT NULL DEFAULT 0
├── last_freeze_date    date        NULL
└── updated_at          timestamptz NOT NULL DEFAULT now()
```

### Como o streak é atualizado

Disparado quando `daily_goals.completed` muda para `true`:

```
hoje = data atual
ontem = hoje - 1 dia

SE last_activity_date = ontem:
    current_streak += 1          — sequência continua
SENÃO SE last_activity_date = hoje:
    (nenhuma ação — já foi contado hoje)
SENÃO:
    current_streak = 1           — sequência reinicia

last_activity_date = hoje
longest_streak = MAX(longest_streak, current_streak)
```

### Quando o streak quebra

Verificado diariamente (ao abrir o app, antes de calcular as metas do dia):

```
SE last_activity_date < hoje - 1 dia:
    SE freeze_available > 0 E last_freeze_date != ontem:
        freeze_available -= 1
        last_freeze_date = ontem    — freeze usado retroativamente
        (current_streak mantido)
    SENÃO:
        current_streak = 0          — sequência perdida
```

### Como o freeze é ganho

```
A cada vez que current_streak atinge múltiplo de 7 (7, 14, 21, 28...):
    freeze_available += 1
```

O freeze é a recompensa por consistência — completar 7 dias seguidos garante proteção para um dia de imprevisto.

### `last_freeze_date`

Impede usar dois freezes em dias consecutivos — o freeze protege um único dia de ausência, não uma semana inteira.

---

## Tabela `achievements` — conquistas desbloqueadas

```
achievements
├── id          uuid        PK
├── student_id  uuid        NOT NULL FK → profiles.id CASCADE DELETE
├── type        text        NOT NULL — 'streak' | 'milestone' | 'challenge'
├── title       text        NOT NULL
├── description text        NULL
├── icon        text        NULL — emoji ou nome do ícone
├── earned_at   timestamptz NOT NULL DEFAULT now()
└── points      integer     NOT NULL DEFAULT 0
```

### Conquistas pré-definidas

Verificadas automaticamente após cada atualização de streak ou daily_goals:

**Tipo `streak` — sequências:**

| Conquista | Condição | Pontos |
|---|---|---|
| Primeiros passos | current_streak >= 3 | 10 |
| Uma semana | current_streak >= 7 | 25 |
| Quinzena | current_streak >= 15 | 50 |
| Um mês | current_streak >= 30 | 100 |
| Lenda | current_streak >= 100 | 500 |

**Tipo `milestone` — marcos:**

| Conquista | Condição | Pontos |
|---|---|---|
| Primeira meta | Primeiro daily_goals.completed = true | 10 |
| Semana perfeita | 7 daily_goals.completed = true consecutivos | 50 |
| Mês dedicado | 20 daily_goals.completed = true no mesmo mês | 100 |

**Tipo `challenge` — desafios:**

| Conquista | Condição | Pontos |
|---|---|---|
| Nutrição impecável | 7 dias com 100% só de dieta | 40 |
| Atleta | 7 dias com 100% só de treino | 40 |
| Guerreiro | 30 dias com completion_percentage >= 80% | 150 |

### Lógica de verificação

```
Após atualizar daily_goals ou student_streaks:
    Para cada conquista pré-definida:
        SE condição satisfeita E não existe achievements WHERE student_id = X AND title = conquista:
            INSERT em achievements
```

A checagem de "já tem essa conquista" evita duplicatas para conquistas únicas. Conquistas de streak são únicas por marco (7 dias é dado uma única vez, mesmo que o streak quebre e recomece).

### Sem tabela de catálogo separada

No MVP, o catálogo de conquistas é código — está nas regras de verificação da aplicação, não no banco. Uma tabela `achievement_definitions` faria sentido quando houver interface de admin para criar conquistas customizadas. Por ora é complexidade sem benefício.

---

## Relações do módulo Gamification

```
profiles (Auth)
    │
    ├── daily_goals (1:N) — um por dia por aluno
    │       ├── targets derivados de diet_plans (Nutrition)
    │       └── targets derivados de training_plans (Workouts)
    │
    ├── student_streaks (1:1) — um por aluno
    │       └── atualizado quando daily_goals.completed = true
    │
    └── achievements (1:N) — log permanente de conquistas
            └── verificados após atualização de streak ou daily_goals
```

---

## O que foi explicitamente rejeitado

| Decisão rejeitada | Motivo |
|---|---|
| Especialista configura metas manualmente | Mais trabalho pro especialista sem ganho. As metas já estão nos planos ativos. |
| `weekly_goals` como tabela separada | Metas semanais são agregação de `daily_goals` — busca os últimos 7 dias. Tabela separada duplicaria dados. |
| Recalcular targets on-the-fly | Histórico seria afetado por mudanças no plano. Persistir garante que o registro do dia anterior reflete o plano que existia naquele dia. |
| Catálogo de conquistas no banco | Complexidade desnecessária no MVP. Catálogo é código — vira banco quando houver admin configurando. |
| Peso diferente para dieta vs treino no `completion_percentage` | Simplicidade — pesos iguais. Se um aluno não tem plano de treino, apenas a dieta conta (target = 0 é neutro no cálculo). |
| Controle de hidratação (water_target_ml) | Fora do escopo do MVP. |
| Ranking entre alunos | O sistema rankeia automaticamente por pontos de conquistas — não é o especialista que define. |

---

## Compliance LGPD

Dados comportamentais revelam padrão de atividade física e alimentar — dados de saúde indireta.

| Tabela | Base legal | Artigo |
|---|---|---|
| `daily_goals` | Tutela da saúde + Consentimento | Art. 11, II, f + I |
| `student_streaks` | Tutela da saúde + Consentimento | Art. 11, II, f + I |
| `achievements` | Legítimo interesse (engajamento do serviço) | Art. 7°, IX |

### RLS — políticas mínimas

```sql
-- daily_goals
-- SELECT: apenas o próprio student + specialist com vínculo active
-- INSERT/UPDATE: via RPC calculate_daily_goals (service role)

-- student_streaks
-- SELECT: student proprietário + specialist com vínculo active
-- INSERT/UPDATE: via RPC de atualização de streak (service role)

-- achievements
-- SELECT: student proprietário + specialist com vínculo active
-- INSERT: via RPC de verificação de conquistas (service role)
-- DELETE: proibido — conquistas são permanentes
```

### Exclusão de conta

Todos os registros deletados por CASCADE DELETE em `student_id`.
