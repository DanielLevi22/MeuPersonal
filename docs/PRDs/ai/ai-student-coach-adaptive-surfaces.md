# PRD: AI Student Coach — Superfícies Adaptativas (Fase 5)
# Discoverability, Card de Ganho/Perda e ProgressionCard

**Status:** approved
**Parte de:** [ai-student-personalized-coach.md](ai-student-personalized-coach.md)
**Branch:** feature/ai-student-coach-adaptive-surfaces
**Depende de:** [Fase 1 — Core](ai-student-coach-core.md) (plano ativo necessário)
**Paralelo com:** [Fase 3 — Explicabilidade](ai-student-coach-explanation-engine.md)

---

## O que esta fase entrega

1. **Botões contextuais na tela de treino**: adaptação de treino sem abrir o chat
2. **Card de Ganho/Perda**: comparação transparente (treino adaptado vs. original vs. não treinar)
3. **ProgressionCard**: projeção matemática de progresso com recalibração após check-ins
4. **Notificações proativas**: coach age antes que o aluno precise perguntar
5. **Tela pós-treino-pulado**: impacto na projeção + opções de compensação
6. **Checkpoints conversacionais**: revisão na semana 2, mês 1 e mês 3
7. **Diagnóstico de plateau**: quando o aluno não vê resultado
8. **Memória de rejeição**: coach aprende o que o aluno consistentemente recusa

---

## O problema: features de IA invisíveis

Uma IA que só responde quando o usuário sabe que pode perguntar é subutilizada. O aluno que viaja não vai abrir o chat de IA e pedir um treino adaptado — vai ver o treino normal, achar difícil de fazer no hotel, e não treinar.

**Regra central:** toda capacidade de IA deve aparecer como botão contextual, no momento certo, na tela onde o usuário já está. O chat é o último recurso — não o primeiro.

---

## Superfície 1 — Tela de Treino do Dia

A tela de treino é onde o aluno vai todo dia. É o lugar mais valioso do app para expor capabilities de IA.

```
┌─────────────────────────────────────────────────────────┐
│  Treino de Hoje — Peito e Tríceps                       │
│  60 min · 8 exercícios                                  │
│                                                         │
│  [▶ Iniciar treino]                                     │
│                                                         │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │
│  Não consegue fazer o treino completo hoje?             │
│                                                         │
│  [⏱ Tenho menos tempo]   [✈ Estou viajando]            │
│  [🏠 Vou treinar em casa] [🤕 Estou com dor]           │
└─────────────────────────────────────────────────────────┘
```

Cada botão é um gatilho contextual que envia o cenário para o coach de IA e retorna um treino adaptado + Card de Ganho/Perda.

**Esses botões são sempre visíveis** — não dependem do usuário saber que a feature existe.

### Fluxo técnico

```
Aluno toca [✈ Estou viajando]
  → POST /api/ai/student/adapt-workout
    Body: { workoutId, reason: 'traveling', context?: string }
    → StudentCoachOrchestrator recebe o contexto
    → Gera treino adaptado (Haiku 4.5 — tarefa estruturada)
    → Gera GainLossCard comparando os dois planos
    → Retorna: { adaptedWorkout, gainLossCard }
  → Cliente renderiza GainLossCard antes do treino adaptado
```

---

## Card de Ganho/Perda

O coração desta feature. Exibido **antes** do treino adaptado para que o aluno veja exatamente o trade-off.

```
┌─────────────────────────────────────────────────────────┐
│  Treino adaptado para hoje                              │
│  "Academia de hotel — 35 min"                           │
│                                                         │
│  comparado ao plano original (60 min):                  │
│                                                         │
│  O que você mantém                                      │
│  ✅  Trabalha peito e tríceps (grupos do dia)            │
│  ✅  Mantém sua sequência de 3 semanas sem interrupção   │
│  ✅  ~70% do volume de hipertrofia do dia               │
│                                                         │
│  O que você perde                                       │
│  ⚠️  Volume 35% menor que o plano original              │
│  ❌  Supino com barra substituído por flexão             │
│                                                         │
│  vs. não treinar nada hoje                              │
│  ❌  Sequência de 3 semanas interrompida                 │
│  ❌  Projeção de progresso atrasa ~4 dias               │
│  ❌  Próximo treino começa com carga reduzida            │
│                                                         │
│  [▶ Fazer este treino]  [🔄 Ver outra opção]  [Pular]  │
└─────────────────────────────────────────────────────────┘
```

**Por que este card funciona:**
- Transparente — o aluno confia porque vê os trade-offs
- Motivacional — ver o custo de "não treinar nada" incentiva ação
- Não punitivo — "Pular" está sempre disponível como opção digna
- Conectado ao ProgressionCard — "atrasa 4 dias" tem significado porque o aluno já conhece sua projeção

