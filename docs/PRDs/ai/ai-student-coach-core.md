# PRD: AI Student Coach — Core (Fase 1)
# Anamnese Adaptativa, Gate de Perfil e Modo Expresso

**Status:** approved
**Parte de:** [ai-student-personalized-coach.md](ai-student-personalized-coach.md)
**Branch:** feature/ai-student-coach-core
**Depende de:** nenhuma (fase fundação)
**Precedido por:** nenhuma
**Seguido por:** [Fase 2 — Análise Visual](ai-student-coach-visual-analysis.md)

---

## O que esta fase entrega

A infraestrutura base do AI Student Coach:
1. Anamnese adaptativa por persona (4 tracks, 16–32 perguntas)
2. UX de anamnese como "Jornada de Evolução" (medidor de precisão, unlocks, abandono salvo)
3. Profile Completeness Gate (score mínimo para ativar o coach)
4. Persona Pragmático: plano completo modo Expresso com zero perguntas se anamnese preenchida
5. `StudentCoachOrchestrator` — base extensível para as fases seguintes

---

## Anamnese Adaptativa por Persona

### Por que não fazer uma anamnese única para todos

Um iniciante que nunca pisou numa academia não sabe o que é 1RM. Um atleta com 5 anos de treino acha superficial responder "quantos dias você treina". Perguntas erradas geram dois problemas:
- **Abandono**: o iniciante vê um formulário de 12 seções e fecha o app
- **Imprecisão**: o avançado responde campos rasos que não capturam o que a IA precisa

### Detecção de persona — primeira pergunta

```
"Como você se descreveria em relação ao treino?"

  🌱 Estou começando agora          → Track Iniciante    (16 perguntas)
  🔄 Já treinei, mas parei          → Track Retomada     (21 perguntas)
  💪 Treino regularmente            → Track Intermediário (26 perguntas)
  🏆 Treino há anos / sou atleta    → Track Avançado     (32 perguntas)
```

Não é "nível técnico" — é linguagem que qualquer usuário entende na primeira leitura.

---

### Track Iniciante — 16 perguntas

**Foco:** o mínimo que a IA precisa para não errar. Zero jargão técnico.

| # | Campo exibido | Pergunta ao usuário | Campo na anamnese |
|---|---|---|---|
| 1 | goal | "Qual é o seu objetivo principal?" | `main_goal` |
| 2 | gender | "Qual é o seu sexo biológico?" | `gender` |
| 3 | weight | "Qual é o seu peso atual?" | `physical_assessments.weight_kg` |
| 4 | height | "Qual é a sua altura?" | `physical_assessments.height_cm` |
| 5 | training_days | "Quantos dias por semana você pode treinar?" | `training_days` |
| 6 | training_duration | "Quanto tempo você tem por treino?" | `training_duration` |
| 7 | gym_type | "Onde você vai treinar?" | `gym_type` |
| 8 | dietary_restrictions | "Você tem alguma restrição alimentar?" | `dietary_restrictions` |
| 9 | injuries | "Tem alguma dor ou lesão que devo saber?" | `injuries`, `current_pain` |
| 10 | medical_conditions | "Tem alguma condição médica (pressão, diabetes...)?" | `medical_conditions` |
| 11 | sleep_hours | "Em média, quantas horas você dorme por noite?" | `sleep_hours` |
| 12 | stress_level | "Como está seu nível de estresse no dia a dia?" | `stress_level` |
| 13 | diet_quality | "Como você avalia sua alimentação hoje?" | `diet_quality` |
| 14 | food_preferences | "Tem algum alimento que ama ou detesta?" | `food_preferences` *(novo)* |
| 15 | session_time_preference | "Você prefere treinar de manhã, tarde ou noite?" | `session_time_preference` *(novo)* |
| 16 | commitment | "Em uma escala, qual seu nível de comprometimento?" | `commitment` |

**Campos ocultados para iniciantes** (não fazem sentido ainda):
`squat_rm`, `bench_rm`, `deadlift_rm`, `squat_level`, `bench_press_level`, `deadlift_level`, `modalities`, `periodization_history`, `supplements`, `nutritionist`

