# PRD: Engagement Loop — Briefing, Habit Loop e Review Semanal

**Data de criação:** 2026-04-19
**Status:** draft
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Sistema de engajamento diário que mantém o aluno ativo na plataforma todos os dias — não só nos dias de treino. Composto por três mecanismos: briefing pré-treino gerado por IA, habit loop de check-in diário (sono, energia, hidratação) e review semanal automatizado com dados reais do aluno.

### Por quê?
Apps de fitness perdem 60–80% dos usuários nos primeiros 30 dias. O problema não é falta de feature — é ausência de motivo para abrir o app nos dias sem treino. O habit loop cria um ritual diário de 15 segundos. O briefing pré-treino elimina o "o que eu faço hoje?". O review semanal fecha o ciclo mostrando progresso real — o principal driver de retenção.

### Como saberemos que está pronto?
- [ ] Aluno recebe briefing ao abrir o treino do dia (gerado por IA em < 2s)
- [ ] Notificação diária às 7h (configurável) para o habit loop
- [ ] Habit loop completo em < 15 segundos (3 perguntas rápidas)
- [ ] Dados do habit loop aparecem como contexto no assistente e no briefing
- [ ] Review semanal gerado automaticamente todo domingo às 20h
- [ ] Review chega como notificação + salvo no histórico do assistente
- [ ] Especialista vê dados do habit loop do aluno no dashboard

---

## Contexto

O mobile já tem:
- Timers de exercícios durante o treino
- Análise de foto de alimentos (macros)
- Sessões de treino registradas

O que falta e este PRD resolve:
- Briefing antes de começar o treino
- Dados de contexto diários (sono, energia, hidratação)
- Fechamento semanal com progresso acumulado

---

## Feature 1 — Briefing pré-treino

### Quando dispara
Quando o aluno abre a tela do treino do dia (antes de iniciar a sessão).

### O que a IA lê
- Último treino do mesmo tipo: exercícios, cargas, séries, RPE registrado
- Nota de sono e energia do dia atual (habit loop)
- Semana atual da periodização e objetivo do ciclo
- PRs recentes (últimas 4 semanas)

### Output
3 frases geradas por Claude Haiku 4.5 em < 2 segundos (sem streaming):

> "Hoje é Treino A — Peito e Tríceps.
> Na semana passada você fez supino com 80kg × 8. Tente 82,5kg hoje.
> Sua energia está em 4/5 — dia bom para forçar carga."

ou, se sono ruim:

> "Hoje é Treino B — Costas.
> Remada estava em 70kg × 10 na semana passada. Mantenha a carga hoje.
> Você dormiu mal (2/5) — foca na execução, não na carga. Recuperação vem primeiro."

### Implementação
- Endpoint: `GET /api/ai/student/briefing?workoutId=X`
- Modelo: Claude Haiku 4.5
- Cache: 1h (se o aluno fechar e reabrir, não gera de novo)
- Fallback: se IA falhar, exibe resumo estático do treino anterior sem texto da IA

---

## Feature 2 — Habit Loop Diário

### Fluxo
```
Notificação às 7h (ou horário configurado pelo aluno)
  → Aluno toca a notificação
  → Tela de 15 segundos com 3 perguntas:

  Como você dormiu?
  ● ● ● ○ ○  (desliza para marcar)

  Energia hoje?
  ● ● ○ ○ ○

  Hidratação ontem?
  [Sim, bebi bem]  [Não muito]

  → Salvar (1 toque) → fechou
```

### Dados coletados

| Campo | Tipo | Range |
|---|---|---|
| `sleep_quality` | smallint | 1–5 |
| `energy_level` | smallint | 1–5 |
| `hydration_ok` | boolean | — |
| `log_date` | date | data do registro |

### Como os dados são usados

| Consumidor | Como usa |
|---|---|
| Briefing pré-treino | Ajusta tom e recomendação de carga |
| Assistente diário | Contexto de bem-estar ao responder perguntas |
| Review semanal | Média da semana, correlação com performance |
| Especialista (dashboard) | Padrões de sono/energia do aluno |
| IA de ajuste de plano | Sono ruim recorrente → sugerir redução de volume |