### TypeScript interface

```typescript
interface GainLossCard {
  adapted_workout_label: string;     // "Academia de hotel — 35 min"
  compared_to_original_min: number;  // duração original em minutos
  gains: string[];                   // bullets de "O que você mantém"
  losses: string[];                  // bullets de "O que você perde"
  vs_skipping: string[];             // bullets de "vs. não treinar nada"
  projection_delay_days?: number;    // dias de atraso na projeção se pular
}
```

---

## ProgressionCard — Estimativa de Progresso

### Conceito

Após a criação do plano, o aluno vê imediatamente uma projeção personalizada:

```
┌─────────────────────────────────────────────────────────┐
│  📈 Sua projeção com este plano                         │
│                                                         │
│  Período     Peso estimado        O que muda            │
│  ─────────   ──────────────────   ──────────────────    │
│  2 semanas   -1,5 a -2,5 kg      Principalmente água   │
│  1 mês       -3 a -4 kg          Gordura + água         │
│  2 meses     -5,5 a -7,5 kg      Gordura corporal       │
│  3 meses     -8 a -11 kg         Gordura + tônus        │
│                                                         │
│  Baseado em: 1.800 kcal/dia · déficit de 500 kcal       │
│  Assumindo 80% de aderência ao plano alimentar          │
│                                                         │
│  ⚠️ Projeção recalibrada após cada check-in             │
│  [Ver como funciona o cálculo]                          │
└─────────────────────────────────────────────────────────┘
```

### Modelo de cálculo (determinístico — sem LLM)

Função matemática pura — garante consistência, auditabilidade e custo zero por cálculo.

**Entradas:**

```typescript
interface ProgressionInput {
  weight_kg: number;
  height_cm: number;
  sex: 'male' | 'female';
  age?: number;                 // assume 30 se ausente
  goal: 'fat_loss' | 'muscle_gain' | 'body_recomp';
  training_days_per_week: number;
  experience: 'beginner' | 'intermediate' | 'advanced';
  calorie_target: number;       // calculado pelo orquestrador de nutrição
}
```

**TDEE — Harris-Benedict revisada:**

```
Homem: BMR = (10 × peso) + (6.25 × altura) - (5 × idade) + 5
Mulher: BMR = (10 × peso) + (6.25 × altura) - (5 × idade) - 161

Fator de atividade:
  2-3 dias/semana → BMR × 1.375
  4-5 dias/semana → BMR × 1.55
  6+ dias/semana  → BMR × 1.725

TDEE = BMR × fator de atividade
```

**Projeção semana a semana:**

```typescript
// Perda de peso
const deficit_kcal_dia = tdee - calorie_target;

// Semanas 1-2: glicogênio + água (cada 1g glicogênio retém ~3g água)
const water_loss_kg = clamp(deficit_kcal_dia * 14 / 3500 * 0.4, 0.5, 2.5);

// Semanas 3+: gordura predominante
const fat_loss_per_week_kg = (deficit_kcal_dia * 7) / 7700; // 7700 kcal = 1kg gordura

// Teto fisiológico: máx 1% do peso corporal por semana
const max_weekly_loss = weight_kg * 0.01;
const capped_loss = Math.min(fat_loss_per_week_kg, max_weekly_loss);

// Fator de aderência conservador e honesto
const adherence_factor = 0.80; // 80%
const adjusted_loss = capped_loss * adherence_factor;

// Para ganho de massa:
// Iniciante:     +0.8–1.2 kg/mês
// Intermediário: +0.4–0.6 kg/mês
// Avançado:      +0.1–0.3 kg/mês
```

**Output — três cenários:**

```typescript
interface ProgressionProjection {
  calorie_target: number;
  tdee_estimated: number;
  deficit_or_surplus: number;
  weeks: Array<{
    week: number;
    pessimistic_kg: number;  // 60% de aderência
    realistic_kg: number;    // 80% de aderência
    optimistic_kg: number;   // 95% de aderência
    note?: string;           // "principalmente água" nas semanas 1-2
  }>;
  milestones: Array<{
    label: string;           // "Perde 5 kg"
    weeks_pessimistic: number;
    weeks_realistic: number;
  }>;
  assumptions: string[];     // exibidas ao aluno para transparência
}
```

### Recalibração pós check-in

```typescript
const delta_real = peso_atual - peso_checkin_anterior;
const delta_projetado = projecao_para_periodo;
const desvio = (delta_real - delta_projetado) / delta_projetado;

if (Math.abs(desvio) > 0.20) {
  // Recalibra aderência estimada e TDEE implícito
  // Exibe: "Projeção atualizada com base no seu progresso real"
  // NÃO altera o plano automaticamente — apenas a projeção
  // Se desvio negativo > 30%: sugere revisão de dieta
}
```

