# Schema — Módulo Nutrition

> **Status:** ✅ Aprovado
> Parte do [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) — fonte da verdade para geração das migrations.

---

## Contexto

O módulo Nutrition gerencia o ciclo completo de prescrição e acompanhamento alimentar:

1. **Catálogo** — banco de alimentos público (TBCA/USDA) e customizados por especialista (`foods`)
2. **Prescrição** — plano alimentar com refeições e alimentos por dia (`diet_plans`, `diet_meals`, `diet_meal_items`)
3. **Acompanhamento** — registro diário do aluno: o que comeu, substituições, check-in por refeição (`meal_logs`)

Progresso corporal (peso, % gordura, medidas) não vive aqui — vem de `physical_assessments` e `body_scans` do módulo Assessment.

---

## Hierarquia de prescrição

```
diet_plans         ← plano do aluno  ("Cutting — Janeiro 2026")
    └── diet_meals ← refeição        ("Almoço — Segunda")
            └── diet_meal_items      ← prescrição (Frango 200g, Arroz 100g)
                    └── foods        ← catálogo de alimentos
```

O aluno registra o dia a dia em `meal_logs` — um log por refeição por dia, com flag de conclusão e substituições.

---

## Enums

```sql
CREATE TYPE diet_plan_status AS ENUM ('active', 'finished');
CREATE TYPE diet_plan_type   AS ENUM ('unique', 'cyclic');
```

| Enum | Valores | Usado em |
|---|---|---|
| `diet_plan_status` | `active \| finished` | `diet_plans.status` |
| `diet_plan_type` | `unique \| cyclic` | `diet_plans.plan_type` |

**`diet_plan_type`**:
- `unique` — mesma dieta todos os dias. Refeições têm `day_of_week = NULL`.
- `cyclic` — dieta diferente por dia da semana. Refeições têm `day_of_week = 0–6`.

**`diet_plan_status`** — apenas dois valores:
- `active` — plano em uso
- `finished` — encerrado (manual ou por expiração de `end_date`)

Não existe `completed` separado de `finished` — a distinção "manual vs expirado" é detalhe de implementação, não de estado persistido. Se `end_date < hoje` e `status = active`, o app finaliza automaticamente ao detectar.

---

## Tabela `foods` — catálogo global

```
foods
├── id            uuid        PK
├── name          text        NOT NULL
├── category      text        NULL — ex: 'Proteína', 'Carboidrato', 'Gordura', 'Vegetal'
├── serving_size  numeric(7,2) NOT NULL DEFAULT 100
├── serving_unit  text        NOT NULL DEFAULT 'g' — g, ml, unidade
│
├── — Macros por porção —
├── calories      numeric(7,2) NULL
├── protein       numeric(7,2) NULL
├── carbs         numeric(7,2) NULL
├── fat           numeric(7,2) NULL
├── fiber         numeric(7,2) NULL
│
├── source        text        NULL — 'TBCA', 'USDA', 'Manual'
├── is_custom     boolean     NOT NULL DEFAULT false
├── created_by    uuid        NULL FK → profiles.id SET NULL
├── search_vector tsvector    NULL — atualizado por trigger para busca full-text
└── created_at    timestamptz NOT NULL DEFAULT now()
```

**`is_custom + created_by`**: alimentos públicos têm `is_custom = false, created_by = NULL`. Alimentos criados por especialistas têm `is_custom = true, created_by = specialist_id`. O RLS permite que cada especialista veja os alimentos públicos mais os seus próprios customizados.

**`created_by SET NULL`**: se o especialista sair da plataforma, seus alimentos customizados são preservados — evita quebrar planos que os referenciam. O alimento fica "órfão" mas funcional.

**`search_vector`**: coluna `tsvector` atualizada por trigger a cada INSERT/UPDATE em `name`. Permite busca full-text eficiente sem depender de `ILIKE` em tabelas grandes (3500+ alimentos TBCA).

**`category` como text**: categorias de alimentos variam por contexto ("Proteína" vs "Carne Vermelha" vs "Carne"). Flexibilidade necessária — não vale enum.

---

## Tabela `diet_plans` — plano alimentar

```
diet_plans
├── id               uuid              PK
├── student_id       uuid              NOT NULL FK → profiles.id CASCADE DELETE
├── specialist_id    uuid              NULL FK → profiles.id SET NULL
├── name             text              NULL — ex: "Cutting Janeiro 2026"
├── plan_type        diet_plan_type    NOT NULL DEFAULT 'cyclic'
├── status           diet_plan_status  NOT NULL DEFAULT 'active'
├── version          integer           NOT NULL DEFAULT 1
│
├── start_date       date              NULL
├── end_date         date              NULL
│
├── — Metas do plano —
├── target_calories  numeric(7,2)      NULL
├── target_protein   numeric(7,2)      NULL
├── target_carbs     numeric(7,2)      NULL
├── target_fat       numeric(7,2)      NULL
│
├── notes            text              NULL
└── created_at       timestamptz       NOT NULL DEFAULT now()
```

