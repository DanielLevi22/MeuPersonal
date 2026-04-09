# Proposta: Sistema de Periodização de Treinos

## Visão Geral

Atualmente, o sistema possui apenas **Treinos** individuais que são atribuídos diretamente aos alunos. Esta proposta introduz uma hierarquia profissional de 3 níveis, alinhada com as melhores práticas de educação física e personal training.

## Arquitetura Proposta

### Hierarquia de 3 Níveis

```
Periodização (Training Period)
    └── Ficha de Treino (Training Plan)
        └── Treino (Workout)
            └── Exercício (Exercise)
```

### 1. Periodização (Training Period)

**Definição**: Ciclo de treinamento maior que representa uma fase específica do programa do aluno.

**Características**:
- Duração: 4-12 semanas (configurável)
- Objetivo macro: Hipertrofia, Força, Resistência, Emagrecimento, etc.
- Status: Planejada, Ativa, Concluída, Cancelada
- Data de início e fim
- Vinculada a um aluno específico

**Campos**:
```typescript
interface Periodization {
  id: string;
  student_id: string;
  personal_id: string;
  name: string; // Ex: "Ciclo de Hipertrofia - Q1 2024"
  objective: 'hypertrophy' | 'strength' | 'endurance' | 'weight_loss' | 'conditioning';
  start_date: Date;
  end_date: Date;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}
```

**Exemplos de Uso**:
- "Mesociclo de Hipertrofia - 8 semanas"
- "Preparação para Competição - 12 semanas"
- "Fase de Adaptação Anatômica - 4 semanas"

---

### 2. Ficha de Treino (Training Plan)

**Definição**: Conjunto estruturado de treinos planejados para um período específico dentro da periodização.

**Características**:
- Pertence a uma periodização
- Contém múltiplos treinos (A, B, C, D, etc.)
- Frequência semanal definida
- Divisão muscular/metodologia
- Observações e orientações

**Campos**:
```typescript
interface TrainingPlan {
  id: string;
  periodization_id: string;
  name: string; // Ex: "Ficha ABC - Semanas 1-4"
  description?: string;
  training_split: 'abc' | 'abcd' | 'abcde' | 'upper_lower' | 'full_body' | 'push_pull_legs' | 'custom';
  weekly_frequency: number; // 3-6 vezes por semana
  start_date: Date;
  end_date: Date;
  status: 'draft' | 'active' | 'completed';
  notes?: string; // Orientações gerais
  goals?: string[]; // Metas específicas desta ficha
  created_at: Date;
  updated_at: Date;
}
```

**Exemplos de Uso**:
- "Ficha ABC - Fase 1 (Semanas 1-4)"
- "Divisão Push/Pull/Legs - Intensidade Moderada"
- "Full Body 3x/semana - Iniciante"

---

### 3. Treino (Workout)

**Definição**: Sessão individual de treino que o aluno executa.

**Características**:
- Pertence a uma ficha de treino
- Identificação por letra/nome (A, B, C, etc.)
- Lista de exercícios com ordem específica
- Pode ser executado múltiplas vezes

**Campos** (estrutura atual + adições):
```typescript
interface Workout {
  id: string;
  training_plan_id: string; // Nova relação
  personal_id: string;
  name: string; // Ex: "Treino A - Peito e Tríceps"
  identifier: string; // "A", "B", "C", etc.
  description?: string;
  estimated_duration?: number; // minutos
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  focus_areas?: string[]; // ["chest", "triceps"]
  created_at: Date;
  updated_at: Date;
}
```

---

## Benefícios da Nova Arquitetura

### Para o Personal Trainer

1. **Planejamento Profissional**
   - Criar programas de treinamento estruturados de longo prazo
   - Visualizar progressão do aluno ao longo do tempo
   - Aplicar princípios de periodização científica

2. **Organização**
   - Agrupar treinos por fase/objetivo
   - Facilitar ajustes e progressões
   - Histórico completo de periodizações anteriores

