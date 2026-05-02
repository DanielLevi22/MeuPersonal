# PRD: AI Student Coach — Análise Visual (Fase 2 + Fase 4)
# Fotos Corporais e Análise de Refeições

**Status:** approved
**Parte de:** [ai-student-personalized-coach.md](ai-student-personalized-coach.md)
**Branch:** feature/ai-student-coach-visual-analysis
**Depende de:** [Fase 1 — Core](ai-student-coach-core.md) (StudentCoachOrchestrator deve existir)
**Seguido por:** [Fase 3 — Motor de Explicabilidade](ai-student-coach-explanation-engine.md)

---

## O que esta fase entrega

1. **Análise corporal** (Fase 2): aluno envia fotos corporais → IA analisa desequilíbrios, postura e prioridades → resultado alimenta diretamente o plano de treino
2. **Análise de refeição** (Fase 4): aluno envia foto de prato → IA estima macros, compara com plano vigente, dá feedback imediato

Essas duas features são implementadas em sprints separados mas documentadas juntas por compartilharem a mesma infra de vision e upload.

---

## Fluxo 1 — Análise Corporal para Treino

### Quando é acionada

- Onboarding analítico: "Me manda fotos para eu personalizar melhor seu treino"
- Check-in periódico: tela de check-in mensal/bimestral
- Ação voluntária: botão "Analisar meu físico" no perfil do aluno

### Entradas aceitas

- Mínimo: 1 foto (frente)
- Ideal: frente + lado + costas
- Formato: JPEG/PNG, máx 5MB por foto
- Tela de upload guiada com exemplo de posicionamento correto

### O que a IA analisa (Claude Sonnet 4.6 + Vision)

Para cada conjunto de fotos recebido:
1. Estimativa qualitativa de composição corporal (% gordura — qualitativo, não métrico)
2. Desequilíbrios musculares visíveis (assimetrias, grupos sub-desenvolvidos)
3. Avaliação de postura (anteriorização de ombros, hiperlordose, etc.)
4. Prioridades de desenvolvimento (top 3 grupos a focar)
5. Alertas de risco (posturas que sugerem compensações)

### Output estruturado (interno para o orquestrador)

```typescript
interface BodyAnalysisResult {
  body_composition_estimate: string; // qualitativo
  muscle_imbalances: Array<{
    group: string;
    status: 'déficit' | 'equilibrado' | 'desenvolvido';
    severity: 'leve' | 'moderado' | 'acentuado';
  }>;
  posture_observations: Array<{
    type: string;           // 'ombro_protaido', 'hiperlordose_lombar', etc.
    bilateral: boolean;
  }>;
  training_priorities: string[];   // top 3 grupos musculares a priorizar
  risk_flags: string[];            // restrições para o orquestrador
  summary_for_student: string;     // texto em linguagem acessível para exibir ao aluno
}
```

### Como alimenta o plano

- `training_priorities` → passados como parâmetro obrigatório ao `proposeWorkoutPlan` tool
- `risk_flags` → geram restrições automáticas (excluem exercícios contraindicados)
- `posture_observations` → ajustam seleção de exercícios (ex: hiperlordose → evita overhead pesado)
- Raciocínio do plano referencia explicitamente os achados visuais ("Priorizamos peitoral superior porque nas suas fotos...")

### UI — BodyAnalysisFeedbackCard

```
┌─────────────────────────────────────────────────────────┐
│  Análise do seu físico                                  │
│  Com base nas fotos enviadas                            │
│                                                         │
│  🎯 Prioridades identificadas                           │
│     1. Peitoral superior (déficit moderado)             │
│     2. Posterior da coxa (déficit leve)                 │
│     3. Core estabilizador                               │
│                                                         │
│  ⚠️  Atenção                                            │
│     Ombros anteriorizado — atenção em exercícios        │
│     de ombro em amplitude extrema                       │
│                                                         │
│  ✅ Seu plano foi ajustado para corrigir esses pontos   │
│                                                         │
│  [Ver como isso muda meu treino]                        │
└─────────────────────────────────────────────────────────┘
```

---

## Fluxo 2 — Análise de Refeição para Nutrição

### Quando é acionada

1. **Durante onboarding analítico**: "Me manda uma foto de uma refeição típica" → IA entende padrão alimentar atual antes de montar o plano
2. **Assistente diário**: "O que você acha do meu almoço?" → feedback instantâneo
3. **Check-in**: foto de refeição complementa foto corporal para análise de progresso nutricional

### O que a IA analisa (Claude Haiku 4.5 + Vision)

Para cada foto de refeição:
1. Identificação dos alimentos presentes
2. Estimativa de porções (qualitativa → convertida para quantitativa)
3. Estimativa de macros (kcal, proteína, carb, gordura)
4. Avaliação em relação ao plano vigente (dentro/fora dos alvos?)
5. Sugestão de ajuste (se necessário)

**Por que Haiku e não Sonnet aqui:** análise de refeição é lookup estruturado (identifica objetos, estima quantidades, compara com tabela nutricional). Haiku lida bem com isso em ~1,5s com custo 10× menor.

### Output estruturado

```typescript
interface MealAnalysisResult {
  foods_identified: Array<{
    name: string;
    portion_estimate_g: number;
    confidence: number; // 0-1
  }>;
  macro_estimate: {
    kcal: number;
    protein_g: number;
    carb_g: number;
    fat_g: number;
  };
  vs_plan: {
    meal_target_kcal: number;
    delta_protein_g: number;
    assessment: 'dentro_do_alvo' | 'acima_do_alvo' | 'abaixo_do_alvo' | 'sem_plano';
  };
  feedback: string; // texto para exibir ao aluno
}
```