**`specialist_id NULL`**: o especialista pode ser desvinculado após criar o plano. `SET NULL` preserva o plano — o aluno não perde o histórico.

**`version`**: número de versão exibido na aba "Histórico". Incrementado manualmente pelo especialista ao criar uma nova versão do plano. Sem lógica automática de versionamento — é só um label.

**Sem `is_active`**: redundante com `status`. Um plano é ativo se `status = 'active'`. Dois campos com a mesma informação criam risco de inconsistência.

**Um plano ativo por aluno**: enforçado na aplicação — antes de criar um novo plano, o anterior é finalizado. Não adicionamos constraint único no banco por `status` porque histórico de planos do mesmo aluno com `status = 'finished'` deve existir múltiplos.

---

## Tabela `diet_meals` — refeições do plano

```
diet_meals
├── id               uuid        PK
├── diet_plan_id     uuid        NOT NULL FK → diet_plans.id CASCADE DELETE
├── name             text        NOT NULL — ex: 'Almoço', 'Pré-treino'
├── meal_type        text        NULL — categoria livre: 'main', 'snack', etc.
├── meal_order       integer     NOT NULL DEFAULT 0 — ordenação dentro do dia
├── day_of_week      integer     NULL — 0=Dom, 1=Seg … 6=Sáb. NULL = dieta única
├── meal_time        text        NULL — ex: '12:30' — horário sugerido
├── target_calories  numeric(7,2) NULL
└── created_at       timestamptz NOT NULL DEFAULT now()
```

**`day_of_week NULL` para dieta única**: quando `diet_plans.plan_type = 'unique'`, todas as refeições têm `day_of_week = NULL` — as mesmas refeições valem para todos os dias. Quando `plan_type = 'cyclic'`, `day_of_week` é obrigatório (0–6). Mais limpo que usar `-1` como sentinela.

**`name` livre**: o especialista nomeia a refeição como quiser — "Café da manhã", "Pré-treino", "Ceia fit". Não é enum para não limitar a criatividade do especialista.

**`meal_type` como texto livre**: categoria opcional para agrupar refeições em relatórios futuros. Sem enum — o produto ainda está descobrindo quais categorias fazem sentido.

---

## Tabela `diet_meal_items` — alimentos da refeição

```
diet_meal_items
├── id            uuid        PK
├── diet_meal_id  uuid        NOT NULL FK → diet_meals.id CASCADE DELETE
├── food_id       uuid        NOT NULL FK → foods.id RESTRICT
├── quantity      numeric(7,2) NOT NULL
├── unit          text        NOT NULL — 'g', 'ml', 'unidade', 'colher de sopa'
├── order_index   integer     NOT NULL DEFAULT 0
└── created_at    timestamptz NOT NULL DEFAULT now()
```

**`food_id RESTRICT`**: não permite deletar um alimento que está sendo usado em alguma refeição prescrita. Diferente de `CASCADE` (que destruiria silenciosamente a prescrição) ou `SET NULL` (que deixaria item sem alimento). O especialista precisa remover o item primeiro.

**`unit` como text**: unidades de medida são muito variadas no contexto de nutrição — "colher de sopa", "xícara", "fatia", "unidade pequena". Enum seria restritivo demais.

---

## Tabela `meal_logs` — registro diário do aluno

```
meal_logs
├── id             uuid        PK
├── student_id     uuid        NOT NULL FK → profiles.id CASCADE DELETE
├── diet_plan_id   uuid        NULL FK → diet_plans.id SET NULL
├── diet_meal_id   uuid        NULL FK → diet_meals.id SET NULL
├── logged_date    date        NOT NULL
├── completed      boolean     NOT NULL DEFAULT false
├── actual_items   jsonb       NULL
│   — [{id, food_id, quantity, unit, is_substitution, food: {id,name,calories,protein,carbs,fat}}]
├── notes          text        NULL
├── photo_url      text        NULL — foto do prato (futuro)
└── created_at     timestamptz NOT NULL DEFAULT now()

UNIQUE(student_id, diet_meal_id, logged_date)
```

**Uma tabela, dois propósitos**: `completed` registra o check-in da refeição. `actual_items` registra substituições — o aluno trocou um alimento por outro. Os dois acontecem no mesmo contexto (o aluno registrando o dia) e compartilham a mesma linha.