3. **Diferencial Competitivo**
   - Demonstrar profissionalismo
   - Justificar valor do serviço
   - Fidelizar clientes com planejamento de longo prazo

### Para o Aluno

1. **Clareza**
   - Entender o plano completo de treinamento
   - Visualizar progresso dentro da periodização
   - Saber exatamente onde está no programa

2. **Motivação**
   - Ver evolução entre fases
   - Compreender objetivos de cada etapa
   - Acompanhar conclusão de ciclos

3. **Resultados**
   - Treinamento mais estruturado e eficiente
   - Progressão planejada e segura
   - Menor risco de overtraining ou estagnação

---

## Fluxo de Trabalho Proposto

### 1. Criação de Periodização

```
Personal cria periodização:
├── Define objetivo (hipertrofia, força, etc.)
├── Define duração (ex: 8 semanas)
├── Atribui ao aluno
└── Status: "Planejada"
```

### 2. Criação de Fichas

```
Dentro da periodização, cria fichas:
├── Ficha 1: Semanas 1-4 (Adaptação)
│   ├── Treino A: Peito e Tríceps
│   ├── Treino B: Costas e Bíceps
│   └── Treino C: Pernas e Ombros
│
└── Ficha 2: Semanas 5-8 (Intensificação)
    ├── Treino A: Peito e Tríceps (volume aumentado)
    ├── Treino B: Costas e Bíceps (volume aumentado)
    └── Treino C: Pernas e Ombros (volume aumentado)
```

### 3. Execução pelo Aluno

```
Aluno visualiza:
├── Periodização ativa
├── Ficha atual da semana
└── Treinos disponíveis para executar
```

---

## Implementação Técnica

### Schema do Banco de Dados

```sql
-- Tabela de Periodizações
CREATE TABLE periodizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT NOT NULL CHECK (objective IN ('hypertrophy', 'strength', 'endurance', 'weight_loss', 'conditioning')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Fichas de Treino
CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  periodization_id UUID NOT NULL REFERENCES periodizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  training_split TEXT NOT NULL,
  weekly_frequency INTEGER NOT NULL CHECK (weekly_frequency BETWEEN 1 AND 7),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  notes TEXT,
  goals JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atualizar tabela de Workouts
ALTER TABLE workouts 
ADD COLUMN training_plan_id UUID REFERENCES training_plans(id) ON DELETE SET NULL,
ADD COLUMN identifier TEXT, -- "A", "B", "C", etc.
ADD COLUMN estimated_duration INTEGER,
ADD COLUMN difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN focus_areas JSONB;

-- Índices para performance
CREATE INDEX idx_periodizations_student ON periodizations(student_id);
CREATE INDEX idx_periodizations_personal ON periodizations(personal_id);
CREATE INDEX idx_periodizations_status ON periodizations(status);
CREATE INDEX idx_training_plans_periodization ON training_plans(periodization_id);
CREATE INDEX idx_workouts_training_plan ON workouts(training_plan_id);
```

### RLS (Row Level Security)

```sql
-- Periodizations
ALTER TABLE periodizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personal trainers can manage their periodizations"
ON periodizations FOR ALL
USING (personal_id = auth.uid());

CREATE POLICY "Students can view their periodizations"
ON periodizations FOR SELECT
USING (student_id = auth.uid());

-- Training Plans
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personal trainers can manage training plans"
ON training_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM periodizations
    WHERE periodizations.id = training_plans.periodization_id
    AND periodizations.personal_id = auth.uid()
  )
);

CREATE POLICY "Students can view their training plans"
ON training_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM periodizations
    WHERE periodizations.id = training_plans.periodization_id
    AND periodizations.student_id = auth.uid()
  )
);
```

---

## UI/UX Sugerida

### Para Personal Trainer