**UI da recalibração:**

```
┌───────────────────────────────────────────────────────┐
│  📊 Projeção atualizada após check-in de 15/05        │
│                                                       │
│  Progresso real:    -2,1 kg em 3 semanas              │
│  Projeção anterior: -2,4 kg em 3 semanas              │
│                                                       │
│  Novo ritmo projetado: -6,5 a -9 kg nos próximos      │
│  3 meses (antes: -7 a -10 kg)                         │
│                                                       │
│  💬 "Seu ritmo está ligeiramente abaixo do projetado. │
│  Está conseguindo manter a dieta nos fins de semana?" │
└───────────────────────────────────────────────────────┘
```

### O que a IA NÃO diz (critérios de honestidade)

- **Não projeta** além de 6 meses
- **Não usa números exatos** — sempre intervalo (pessimista/realista/otimista)
- **Sempre exibe** disclaimer de aderência e variação individual
- **Não promete** resultado estético (aparência, celulite)
- **Nunca usa** "garantido", "certeza", "vai acontecer"

### Tabela — plan_projections

```sql
CREATE TABLE plan_projections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id           uuid NOT NULL,
  input_snapshot    jsonb NOT NULL,   -- ProgressionInput no momento do cálculo
  projection        jsonb NOT NULL,   -- ProgressionProjection completa
  calibration_count int DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
```

---

## Superfície 2 — Notificações Proativas

O coach monitora padrões e age antes que o aluno pergunte.

| Gatilho | Notificação |
|---|---|
| Treino do dia não iniciado após horário habitual | "Já são 20h e você ainda não treinou. Quer uma sessão rápida de 30 min?" |
| Usuário abriu o app mas não iniciou o treino | Banner na tela: "Hoje é dia de [grupo]. Tenho menos tempo? [Adaptar]" |
| Dois treinos seguidos pulados | "Você pulou 2 treinos. Quer um plano de recuperação para essa semana?" |
| Sequência de 7 dias sem treino | "Sua sequência foi interrompida. Aqui está como retomar no seu ritmo." |
| Viagem detectada (GPS opt-in) | "Parece que você está fora da sua cidade. Quer um treino para hotel?" |

**Regra de moderação:** máximo 1 notificação proativa por dia. Se o usuário ignorar 3 seguidas → pausar por 7 dias.

---

## Superfície 3 — Tela Pós-Treino Pulado

Quando o aluno marca treino como "pulado" ou o dia passa sem registro:

```
┌─────────────────────────────────────────────────────────┐
│  Treino de terça não realizado                          │
│                                                         │
│  Tudo bem. O que quer fazer?                            │
│                                                         │
│  [Compensar amanhã com treino combinado]                │
│  [Continuar o plano normalmente na próxima sessão]      │
│  [Ver impacto na minha projeção]                        │
│                                                         │
│  Projeção atualizada: seu objetivo de -7 kg             │
│  em 2 meses agora leva +3 dias a mais.                  │
│  (Recuperável com 2 treinos completos na próxima semana)│
└─────────────────────────────────────────────────────────┘
```

Linguagem sempre **neutra** — foco em "o que fazer agora", nunca em culpabilizar.

---

## Superfície 4 — Checkpoints Conversacionais Planejados

Mensagens iniciadas pelo sistema em marcos predefinidos:

```
Semana 2 — Check-in de aderência
  Coach: "Como estão indo os treinos? Está conseguindo completar as sessões?"
  → Se sim: reforço positivo + pequeno ajuste de carga se possível
  → Se não: diagnóstico do que está difícil → ajusta plano

Mês 1 — Revisão completa
  Coach: "Já faz 1 mês! Vamos comparar o que foi planejado com o que aconteceu."
  → Mostra aderência real (%), diferença peso esperado vs. real
  → Recalibra projeção com dados reais
  → Propõe ajustes ao plano (com aprovação)

Mês 3 — Evolução de nível
  Coach: "Seu plano atual está ficando fácil — isso é progresso! Hora de subir o nível."
  → Propõe plano 2.0 baseado em 90 dias de dados reais
  → Opção: manter o atual por mais 30 dias
```

Aparecem como notificações que abrem o chat com contexto já carregado.

---

## Superfície 5 — Diagnóstico de Plateau

O aluno que não vê resultado é o que mais cancela. Quando detectado:

