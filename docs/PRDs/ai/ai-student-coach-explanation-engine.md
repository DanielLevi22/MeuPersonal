# PRD: AI Student Coach — Motor de Explicabilidade (Fase 3)
# Modo Analítico e Explanation Cards

**Status:** approved
**Parte de:** [ai-student-personalized-coach.md](ai-student-personalized-coach.md)
**Branch:** feature/ai-student-coach-explanation-engine
**Depende de:** [Fase 1 — Core](ai-student-coach-core.md)
**Opcional mas recomendado antes:** [Fase 2 — Análise Visual](ai-student-coach-visual-analysis.md)

---

## O que esta fase entrega

1. **Modo Analítico**: jornada de criação de plano para o aluno que quer entender cada decisão
2. **Motor de Explicabilidade**: estrutura interna de raciocínio (observação → diagnóstico → solução → mecanismo → alternativas) exposta ao aluno
3. **Explanation Cards**: componentes colapsáveis em cada item do plano com "Por que este?"
4. **Alternância de modo** em runtime: banner persistente + detecção automática de perguntas analíticas

---

## Persona Analítica — Jornada Completa

**Perfil:** experiente, questionador, quer entender a lógica de cada escolha para confiar e adaptar.

```
1. Abre "Criar meu plano com IA"
2. Seleciona modo Analítico (ou ativa via "Quero entender cada escolha")
3. IA conduz conversa estruturada:
   - Histórico detalhado (anos de treino, métodos já usados, o que funcionou/não)
   - Foto(s) corporal para análise de desequilíbrios e prioridades  
   - Objetivo específico ("aumentar peitoral superior sem agravar ombro direito")
4. IA gera plano COM camada de raciocínio explícito:
   - Para cada exercício: card com "Por que este? / Que problema resolve? / Alternativas"
   - Para cada macro: card com "Baseado em quê? / Ajuste possível?"
5. Aluno pode questionar qualquer item diretamente no chat:
   "Por que agachamento búlgaro e não leg press?"
   → IA responde com raciocínio referenciando o perfil do aluno
6. Aluno aprova, ajusta ou pede alternativa item por item
7. Plano salvo após confirmação
```

**UX principles:**
- Texto dominante (não múltipla escolha)
- Cards de explicação visíveis por padrão no modo analítico
- "Questionar esta escolha" em cada item do plano
- Histórico de raciocínio consultável a qualquer momento

---

## Motor de Explicabilidade

### Estrutura do raciocínio interno

Para cada recomendação de treino ou nutrição, a IA estrutura:

```
OBSERVAÇÃO: [dado do perfil/foto/histórico que motivou a escolha]
DIAGNÓSTICO: [problema ou oportunidade identificada]
SOLUÇÃO ESCOLHIDA: [o que foi recomendado]
MECANISMO: [como essa solução endereça o diagnóstico]
EVIDÊNCIA: [base científica ou prática — sem referências inventadas]
ALTERNATIVAS DESCARTADAS: [opções que existem mas não foram escolhidas e por quê]
EXPECTATIVA: [o que o aluno pode esperar em X semanas]
```

### Exemplo — Supino Inclinado 30°

**Contexto:** aluno com déficit de peitoral superior identificado nas fotos corporais.

```
OBSERVAÇÃO: Nas fotos enviadas, peitoral inferior (esternal) é mais
desenvolvido que o superior (clavicular). Ombro anterior em posição
protaída sugere dominância de push horizontal.

DIAGNÓSTICO: Desequilíbrio estético e funcional entre cabeças do
peitoral. Risco de síndrome do impacto se o déficit de ativação
da cabeça clavicular persistir.

SOLUÇÃO: Supino Inclinado 30° como exercício principal de empurre.

MECANISMO: O ângulo de 30° maximiza a ativação da cabeça clavicular
do peitoral maior (~25% mais EMG vs plano) enquanto reduz o
recrutamento de deltóide anterior em relação ao supino 45°.

EVIDÊNCIA: Angulação 30°–45° é consenso em literatura de EMG aplicada
para ênfase em peitoral superior.

ALTERNATIVAS DESCARTADAS:
• Supino plano: não prioriza a lacuna identificada
• Supino 45°: aumenta recrutamento de deltóide anterior — contraproducente
  dado postura protaída
• Crucifixo inclinado: adequado como acessório, insuficiente como principal

EXPECTATIVA: Melhora perceptível de simetria em 8–12 semanas com
progressão de carga adequada.
```

