# PRD: Workout Execution Tracking

**Data de criação:** 2026-04-29
**Status:** approved
**Branch:** feature/workout-execution-tracking
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Sistema de execução de treino com rastreamento por série: o aluno executa o treino, pode ajustar exercício/peso/reps/descanso em tempo real, e ao finalizar todos os dados são salvos em batch no banco para alimentar métricas de evolução.

### Por quê?
Hoje o `workout-execute` screen lê tabelas que não existem (`workout_items`, `workout_exercise_logs`), o `WorkoutAnalyticsService` referencia `workout_session_items` e `workout_session_sets` também inexistentes — toda a feature de execução está quebrada. Além disso, não há dados suficientes para mostrar ao aluno se ele está evoluindo (carga, volume, histórico por exercício).

### Como saberemos que está pronto?
- [ ] Aluno abre treino e vê lista de exercícios (com sets prescritos como ponto de partida)
- [ ] Aluno pode marcar cada série como concluída, editar peso/reps/descanso por série
- [ ] Ao finalizar, `workout_sessions` fecha com `completed_at` e `workout_session_exercises` + `workout_session_sets` têm todos os dados reais
- [ ] `WorkoutAnalyticsService` retorna dados corretos (volume por músculo, carga semanal, histórico por exercício)
- [ ] Typecheck e lint passam sem erros

---

## Contexto

O schema do banco tem:
- `workout_exercises` → prescrição (sets, reps, weight, rest_seconds por exercício do treino)
- `workout_session_exercises` → execução por exercício, com campo `sets_data jsonb` (não normalizado)
- `workout_sessions` → cabeçalho da sessão

O app usava nomes alternativos (`workout_items`, `workout_session_items`, `workout_session_sets`) que nunca existiram no banco. O campo `sets_data` jsonb inviabiliza queries analíticas relacionais.

---

## Escopo

### Incluído
- Migration: adicionar `exercise_id` a `workout_session_exercises`, criar `workout_session_sets` normalizado
- Corrigir `workout-execute/[id].tsx`: lê de `workout_exercises` (não `workout_items`)
- Corrigir `WorkoutAnalyticsService.ts`: lê de `workout_session_exercises` + `workout_session_sets`
- UI de execução: cada exercício expande com as séries prescritas; aluno edita peso/reps/descanso por série e marca como concluída
- Salvar em batch no `finishWorkout` (local state durante execução, um INSERT ao final)
- Lógica de "troca de exercício": aluno pode substituir um exercício por outro da mesma sessão (registra exercise_id real, mantém FK do prescribed como referência)

### Fora do escopo
- Push notifications de descanso (feature separada)
- Criação de treinos pelo aluno
- Compartilhamento de sessões
- Integração com wearables
- `WorkoutAnalyticsService` refatorado em hook TanStack Query (pode ser feito depois)

---

## Fluxo de dados

```
Aluno abre [id].tsx
  → SELECT workout_exercises (prescrição) por workout_id
  → Cria workout_sessions (INSERT, sem completed_at)
  → Estado local: Map<exerciseId, SetState[]>
      SetState = { reps_actual, weight_actual, rest_actual, completed, skipped }

Durante execução:
  → Usuário edita série → atualiza estado local (sem DB)
  → Usuário troca exercício → atualiza exercise_id no estado local

Ao finalizar (finishWorkout):
  → UPDATE workout_sessions SET completed_at = now()
  → Para cada exercício:
      INSERT workout_session_exercises (session_id, workout_exercise_id, exercise_id)
      → id do row inserido →
      INSERT workout_session_sets[] (session_exercise_id, set_index, reps_prescribed, reps_actual, weight_prescribed, weight_actual, rest_prescribed, rest_actual, completed, skipped)
```

---

## Schema — Migration 0007

### Alterações em `workout_session_exercises`
```sql
ALTER TABLE workout_session_exercises
  ADD COLUMN exercise_id uuid REFERENCES exercises(id) ON DELETE SET NULL,
  ADD COLUMN notes text;
-- sets_data mantido para compatibilidade, pode ser removido em migration futura
```

### Nova tabela `workout_session_sets`
```sql
CREATE TABLE workout_session_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id uuid NOT NULL REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
  set_index integer NOT NULL,           -- 0-based, ordem da série
  reps_prescribed integer,
  reps_actual integer,
  weight_prescribed numeric(6,2),       -- kg
  weight_actual numeric(6,2),
  rest_prescribed integer,              -- segundos
  rest_actual integer,
  completed boolean NOT NULL DEFAULT false,
  skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX ON workout_session_sets (session_exercise_id);
```

### RLS
```sql
-- workout_session_sets herda proteção via workout_session_exercises → workout_sessions → student_id
ALTER TABLE workout_session_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_own_sets" ON workout_session_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_session_exercises wse
      JOIN workout_sessions ws ON ws.id = wse.session_id
      WHERE wse.id = workout_session_sets.session_exercise_id
        AND ws.student_id = auth.uid()
    )
  );
```

---

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `workout_exercises` | SELECT | Prescrição — lido no início da sessão |
| `workout_sessions` | INSERT, UPDATE | Criação e fechamento da sessão |
| `workout_session_exercises` | INSERT | Um row por exercício executado; novo campo `exercise_id` |
| `workout_session_sets` | INSERT (batch) | Um row por série executada; INSERT em batch no `finishWorkout` |
| `exercises` | SELECT | Para busca na troca de exercício |

---

## Impacto em outros módulos

- `WorkoutAnalyticsService` — reescrever queries (workout_session_items → workout_session_exercises, workout_session_sets agora existe)
- `exercise-detail` screen — provavelmente usa `workout_exercise_logs`; alinhar ao novo schema
- `workout_session_exercises.sets_data` — manter por enquanto, ignorar nas novas queries

---

## Decisões técnicas

**Batch save vs save-on-complete-set:** Escolhemos batch no `finishWorkout`. Razão: salvar após cada série gera muitos round-trips e bloqueios se a conexão cair. O estado local aguenta toda a sessão; se o app crashar, a sessão incompleta é descartada (sem `completed_at`). O aluno pode retomar ao abrir o mesmo treino (busca sessão sem `completed_at`).

**sets_data jsonb mantido:** Remoção quebra compatibilidade se houver sessões legadas. Deprecado — nova code path usa `workout_session_sets`. Remove em migration futura após confirmar que não há dados em produção.

**exercise_id denormalizado em workout_session_exercises:** `workout_exercise_id` é FK para a prescrição (pode ser null se o exercício foi trocado), `exercise_id` é o exercício real executado. Ambos ficam no row para permitir comparação "prescrito vs executado" em analytics.

---

## Checklist de done

- [ ] Migration 0007 criada e aplicada (alter + nova tabela + RLS)
- [ ] `workout-execute/[id].tsx` reescrito: lê `workout_exercises`, state local por série, batch save
- [ ] UI por série: campo peso/reps editável inline, botão ✓ por série, troca de exercício
- [ ] `WorkoutAnalyticsService.ts` alinhado ao novo schema
- [ ] `exercise-detail` screen alinhada (se usar tabelas antigas)
- [ ] Typecheck e lint limpos
- [ ] PR mergeado em `development`
- [ ] `docs/features/workout-execution-tracking.md` criado
- [ ] `docs/STATUS.md` atualizado