#### Dashboard
```
┌─────────────────────────────────────┐
│ Periodizações Ativas                │
├─────────────────────────────────────┤
│ João Silva                          │
│ ├─ Hipertrofia Q1 2024             │
│ │  └─ Ficha ABC (Semana 2/8)       │
│ │     ├─ Treino A ✓                │
│ │     ├─ Treino B ✓                │
│ │     └─ Treino C (hoje)           │
│                                     │
│ Maria Santos                        │
│ └─ Emagrecimento (Semana 5/12)     │
│    └─ Full Body 3x (Semana 1/4)    │
└─────────────────────────────────────┘
```

#### Fluxo de Criação
```
1. Criar Periodização
   ↓
2. Criar Ficha(s) de Treino
   ↓
3. Adicionar Treinos (A, B, C...)
   ↓
4. Configurar Exercícios
   ↓
5. Ativar Periodização
```

### Para Aluno (App Mobile)

#### Tela Principal
```
┌─────────────────────────────────────┐
│ Meu Programa Atual                  │
├─────────────────────────────────────┤
│ 🎯 Hipertrofia - 8 Semanas          │
│ Semana 2 de 8                       │
│ [████████░░░░░░░░] 25%              │
│                                     │
│ Ficha Atual: ABC (Semanas 1-4)      │
│                                     │
│ Treinos desta semana:               │
│ ✓ Treino A - Peito (Segunda)       │
│ ✓ Treino B - Costas (Quarta)       │
│ → Treino C - Pernas (Hoje)         │
└─────────────────────────────────────┘
```

---

## Migração do Sistema Atual

### Estratégia de Migração

1. **Fase 1: Criar novas tabelas**
   - Adicionar `periodizations` e `training_plans`
   - Manter `workouts` compatível com sistema antigo

2. **Fase 2: Migração gradual**
   - Treinos existentes continuam funcionando
   - Novos treinos podem ser criados com ou sem periodização
   - Campo `training_plan_id` é opcional

3. **Fase 3: Ferramentas de conversão**
   - Criar assistente para converter treinos antigos em fichas
   - Sugerir criação de periodização para alunos com múltiplos treinos

4. **Fase 4: Deprecação suave**
   - Após 6 meses, incentivar uso do novo sistema
   - Manter compatibilidade retroativa

### Compatibilidade

```typescript
// Treinos podem existir de 3 formas:
1. Treino legado (sem training_plan_id) ✓
2. Treino em ficha (com training_plan_id) ✓
3. Treino avulso novo (sem training_plan_id) ✓
```

---

## Próximos Passos

### Prioridade Alta
- [ ] Criar schema de banco de dados
- [ ] Implementar CRUD de periodizações
- [ ] Implementar CRUD de fichas de treino
- [ ] Atualizar criação de treinos para vincular a fichas

### Prioridade Média
- [ ] Dashboard de periodizações ativas
- [ ] Visualização de progresso do aluno
- [ ] Clonagem de fichas/periodizações
- [ ] Templates de periodização

### Prioridade Baixa
- [ ] Relatórios de conclusão de ciclos
- [ ] Análise de aderência por periodização
- [ ] Comparação entre periodizações
- [ ] Exportação de programas completos

---

## Referências

- **Periodização Clássica**: Matveyev, L. (1981)
- **Periodização Ondulatória**: Poliquin, C. (1988)
- **Periodização Não-Linear**: Kraemer & Fleck (2007)
- **NSCA Guidelines**: National Strength and Conditioning Association

---

## Conclusão

A implementação de um sistema de periodização eleva significativamente o nível profissional da plataforma, alinhando-a com as melhores práticas de educação física e personal training. Esta estrutura permite:

✅ Planejamento de longo prazo  
✅ Progressão científica  
✅ Melhor organização  
✅ Maior valor percebido  
✅ Diferencial competitivo  

**Recomendação**: Implementar em fases, mantendo compatibilidade com o sistema atual para garantir transição suave.