**Por que `actual_items` em jsonb e não tabela separada?**
Substituições são sempre lidas como bloco junto com o log — nunca consultamos um alimento específico dentro de `actual_items`. A query é sempre "me dê o log desta refeição neste dia". jsonb é adequado para dados sempre lidos em conjunto.

**`diet_plan_id SET NULL` e `diet_meal_id SET NULL`**: o log pertence ao aluno — se o plano ou a refeição for deletado, o histórico do aluno é preservado com os campos zerados. O aluno ainda tem a data e o `completed` como referência.

**`UNIQUE(student_id, diet_meal_id, logged_date)`**: garante que existe no máximo um log por refeição por dia por aluno. Um check-in é atualizado (UPDATE), não duplicado.

---

## Relações do módulo Nutrition

```
profiles (Auth)
    │
    ├── diet_plans (1:N por aluno)
    │       ├── student_id    → profiles.id
    │       ├── specialist_id → profiles.id (SET NULL)
    │       └── diet_meals (1:N)
    │               └── diet_meal_items (1:N)
    │                       └── food_id → foods.id (RESTRICT)
    │
    └── meal_logs (1:N por aluno)
            ├── student_id   → profiles.id
            ├── diet_plan_id → diet_plans.id (SET NULL)
            └── diet_meal_id → diet_meals.id (SET NULL)

foods (catálogo global)
    └── created_by → profiles.id (SET NULL) — apenas para is_custom = true
```

---

## O que foi explicitamente rejeitado

| Decisão rejeitada | Motivo |
|---|---|
| `nutrition_plans` como nome da tabela | Padronizado com prefixo `diet_` consistente com o restante do módulo |
| `meals` e `meal_foods` como nomes | Genéricos demais — `diet_meals` e `diet_meal_items` deixam clara a hierarquia |
| Dois campos `is_active` + `status` em `diet_plans` | Redundância — `status` sozinho é suficiente. Dois campos com a mesma informação criam risco de inconsistência |
| Três valores de status: `active / finished / completed` | `finished` cobre ambos os casos (manual e expirado). A distinção é detalhe de implementação, não de estado persistido |
| `day_of_week = -1` para dieta única | `NULL` é semânticamente correto para "não se aplica". Sentinela numérico é hack |
| `nutrition_progress` como tabela separada | Dados de progresso corporal vivem em `physical_assessments` e `body_scans` (Assessment). Fonte única de verdade |
| `actual_items` em tabela separada | Substituições são sempre lidas em bloco com o log — jsonb é adequado. Tabela separada adicionaria join sem ganho |
| Alimentos customizados globais (visíveis para todos) | Cada especialista tem escopo próprio. Alimentos globais precisariam de moderação — complexidade desnecessária no MVP |
| Enum para `meal_type` e `unit` | Muita variação legítima nesses campos. Enum restringiria sem benefício real |

---

## Compliance LGPD

### Dados deste módulo

`diet_plans`, `diet_meals` e `diet_meal_items` são dados de saúde indireta — a dieta prescrita revela condições de saúde e objetivos corporais do aluno.

`meal_logs` é dado de comportamento alimentar — quando o aluno comeu, o que comeu, substituições. Dado sensível pelo contexto.

### Bases legais

| Tabela | Base legal | Artigo |
|---|---|---|
| `diet_plans`, `diet_meals`, `diet_meal_items` | Tutela da saúde + Consentimento | Art. 11, II, f + I |
| `meal_logs` | Tutela da saúde + Consentimento | Art. 11, II, f + I |
| `foods` | Legítimo interesse / contrato | Art. 7°, IX — catálogo público sem dado pessoal |

### RLS — políticas mínimas

```sql
-- diet_plans
-- SELECT: student proprietário + specialist com vínculo active (nutrition_consulting)
-- INSERT: specialist com vínculo active (nutrition_consulting)
-- UPDATE: specialist com vínculo active
-- DELETE: proibido — finalizar via status = 'finished'

-- diet_meals / diet_meal_items
-- SELECT: herda acesso do diet_plan
-- INSERT/UPDATE/DELETE: specialist com vínculo active

-- meal_logs
-- SELECT: student proprietário + specialist com vínculo active
-- INSERT/UPDATE: apenas o próprio student
-- DELETE: apenas via fluxo de exclusão de conta

-- foods
-- SELECT: todos os autenticados (públicos) + created_by = auth.uid() (customizados)
-- INSERT: qualquer specialist (para is_custom = true)
-- UPDATE/DELETE: apenas created_by = auth.uid()
```

### Exclusão de conta do aluno

1. `meal_logs` → deletar (CASCADE DELETE por student_id)
2. `diet_plans` → deletar (CASCADE DELETE por student_id) — leva junto `diet_meals` e `diet_meal_items`
3. Alimentos customizados criados pelo aluno não existem (alunos não criam foods)