---

### Track Retomada — 21 perguntas

**Foco:** entender o que funcionou antes, por que parou e evitar repetir erros.
Inclui todas as 16 do Track Iniciante, mais:

| # | Campo | Pergunta | Campo na anamnese |
|---|---|---|---|
| 17 | training_time | "Quanto tempo você treinou antes de parar?" | `training_time` |
| 18 | modalities | "Quais modalidades você praticava?" | `modalities` |
| 19 | had_professional_help | "Você teve acompanhamento de personal antes?" | `had_professional_help` |
| 20 | negative_experiences | "O que não funcionou no seu treino anterior?" | `negative_experiences` |
| 21 | biggest_difficulty | "Qual foi a maior dificuldade que te fez parar?" | `biggest_difficulty` |

**Opcional (incentivado, não obrigatório):**
`squat_rm`, `bench_rm` — "Se lembrar, quais eram suas cargas aproximadas?"

---

### Track Intermediário — 26 perguntas

**Foco:** qualidade atual do treino, pontos fracos específicos e inputs para periodização.
Inclui todas as 21 do Track Retomada, mais:

| # | Campo | Pergunta | Campo na anamnese |
|---|---|---|---|
| 22 | experience_level | "Como você avalia sua técnica nos movimentos básicos?" | `squat_level`, `bench_press_level`, `deadlift_level` |
| 23 | current_loads | "Quais são suas cargas atuais aproximadas?" | `squat_rm`, `bench_rm`, `deadlift_rm` |
| 24 | biggest_motivator | "O que mais te motiva a treinar?" | `biggest_motivator` |
| 25 | supplements | "Usa algum suplemento atualmente?" | `supplements` |
| 26 | nutritionist | "Você tem acompanhamento com nutricionista?" | `nutritionist` |

---

### Track Avançado — 32 perguntas

**Foco:** contexto completo para personalização profunda, metodologia, competição e recovery.
Inclui todas as 26 do Track Intermediário, mais:

| # | Campo | Pergunta | Campo na anamnese |
|---|---|---|---|
| 27 | intend_to_compete | "Você tem objetivos competitivos?" | `intend_to_compete` |
| 28 | goal_deadline | "Tem algum prazo ou evento em mente?" | `goal_deadline` |
| 29 | trained_sport_specific | "Pratica ou praticou algum esporte específico?" | `trained_sport_specific` |
| 30 | physical_job | "Seu trabalho exige esforço físico?" | `physical_job` |
| 31 | previous_plan_adherence | "Como era sua aderência aos planos anteriores?" | `previous_plan_adherence` *(novo)* |
| 32 | expectations_text | "O que você espera de um coach de IA que um plano genérico não entrega?" | `expectations_text` |

**Campos desbloqueados e incentivados:**
`mobility_limitations`, `postural_assessment`, `water_intake`, `alcohol`, `family_history`

---

### Regra de upgrade entre tracks

- Aluno pode ser promovido ao track seguinte se responder "sim" a perguntas-chave de experiência ou solicitar explicitamente "quero responder mais perguntas"
- Nunca rebaixado — só promovido (evita frustração)

---

## UX da Anamnese — "A Jornada da Evolução"

### O Medidor de Precisão

Elemento visual central: medidor sempre visível que avança a cada resposta.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│    Precisão do seu plano                                │
│                                                         │
│    ████████████████░░░░░░░░░░  64%                      │
│                                                         │
│    Um plano genérico tem 30% de precisão.               │
│    Com mais respostas, chegamos a 94%.                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Pesos por campo:**
- Alto impacto (objetivo, peso, dias de treino): +8 a +10%
- Médio impacto (restrições, lesões): +4 a +6%
- Baixo impacto (preferências, observações): +1 a +3%

Cada resposta exibe micro-animação **"+ 8% de precisão"** — responde implicitamente "por que você está me perguntando isso?".

---

### Card por pergunta

Cada pergunta é uma tela cheia — não uma lista de campos.