---

## UI — Explanation Card

### Estado colapsado (padrão no plano)

```
┌─────────────────────────────────────────────────────┐
│  Supino Inclinado 30°  •  4 séries × 8-10 reps      │
│                                       [↗ Por quê?]  │
└─────────────────────────────────────────────────────┘
```

### Estado expandido

```
┌─────────────────────────────────────────────────────┐
│ 🔍 DIAGNÓSTICO                                       │
│  Suas fotos mostram déficit de peitoral superior.   │
│  Ombro protaído sugere dominância de push horizontal│
│                                                     │
│ 💡 POR QUE ESTE EXERCÍCIO                           │
│  30° maximiza ativação da cabeça clavicular (+25%)  │
│  sem sobrecarregar deltóide anterior.               │
│                                                     │
│ 🔀 ALTERNATIVAS DESCARTADAS                         │
│  • Supino plano — não prioriza a lacuna             │
│  • Supino 45° — recruta mais deltóide (seu ponto    │
│    fraco de postura)                                │
│                                                     │
│ 📈 EXPECTATIVA                                      │
│  Melhora visível em 8–12 semanas                    │
│                                                     │
│  [Questionar esta escolha]  [Ver alternativas]      │
└─────────────────────────────────────────────────────┘
```

**Regras de UI:**
- Colapsado por padrão no modo expresso (aluno pode expandir)
- Expandido por padrão no modo analítico
- "Questionar esta escolha" retorna ao chat com o itemId no contexto — a IA não precisa re-perguntar qual item está sendo questionado
- "Ver alternativas" lista as alternativas descartadas com possibilidade de trocar

---

## Alternância de Modo

### Manual (banner persistente)

```
────────────────────────────────────────────────────────
Modo Expresso  ·  [Mudar para Analítico ↗]
────────────────────────────────────────────────────────
```

No modo analítico:
```
────────────────────────────────────────────────────────
Modo Analítico  ·  [Mudar para Expresso ↗]
────────────────────────────────────────────────────────
```

### Automática (detecção de perguntas analíticas)

Quando a mensagem do aluno contém palavras-chave:

```typescript
const ANALYTICAL_TRIGGERS = [
  'por que', 'porque', 'explica', 'como assim', 'não entendi',
  'qual a lógica', 'por qual motivo', 'como funciona',
];

if (ANALYTICAL_TRIGGERS.some(t => message.toLowerCase().includes(t))) {
  // Ativa modo analítico para esta resposta
  // Emite: { type: 'mode_suggestion', suggestedMode: 'analytical', trigger: matched_phrase }
}
```

A IA responde em profundidade para aquela mensagem, mas não altera a preferência de modo do perfil a menos que o aluno confirme explicitamente "quero sempre assim".

---

## Arquitetura Técnica

### Tool: generate_explanation_card

Novo tool adicionado ao `StudentCoachOrchestrator` no modo analítico:

```typescript
const generateExplanationCardTool: Tool = {
  name: 'generate_explanation_card',
  description: 'Generates an explanation card for a specific exercise or nutrition recommendation',
  input_schema: {
    type: 'object',
    properties: {
      item_type: { type: 'string', enum: ['exercise', 'meal', 'macro_target', 'periodization_phase'] },
      item_name: { type: 'string' },
      observation: { type: 'string' },
      diagnosis: { type: 'string' },
      solution: { type: 'string' },
      mechanism: { type: 'string' },
      evidence: { type: 'string' },
      alternatives_discarded: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' }, reason: { type: 'string' } } },
      },
      expectation: { type: 'string' },
    },
    required: ['item_type', 'item_name', 'observation', 'diagnosis', 'solution', 'mechanism'],
  },
};
```