### Regras
- Se aluno não responder por 3 dias → notificação mais enfática: "Ei, como você está?"
- Não bloquear nada se não responder — é opcional mas incentivado
- Disponível em mobile e web

---

## Feature 3 — Review Semanal Automatizado

### Quando dispara
Cron job todo domingo às 20h (horário de Brasília).

### O que a IA lê
- Treinos completos vs planejados na semana
- Cargas e volumes registrados (comparado com semana anterior)
- PRs batidos na semana
- Aderência à dieta: % de refeições logadas vs plano
- Média de sono, energia e hidratação (habit loop)
- Peso corporal registrado (se aluno logou)
- Check-in mais recente (se houver)

### Output — card estruturado

```
📊 Sua Semana 4 — [nome do aluno]

TREINOS
✓ 3 de 4 treinos completos (75%)
🏆 1 PR novo: Agachamento 90kg (+5kg vs melhor anterior)

NUTRIÇÃO
📈 Média calórica: 2.340kcal (meta: 2.200 — +6%)
✓ 85% das refeições registradas

BEM-ESTAR
😴 Sono: 3,2/5 (abaixo da sua média de 3,8)
⚡ Energia: 3,8/5 (estável)

O QUE FUNCIONOU
Consistência nos treinos de superiores — 4/4 semanas seguidas.

O QUE MELHORAR
Sono abaixo da média há 2 semanas. Isso está afetando sua recuperação.

PRÓXIMA SEMANA
Volume mantido. Se o sono melhorar, tente aumentar carga no leg press.
```

### Entrega
- Notificação push no mobile
- Notificação web (bell icon)
- Salvo como mensagem do assistente (aluno pode perguntar sobre o review depois)
- Se aluno for gerenciado: especialista recebe resumo consolidado de todos os alunos

### Modelo
Claude Haiku 4.5 — tarefa estruturada, sem necessidade de raciocínio profundo.
Custo estimado: ~R$0,09/aluno/mês (4 reviews × ~R$0,022 cada).

---

## Tabelas do banco

| Tabela | Operação | Observação |
|---|---|---|
| `daily_habit_logs` | SELECT, INSERT | **NOVA** — registros diários de sono/energia/hidratação |
| `weekly_reviews` | SELECT, INSERT | **NOVA** — reviews gerados pela IA, por semana |
| `workout_sessions` | SELECT | Treinos realizados |
| `meal_logs` | SELECT | Aderência à dieta |
| `student_notifications` | INSERT | Notificação do review |

### Novas tabelas

```sql
CREATE TABLE daily_habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_quality smallint CHECK (sleep_quality BETWEEN 1 AND 5),
  energy_level smallint CHECK (energy_level BETWEEN 1 AND 5),
  hydration_ok boolean,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, log_date)
);

CREATE TABLE weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  summary_text text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}',  -- workouts_completed, avg_sleep, prs, etc.
  generated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, week_start)
);
```

---

## Fases de entrega

### Fase 1 — Habit Loop (3-4 dias)
- [ ] Tabela `daily_habit_logs` com RLS
- [ ] Tela de habit loop no mobile (notificação + formulário rápido)
- [ ] Tela de habit loop no web (widget no dashboard do aluno)
- [ ] Notificação diária configurável

### Fase 2 — Briefing pré-treino (2-3 dias)
- [ ] Endpoint `GET /api/ai/student/briefing`
- [ ] Integração com tela de início de treino no mobile
- [ ] Integração com página de treino no web
- [ ] Cache de 1h para não reprocessar

### Fase 3 — Review semanal (3-4 dias)
- [ ] Tabela `weekly_reviews` com RLS
- [ ] Cron job domingo às 20h
- [ ] Geração do review por Claude Haiku 4.5
- [ ] Entrega via notificação + assistente
- [ ] Resumo consolidado para o especialista

---

## Checklist de done
- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/engagement-loop.md` criado
- [ ] `docs/STATUS.md` atualizado
- [ ] RLS configurado para todas as novas tabelas