```
┌─────────────────────────────────────────────────────────┐
│  ← Voltar                              Passo 4 de 16    │
│  ████████████░░░░░░░░░░░░░░░░░░░░                       │
│                                                         │
│         Quantos dias por semana                         │
│         você pode treinar?                              │
│                                                         │
│    Por que perguntamos: o volume total do seu           │
│    treino depende diretamente da sua frequência.        │
│    [recolher ▲]                                         │
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│   │  2 dias  │  │  3 dias  │  │  4 dias  │             │
│   └──────────┘  └──────────┘  └──────────┘             │
│                 ┌──────────┐                            │
│                 │  5+ dias │                            │
│                 └──────────┘                            │
│                                                         │
│                                                   +8%   │
│                                     Precisão: 46%       │
└─────────────────────────────────────────────────────────┘
```

**Elementos fixos:**
- Progress bar no topo (passo N de total)
- "Por que perguntamos:" recolhível (expande com toque)
- Opções como cards clicáveis, não dropdown
- Badge "+X%" no canto inferior direito
- Medidor acumulado no rodapé

---

### Seções com unlock visual

Ao completar cada bloco de perguntas:

```
✓ Bloco "Como você treina" completo

Você desbloqueou:
  💪  Estrutura de treino personalizada
      "Seu plano terá split de 4 dias com
       foco em hipertrofia progressiva"

[Continuar →]
```

| Bloco concluído | Unlock comunicado |
|---|---|
| Dados básicos (goal + bio) | "Calculamos seu TDEE: 2.680 kcal/dia" |
| Disponibilidade (dias + tempo) | "Seu plano terá X dias de treino com Y exercícios/sessão" |
| Local + equipamentos | "Selecionamos exercícios disponíveis para [local]" |
| Saúde e lesões | "Adaptamos o plano para proteger [lesão mencionada]" |
| Alimentação | "Seu plano calórico está calibrado: alvo de 2.180 kcal/dia" |
| Cargas e movimentos *(avançados)* | "Periodização baseada no seu nível real de força" |

---

### Comportamento de abandono

- Progresso salvo automaticamente
- Notificação no dia seguinte: "Seu plano está X% pronto. Faltam Y perguntas."
- Deep link direto para retomar de onde parou (não recomeça)
- Badge no ícone do perfil indicando anamnese incompleta

---

### Diferença visual entre tracks

| Track | Tom | Ritmo | Linguagem |
|---|---|---|---|
| Iniciante | Acolhedor, verde/suave | Lento, mais contexto | "Vamos começar do básico" |
| Retomada | Motivacional, laranja | Médio | "Bem-vindo de volta" |
| Intermediário | Técnico-moderno, azul | Rápido | "Você já sabe o que está fazendo" |
| Avançado | Premium, escuro/gold | Muito rápido, opções densas | "Vamos a fundo" |

---

## Arquitetura de Contexto — "A IA não pergunta o que já sabe"

### Por que anamnese como fonte, não o chat

| Abordagem | Custo/sessão | Qualidade | Reutilização |
|---|---|---|---|
| IA pergunta no chat | ~R$0,004 | Ambíguo (texto livre) | Nunca — repete toda sessão |
| Anamnese pré-carregada | ~R$0,0006 | Estruturado (campos tipados) | Sempre — lida de banco |

Redução de ~83% do custo de contexto por sessão reutilizando dados já coletados.

### Mapeamento anamnese → contexto do coach

Todos os campos críticos já existem. Nenhuma tabela nova — apenas garantir preenchimento intencional antes do onboarding de IA.

| Input do AI Coach | Origem | Campo |
|---|---|---|
| Objetivo principal | `student_anamnesis.responses` | `main_goal` |
| Sexo biológico | `student_anamnesis.responses` | `gender` |
| Peso / Altura | `physical_assessments` | `weight_kg`, `height_cm` |
| % Gordura estimado | `physical_assessments` | `body_fat_pct` |
| Experiência de treino | `student_anamnesis.responses` | `experience_level`, `training_time` |
| Dias disponíveis | `student_anamnesis.responses` | `training_days` |
| Tempo por sessão | `student_anamnesis.responses` | `training_duration` |
| Onde treina | `student_anamnesis.responses` | `gym_type`, `equipment` |
| Restrições alimentares | `student_anamnesis.responses` | `dietary_restrictions` |
| Lesões | `student_anamnesis.responses` | `injuries`, `current_pain`, `surgeries` |
| Sono / estresse | `student_anamnesis.responses` | `sleep_hours`, `stress_level` |
| 1RMs | `student_anamnesis.responses` | `squat_rm`, `bench_rm`, `deadlift_rm` |
| Suplementação | `student_anamnesis.responses` | `supplements` |