**Gatilhos:**
- Projeção vs. resultado real difere > 25% por 2 check-ins seguidos
- Mensagem com palavras-chave: "não estou vendo", "não mudou nada", "resultado", "desanimado"
- Aluno acessa o ProgressionCard 3× em menos de uma semana (sinal de ansiedade)

**O diagnóstico:**

```
┌─────────────────────────────────────────────────────────┐
│  Diagnóstico de progresso — últimos 30 dias             │
│                                                         │
│  Treinos realizados      11 de 16 planejados  (69%)     │
│  Aderência alimentar     4 de 5 dias bons/sem (80%)     │
│  Média de sono           6,2h (abaixo dos 7h ideais)    │
│  Check-ins realizados    1 de 2 planejados              │
│                                                         │
│  Principal causa identificada:                          │
│  ⚠️  Aderência alimentar cai nos fins de semana —       │
│      3 das 4 semanas saiu >40% do alvo calórico         │
│      nos sábados e domingos.                            │
│                                                         │
│  Isso representa ~200 kcal extras/dia em média,         │
│  compensando quase todo o déficit semanal.              │
│                                                         │
│  Sugestão: estratégia de "flexibilidade planejada"      │
│  para fins de semana. Quer ver como funciona?           │
└─────────────────────────────────────────────────────────┘
```

Causa raiz específica — não conselho genérico. O aluno sai sabendo o que mudar.

---

## Superfície 6 — Memória de Rejeição

O coach aprende o que o aluno consistentemente recusa:

```typescript
// Lógica de detecção (salvo em profiles.ai_preferences jsonb)
if (rejectionCount(exerciseCategory) >= 3) {
  removeFromSuggestionPool(exerciseCategory);
  logPreference({ type: 'never_suggest', category: exerciseCategory });
}

if (rejectionCount(nutritionType) >= 2) {
  updateMealPreferences({ avoid: nutritionType });
}
```

Após acúmulo de preferências, o coach comunica:

```
"Percebi que você sempre pula exercícios de cardio e prefere treino
 100% de musculação. Atualizei seu perfil — não vou mais sugerir
 cardio a menos que você peça."
```

Constrói confiança: o aluno percebe que a IA aprende com ele, não segue um script fixo.

**Onde salvar:** adicionar coluna `ai_preferences jsonb DEFAULT '{}'` à tabela `profiles`.

---

## Arquitetura Técnica — Superfícies

### Endpoints novos

```
POST /api/ai/student/adapt-workout
  Body: { workoutId, reason: 'less_time' | 'traveling' | 'home' | 'pain', context?: string }
  → Gera treino adaptado + GainLossCard
  Modelo: Claude Haiku 4.5

GET /api/ai/student/progression/:studentId
  → Retorna ProgressionProjection atual do aluno (calculado deterministicamente)
  → Recalcula se check-in desde último cálculo

POST /api/ai/student/projection/recalibrate
  Body: { checkInWeight: number }
  → Recalcula projeção com peso real do check-in

POST /api/ai/student/plateau-diagnostic
  Body: { studentId }
  → Agrega dados de aderência, sleep, check-ins
  → Retorna PlateauDiagnostic com causa raiz
  Modelo: Claude Sonnet 4.6
```

### Tabelas desta fase

```sql
-- Projeções de progresso
CREATE TABLE plan_projections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id           uuid NOT NULL,
  input_snapshot    jsonb NOT NULL,
  projection        jsonb NOT NULL,
  calibration_count int DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Adicionar ao profiles existente:
ALTER TABLE profiles
  ADD COLUMN ai_preferences jsonb DEFAULT '{}';
  -- Estrutura: { never_suggest: string[], avoid_foods: string[], ... }
```

---

## Checklist de done — Superfícies Adaptativas

- [ ] Botões contextuais na tela de treino (menos tempo / viagem / casa / dor)
- [ ] `POST /api/ai/student/adapt-workout` implementado
- [ ] `GainLossCard` component implementado (mantém / perde / vs. não treinar)
- [ ] `ProgressionCard` component com tabela pessimista/realista/otimista
- [ ] Função `calculateProgression()` determinística, testada com casos de borda
- [ ] `plan_projections` tabela criada
- [ ] Recalibração pós check-in implementada
- [ ] UI de recalibração exibida após check-in com pesagem real
- [ ] Notificações proativas — lógica de gatilhos e moderação (máx 1/dia, pausa após 3 ignoradas)
- [ ] Tela pós-treino-pulado com opções de compensação
- [ ] Checkpoints semanais/mensais — job agendado que detecta marcos e inicia conversa
- [ ] Diagnóstico de plateau — gatilhos de detecção e card de análise
- [ ] Memória de rejeição — `profiles.ai_preferences` + lógica de acúmulo
- [ ] Lint + typecheck limpos