### Endpoints novos/modificados

```
GET /api/ai/student/coach/explanation/:itemId
  → Retorna ExplanationCard completo para item de treino ou nutrição
  → Usado quando aluno clica "Questionar esta escolha" fora do fluxo de chat

PATCH /api/ai/student/coach/mode
  Body: { sessionId, mode: 'express' | 'analytical', persist?: boolean }
  → Altera modo da sessão atual
  → Se persist=true: salva em profiles.coach_mode
```

### SSE Events adicionados nesta fase

```typescript
type ExplanationSseEvent =
  | { type: 'explanation_card'; itemId: string; card: ExplanationCard }
  | { type: 'mode_suggestion'; suggestedMode: 'analytical'; trigger: string }
```

### Tabela nova — ai_explanation_cards

```sql
CREATE TABLE ai_explanation_cards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id    uuid REFERENCES ai_chat_sessions(id),
  item_type     text NOT NULL
    CHECK (item_type IN ('exercise', 'meal', 'macro_target', 'periodization_phase')),
  item_ref_id   uuid,     -- referência ao workout_exercise, diet_meal, etc.
  item_name     text NOT NULL,
  observation   text NOT NULL,
  diagnosis     text NOT NULL,
  solution      text NOT NULL,
  mechanism     text NOT NULL,
  evidence      text,
  alternatives  jsonb DEFAULT '[]',  -- [{ name, reason_discarded }]
  expectation   text,
  created_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE ai_explanation_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_own" ON ai_explanation_cards
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "specialist_managed" ON ai_explanation_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM managed_students
      WHERE student_id = ai_explanation_cards.student_id
        AND specialist_id = auth.uid()
    )
  );
```

**Por que tabela separada e não inlined no plano:**
O aluno pode questionar qualquer item em qualquer momento futuro. Explanation cards inlined no JSON do plano seriam invalidados a cada atualização do plano. Com tabela separada + `item_ref_id`, as explicações vivem independentes e podem ser atualizadas quando a IA re-explica com novo contexto.

### TypeScript interface

```typescript
interface ExplanationCard {
  id: string;
  item_type: 'exercise' | 'meal' | 'macro_target' | 'periodization_phase';
  item_name: string;
  observation: string;
  diagnosis: string;
  solution: string;
  mechanism: string;
  evidence?: string;
  alternatives_discarded: Array<{ name: string; reason: string }>;
  expectation?: string;
}
```

### Limites por plano

| Feature | Basic | Pro | Elite |
|---|---|---|---|
| Cards de explicação (modo analítico) | 20/plano | Ilimitado | Ilimitado |
| Criação de plano modo analítico | — | 1× | Ilimitado |

---

## Checklist de done — Motor de Explicabilidade

- [ ] `generate_explanation_card` tool implementado no `StudentCoachOrchestrator`
- [ ] Tool ativo apenas no modo analítico
- [ ] `ExplanationCard` component colapsável implementado
- [ ] Estado expandido por padrão no modo analítico, colapsado no expresso
- [ ] "Questionar esta escolha" → reabre chat com itemId no contexto
- [ ] "Ver alternativas" lista alternativas descartadas com opção de troca
- [ ] Alternância de modo manual via banner persistente
- [ ] Detecção automática de perguntas analíticas (lista de triggers)
- [ ] `PATCH /api/ai/student/coach/mode` com flag `persist`
- [ ] `GET /api/ai/student/coach/explanation/:itemId` implementado
- [ ] Tabela `ai_explanation_cards` criada com RLS
- [ ] Gate de cards/plano por plano de assinatura implementado
- [ ] Lint + typecheck limpos