### Novos campos a adicionar ao formulário de anamnese

Apenas 4 campos novos no JSON de `responses` (sem migração de tabela):

```typescript
// Adicionar ao formulário de anamnese (tracks relevantes)
session_time_preference: 'morning' | 'afternoon' | 'evening'
// Afeta nutrição peri-treino (carboidratos antes/depois)

food_preferences: string[]
// Ex: ["prefere frango", "não gosta de ovos"]
// Preferência (gosto) — diferente de restrição (alergia)

previous_plan_adherence: 'never_had_plan' | 'low' | 'medium' | 'high'
// Calibra expectativas e complexidade do plano

coach_mode_preference: 'express' | 'analytical'
// Pré-seleciona o modo padrão do aluno
```

---

## Profile Completeness Gate

```typescript
const AI_REQUIRED_FIELDS = [
  'main_goal', 'gender', 'training_days', 'training_duration',
  'gym_type', 'experience_level',
  // physical_assessment — ao menos um registro:
  'weight_kg', 'height_cm',
];

const AI_OPTIONAL_FIELDS = [
  'dietary_restrictions', 'injuries', 'sleep_hours',
  'stress_level', 'equipment', 'food_preferences',
];

function getAiReadinessScore(anamnese: AnamneseResponses, assessment: PhysicalAssessment | null): number {
  const required = AI_REQUIRED_FIELDS.filter(f => isFieldFilled(f, anamnese, assessment)).length;
  const optional = AI_OPTIONAL_FIELDS.filter(f => isFieldFilled(f, anamnese, assessment)).length;
  return required === AI_REQUIRED_FIELDS.length
    ? 100 * (0.7 + 0.3 * (optional / AI_OPTIONAL_FIELDS.length))
    : (required / AI_REQUIRED_FIELDS.length) * 70;
}
```

**UX do gate:**

```
Score < 60%  → Tela bloqueante:
  "Complete seu perfil para ativar o coach"
  [Progress bar: 4 de 8 campos essenciais preenchidos]
  [Ir para anamnese →]

Score 60-79% → Banner de aviso (não bloqueia):
  "Seu plano ficará mais preciso com mais informações"
  [Completar perfil]  [Continuar assim mesmo]

Score ≥ 80%  → Coach inicia diretamente com tela de confirmação
```

---

## Persona Pragmático — Modo Expresso

### Jornada com anamnese preenchida (score ≥ 80%)

```
1. Abre "Criar meu plano com IA"
2. IA carrega anamnese + último physical assessment
3. Exibe tela de confirmação — 1 toque para aprovar:

   ┌─────────────────────────────────────────────────────┐
   │  Encontrei seu perfil. Confirma antes de começar?   │
   │                                                     │
   │  Objetivo       Perder gordura                      │
   │  Peso / Altura  78 kg · 175 cm                      │
   │  Experiência    Treina há 2 anos                    │
   │  Frequência     4 dias/semana · 60 min              │
   │  Local          Academia completa                   │
   │  Dieta          Sem restrições                      │
   │  Lesões         Nenhuma                             │
   │                                                     │
   │  [✓ Tudo certo — criar meu plano]                   │
   │  [✎ Atualizar algo antes]                           │
   └─────────────────────────────────────────────────────┘

4. Aluno confirma → IA gera plano em ~30s (sem mais perguntas)
5. Visualiza:
   - Cards de treino (dias da semana + exercícios resumidos)
   - Cards de dieta (calorias + distribuição de macros)
   - ProgressionCard: "Em 2 meses: -5 a -7 kg estimados"
6. Toca "Ativar plano" — salvo
7. Tempo total: < 2 minutos
```