### UI — MealFeedbackCard

```
┌─────────────────────────────────────────────────────────┐
│  Frango + arroz + salada                                │
│                                                         │
│  ~520 kcal  |  48g prot  |  52g carb  |  8g gord        │
│                                                         │
│  ✅  Dentro do alvo de 550 kcal                          │
│      Proteína +5g — ok para dia de treino               │
│                                                         │
│  [📊 Ver no diário alimentar]                           │
└─────────────────────────────────────────────────────────┘
```

Se fora do alvo:

```
┌─────────────────────────────────────────────────────────┐
│  Pizza (2 fatias) + refrigerante                        │
│                                                         │
│  ~780 kcal  |  28g prot  |  95g carb  |  28g gord       │
│                                                         │
│  ⚠️  230 kcal acima do alvo desta refeição               │
│     Proteína 20g abaixo do alvo                         │
│                                                         │
│  Sugestão: adicionar uma fonte de proteína na           │
│  próxima refeição (frango, ovo, atum)                   │
│                                                         │
│  [Ajustar próximas refeições do dia]  [Ignorar]         │
└─────────────────────────────────────────────────────────┘
```

"Ajustar próximas refeições" → gera `pending_plan_adjustment` (protocolo de aprovação existente).

---

## Arquitetura Técnica

### Endpoints

```
POST /api/ai/student/coach/analyze-body
  Body: { photos: File[], sessionId?: string }
  Content-Type: multipart/form-data
  → Análise visual corporal, retorna BodyAnalysisResult
  → Salva em student_body_analyses
  Modelo: Claude Sonnet 4.6 + Vision

POST /api/ai/student/coach/analyze-meal
  Body: { photo: File, sessionId?: string }
  Content-Type: multipart/form-data
  → Análise de refeição, retorna MealAnalysisResult
  Modelo: Claude Haiku 4.5 + Vision
```

### SSE Events adicionados nesta fase

```typescript
type VisualAnalysisSseEvent =
  | { type: 'analysis_start'; target: 'body' | 'meal' }
  | { type: 'analysis_complete'; result: BodyAnalysisResult | MealAnalysisResult }
```

### Tabela nova — student_body_analyses

```sql
CREATE TABLE student_body_analyses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id          uuid REFERENCES ai_chat_sessions(id),
  photo_urls          text[] NOT NULL,
  analysis_raw        jsonb NOT NULL,       -- BodyAnalysisResult completo
  training_priorities text[] NOT NULL,
  risk_flags          text[] DEFAULT '{}',
  created_at          timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE student_body_analyses ENABLE ROW LEVEL SECURITY;

-- Aluno vê apenas seus próprios
CREATE POLICY "student_own" ON student_body_analyses
  FOR ALL USING (student_id = auth.uid());

-- Especialista vinculado pode ver (via managed_students)
CREATE POLICY "specialist_managed" ON student_body_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM managed_students
      WHERE student_id = student_body_analyses.student_id
        AND specialist_id = auth.uid()
    )
  );
```

### Limites de uso por plano (Gate de feature)

| Feature | Basic | Pro | Elite |
|---|---|---|---|
| Análises corporais (foto) | 2/mês | 8/mês | Ilimitado |
| Análises de refeição (foto) | 10/mês | 50/mês | Ilimitado |

Contador de análises restantes exibido no UI.

---

## Decisões técnicas

**Por que não usar GPT-4V para análise visual?**
Consistência de stack. Todo o sistema usa Claude. Sonnet 4.6 + Vision é competitivo com GPT-4V para análise corporal qualitativa. Evita chave de API adicional, billing separado e inconsistência de comportamento.

**Por que análise corporal não é em tempo real (câmera ao vivo)?**
Fora do escopo desta entrega. Análise de fotos estáticas já resolve 95% dos casos de uso. Câmera ao vivo é feature premium para fase futura.

**Por que as prioridades da análise corporal são injetadas no orquestrador, não mostradas como sugestão?**
Se o aluno vê a análise antes do plano, ele pode ficar preso em perguntas sobre a análise e nunca chegar ao plano. Injeção silenciosa no orquestrador e menção posterior ("Priorizamos X porque nas suas fotos...") é mais fluida.

**LGPD:** fotos corporais são dados biométricos sensíveis. Consultar `docs/LGPD_COMPLIANCE.md` antes de implementar upload e storage. Base legal: consentimento explícito do titular (art. 11, II, a).

---

## Checklist de done — Análise Visual

- [ ] Endpoint `POST /api/ai/student/coach/analyze-body` implementado
- [ ] Upload de fotos no chat (frente/lado/costas) com guia de posicionamento
- [ ] `BodyAnalysisResult` estruturado salvo em `student_body_analyses`
- [ ] `training_priorities` e `risk_flags` injetados no `proposeWorkoutPlan` tool
- [ ] UI: `BodyAnalysisFeedbackCard` com prioridades e alertas
- [ ] Endpoint `POST /api/ai/student/coach/analyze-meal` implementado
- [ ] `MealFeedbackCard` com macros estimados + comparação com plano
- [ ] Integração com `pending_plan_adjustments` quando refeição está fora do alvo
- [ ] Tabela `student_body_analyses` criada com RLS configurado
- [ ] Gate de análises/mês por plano implementado e testado
- [ ] Contador de análises restantes visível no UI
- [ ] LGPD: consentimento explícito para fotos corporais documentado
- [ ] Lint + typecheck limpos