### Jornada de fallback (score < 60%)

```
1. Abre "Criar meu plano com IA"
2. Tela bloqueante: "Complete seu perfil para começar"
   → Link para anamnese com apenas os 8 campos essenciais pré-selecionados
3. Aluno preenche os campos essenciais (formulário, não chat)
4. Volta ao coach → fluxo normal de confirmação
```

**UX principles do modo expresso:**
- Tela de confirmação: leitura de 5 segundos, 1 toque para prosseguir
- "Atualizar algo" abre modal inline (não navega para anamnese completa)
- Loading com "Montando seu plano…" durante geração
- "Quero entender as escolhas" disponível mas não em destaque

---

## Arquitetura Técnica — Fase 1

### Endpoints novos

```
POST /api/ai/student/coach/start
  Body: { mode: 'express' | 'analytical' }
  → Cria ai_chat_sessions, retorna sessionId + primeira mensagem

POST /api/ai/student/coach/message  (SSE)
  Body: { sessionId, message }
  → Processa mensagem, retorna stream com texto + structured events
```

### StudentCoachOrchestrator — base

Ver [ADR-003](../../decisions/ADR-003-ai-architecture.md) para o design completo da camada de abstração.

```typescript
// web/src/modules/ai/orchestrators/student-coach.orchestrator.ts
export class StudentCoachOrchestrator extends BaseOrchestrator {
  constructor(
    provider: AIProvider,
    contextLoader: StudentContextLoader,
    private mode: 'express' | 'analytical',
    private track: PersonaTrack,
  ) {
    super(provider, contextLoader);
  }

  buildSystemPrompt(context: StudentOrchestratorContext): string {
    return [
      STUDENT_COACH_BASE_PROMPT,
      this.mode === 'express' ? EXPRESS_MODE_PROMPT : ANALYTICAL_MODE_PROMPT,
      formatStudentContext(context),
    ].join('\n\n');
  }

  getTools(): Tool[] {
    return studentCoachTools; // proposeWorkoutPlan + proposeNutritionPlan + savePlanWithApproval
  }
}
```

### SSE Events desta fase

```typescript
type CoachSseEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'plan_proposal'; payload: PlanProposalCard }
  | { type: 'approval_required'; adjustmentId: string }
  | { type: 'plan_saved'; module: 'workout' | 'nutrition'; id: string }
  | { type: 'error'; code: string; message: string }
```

### Campos DB desta fase

```sql
-- Adicionar coluna ao profiles existente:
ALTER TABLE profiles
  ADD COLUMN coach_mode text DEFAULT 'express'
    CHECK (coach_mode IN ('express', 'analytical'));

-- Adicionar coluna ao profiles existente:
ALTER TABLE profiles
  ADD COLUMN persona_track text DEFAULT 'beginner'
    CHECK (persona_track IN ('beginner', 'returning', 'intermediate', 'advanced'));
```

**Sem novas tabelas nesta fase.**

---

## Checklist de done — Fase 1

- [ ] `PersonaTrack` detectado na primeira pergunta da anamnese e salvo em `profiles.persona_track`
- [ ] Formulário de anamnese usa tracks adaptativos (16/21/26/32 perguntas)
- [ ] Medidor de precisão animado em cada pergunta da anamnese
- [ ] Unlocks visuais ao completar cada bloco
- [ ] Abandono da anamnese salva progresso e exibe notificação no dia seguinte
- [ ] `getAiReadinessScore()` implementado e testado
- [ ] Gate de perfil com três estados (bloqueante / aviso / livre)
- [ ] `StudentCoachOrchestrator` com `mode: 'express' | 'analytical'`
- [ ] Endpoint `/api/ai/student/coach/start` e `/message` (modo expresso)
- [ ] Tela de confirmação de dados (score ≥ 80%)
- [ ] `PlanProposalCard` com approve/reject
- [ ] Migração `profiles.coach_mode` e `profiles.persona_track` aplicada com RLS
- [ ] Lint + typecheck limpos
- [ ] `docs/features/ai-student-coach-core.md` criado após merge
