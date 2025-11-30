# Arquitetura Completa do Banco de Dados - MeuPersonal

## 📊 Visão Geral

O banco de dados possui **40 tabelas** organizadas em 7 módulos principais:

1. **Autenticação e Perfis** (profiles, students, students_personals)
2. **Treinos e Periodização** (periodizations, training_plans, workouts, exercises)
3. **Nutrição** (diet_plans, diet_meals, foods)
4. **Gamificação** (achievements, daily_goals, leaderboard_scores, student_streaks)
5. **Comunicação** (conversations, chat_messages)
6. **Administração** (admin_audit_logs, system_settings, feature_flags)
7. **Logs e Sessões** (workout_sessions, workout_logs, diet_logs)

---

## 🗺️ Diagrama ER Completo

```mermaid
erDiagram
    %% ========================================
    %% MÓDULO: AUTENTICAÇÃO E PERFIS
    %% ========================================
    
    PROFILES {
        uuid id PK
        text email
        text full_name
        text avatar_url
        text invite_code
        text phone
        numeric weight
        numeric height
        account_type account_type
        subscription_tier subscription_tier
        account_status account_status
        boolean is_super_admin
        integer xp
        integer level
    }
    
    STUDENTS {
        uuid id PK
        uuid personal_id FK
        text email
        text full_name
        text phone
        text invite_code
        numeric weight
        numeric height
        jsonb initial_assessment
    }
    
    STUDENTS_PERSONALS {
        uuid id PK
        uuid personal_id FK
        uuid student_id FK
        invite_status status
        timestamp created_at
    }
    
    %% ========================================
    %% MÓDULO: PERIODIZAÇÃO E TREINOS
    %% ========================================
    
    PERIODIZATIONS {
        uuid id PK
        uuid student_id FK
        uuid personal_id FK
        uuid professional_id FK
        uuid pending_student_id FK
        text name
        text objective
        date start_date
        date end_date
        text status
    }
    
    TRAINING_PLANS {
        uuid id PK
        uuid periodization_id FK
        text name
        text training_split
        integer weekly_frequency
        date start_date
        date end_date
        text status
    }
    
    WORKOUTS {
        uuid id PK
        uuid personal_id FK
        uuid student_id FK
        uuid training_plan_id FK
        text title
        text description
        text identifier
    }
    
    WORKOUT_ITEMS {
        uuid id PK
        uuid workout_id FK
        uuid exercise_id FK
        integer sets
        text reps
        text weight
        integer rest_time
    }
    
    EXERCISES {
        uuid id PK
        uuid created_by FK
        text name
        text muscle_group
        text video_url
        boolean is_verified
    }
    
    %% ========================================
    %% MÓDULO: NUTRIÇÃO
    %% ========================================
    
    DIET_PLANS {
        uuid id PK
        uuid student_id FK
        uuid personal_id FK
        uuid professional_id FK
        uuid pending_student_id FK
        text name
        numeric target_calories
        numeric target_protein
        text status
        text plan_type
    }
    
    DIET_MEALS {
        uuid id PK
        uuid diet_plan_id FK
        integer day_of_week
        text meal_type
        integer meal_order
        time meal_time
    }
    
    DIET_MEAL_ITEMS {
        uuid id PK
        uuid diet_meal_id FK
        uuid food_id FK
        numeric quantity
        text unit
    }
    
    FOODS {
        uuid id PK
        uuid created_by FK
        text name
        text category
        numeric calories
        numeric protein
        numeric carbs
        numeric fat
        boolean is_custom
    }
    
    %% ========================================
    %% MÓDULO: GAMIFICAÇÃO
    %% ========================================
    
    ACHIEVEMENTS {
        uuid id PK
        uuid student_id FK
        text type
        text title
        integer points
        timestamp earned_at
    }
    
    DAILY_GOALS {
        uuid id PK
        uuid student_id FK
        date date
        integer meals_target
        integer meals_completed
        integer workout_target
        integer workout_completed
        boolean completed
    }
    
    STUDENT_STREAKS {
        uuid id PK
        uuid student_id FK
        integer current_streak
        integer longest_streak
        date last_activity_date
    }
    
    LEADERBOARD_SCORES {
        uuid id PK
        uuid student_id FK
        date week_start_date
        integer points
        jsonb breakdown
    }
    
    %% ========================================
    %% MÓDULO: COMUNICAÇÃO
    %% ========================================
    
    CONVERSATIONS {
        uuid id PK
        uuid personal_id FK
        uuid student_id FK
        timestamp last_message_at
    }
    
    CHAT_MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        uuid receiver_id FK
        text content
        text message_type
        timestamp read_at
    }
    
    %% ========================================
    %% MÓDULO: LOGS E SESSÕES
    %% ========================================
    
    WORKOUT_SESSIONS {
        uuid id PK
        uuid workout_id FK
        uuid student_id FK
        timestamp started_at
        timestamp completed_at
    }
    
    WORKOUT_LOGS {
        uuid id PK
        uuid student_id FK
        uuid workout_id FK
        timestamp completed_at
        text feedback
    }
    
    DIET_LOGS {
        uuid id PK
        uuid student_id FK
        uuid diet_plan_id FK
        uuid diet_meal_id FK
        date logged_date
        boolean completed
        jsonb actual_items
    }
    
    PHYSICAL_ASSESSMENTS {
        uuid id PK
        uuid student_id FK
        uuid personal_id FK
        date date
        numeric weight
        numeric height
        numeric body_fat_percentage
    }
    
    %% ========================================
    %% RELACIONAMENTOS
    %% ========================================
    
    %% Profiles
    PROFILES ||--o{ STUDENTS_PERSONALS : "professional_id"
    PROFILES ||--o{ STUDENTS_PERSONALS : "student_id"
    PROFILES ||--o{ STUDENTS : "personal_id"
    PROFILES ||--o{ PERIODIZATIONS : "professional_id"
    PROFILES ||--o{ DIET_PLANS : "professional_id"
    PROFILES ||--o{ WORKOUTS : "personal_id"
    PROFILES ||--o{ CONVERSATIONS : "personal_id"
    PROFILES ||--o{ CONVERSATIONS : "student_id"
    PROFILES ||--o{ CHAT_MESSAGES : "sender_id"
    PROFILES ||--o{ ACHIEVEMENTS : "student_id"
    PROFILES ||--o{ DAILY_GOALS : "student_id"
    PROFILES ||--o{ WORKOUT_SESSIONS : "student_id"
    PROFILES ||--o{ DIET_LOGS : "student_id"
    
    %% Students (Legacy - Pending)
    STUDENTS ||--o{ PERIODIZATIONS : "pending_student_id"
    STUDENTS ||--o{ DIET_PLANS : "pending_student_id"
    
    %% Periodizations
    PERIODIZATIONS ||--o{ TRAINING_PLANS : "periodization_id"
    
    %% Training Plans
    TRAINING_PLANS ||--o{ WORKOUTS : "training_plan_id"
    
    %% Workouts
    WORKOUTS ||--o{ WORKOUT_ITEMS : "workout_id"
    WORKOUTS ||--o{ WORKOUT_SESSIONS : "workout_id"
    WORKOUTS ||--o{ WORKOUT_LOGS : "workout_id"
    
    %% Exercises
    EXERCISES ||--o{ WORKOUT_ITEMS : "exercise_id"
    
    %% Diet Plans
    DIET_PLANS ||--o{ DIET_MEALS : "diet_plan_id"
    DIET_PLANS ||--o{ DIET_LOGS : "diet_plan_id"
    
    %% Diet Meals
    DIET_MEALS ||--o{ DIET_MEAL_ITEMS : "diet_meal_id"
    DIET_MEALS ||--o{ DIET_LOGS : "diet_meal_id"
    
    %% Foods
    FOODS ||--o{ DIET_MEAL_ITEMS : "food_id"
    
    %% Conversations
    CONVERSATIONS ||--o{ CHAT_MESSAGES : "conversation_id"
```

---

## 📋 Tabelas Detalhadas

### 🔐 Módulo: Autenticação e Perfis

#### PROFILES (Usuários Autenticados)
**Propósito**: Tabela central de todos os usuários autenticados (profissionais e alunos)

**Colunas Principais**:
- `id` (PK): UUID do auth.users
- `account_type`: `professional`, `managed_student`, `autonomous_student`
- `account_status`: `pending`, `active`, `suspended`
- `subscription_tier`: `free`, `basic`, `premium`, `enterprise`
- `xp`, `level`: Sistema de gamificação

**Relacionamentos**:
- É profissional de vários alunos via `students_personals`
- É aluno de vários profissionais via `students_personals`
- Cria periodizações, dietas, treinos
- Participa de conversas

---

#### STUDENTS (Alunos Pendentes - LEGACY)
**Propósito**: ⚠️ **TABELA PROBLEMÁTICA** - Armazena alunos sem auth user

**Colunas Principais**:
- `id` (PK): UUID gerado automaticamente
- `personal_id` (FK): Profissional que criou
- `invite_code`: Código para login
- `full_name`, `phone`, `weight`, `height`

**Problema Identificado**:
- Alunos criados aqui têm ID temporário
- Quando fazem login, novo ID é criado em `profiles`
- Periodizações ficam com ID antigo → não aparecem para o aluno!

**Relacionamentos**:
- `periodizations.pending_student_id` → `students.id`
- `diet_plans.pending_student_id` → `students.id`

---

#### STUDENTS_PERSONALS (Relacionamento Aluno-Profissional)
**Propósito**: Tabela de junção N:M entre alunos e profissionais

**Colunas Principais**:
- `student_id` (FK): `profiles.id` (aluno autenticado)
- `personal_id` (FK): `profiles.id` (profissional)
- `status`: `pending`, `active`, `paused`, `ended`

**Uso Correto**:
- Deve referenciar apenas `profiles.id`
- Não deve ter links para `students.id`

---

### 💪 Módulo: Periodização e Treinos

#### PERIODIZATIONS
**Colunas Principais**:
- `student_id` (FK): `profiles.id` ✅ Correto
- `pending_student_id` (FK): `students.id` ⚠️ Legacy
- `professional_id` (FK): `profiles.id`
- `personal_id` (FK): `profiles.id` (duplicado?)
- `objective`: `hypertrophy`, `strength`, `endurance`, `weight_loss`
- `status`: `planned`, `active`, `completed`

**Problema**:
- Tem DOIS campos para student: `student_id` e `pending_student_id`
- Periodizações antigas usam `pending_student_id`
- Periodizações novas devem usar `student_id`

---

#### TRAINING_PLANS (Fases/Fichas)
**Colunas Principais**:
- `periodization_id` (FK): Periodização pai
- `training_split`: Tipo de divisão (ABC, ABCD, etc)
- `weekly_frequency`: Frequência semanal
- `status`: `draft`, `active`, `completed`

---

#### WORKOUTS (Treinos Individuais)
**Colunas Principais**:
- `training_plan_id` (FK): Ficha pai
- `personal_id` (FK): Criador
- `student_id` (FK): Aluno (opcional)
- `title`: Nome do treino (ex: "Treino A")
- `identifier`: Identificador (A, B, C, etc)

---

#### WORKOUT_ITEMS (Exercícios do Treino)
**Colunas Principais**:
- `workout_id` (FK): Treino pai
- `exercise_id` (FK): Exercício
- `sets`, `reps`, `weight`, `rest_time`
- `order`: Ordem no treino

---

#### EXERCISES (Catálogo de Exercícios)
**Colunas Principais**:
- `name`: Nome do exercício
- `muscle_group`: Grupo muscular
- `video_url`: URL do vídeo demonstrativo
- `created_by` (FK): Criador (se custom)
- `is_verified`: Se foi verificado por admin

---

### 🥗 Módulo: Nutrição

#### DIET_PLANS
**Colunas Principais**:
- `student_id` (FK): `profiles.id` ✅
- `pending_student_id` (FK): `students.id` ⚠️ Legacy
- `professional_id` (FK): `profiles.id`
- `plan_type`: `unique` (mesmo todos os dias) ou `cyclic` (varia por dia)
- `target_calories`, `target_protein`, `target_carbs`, `target_fat`
- `status`: `active`, `inactive`, `completed`

**Mesmo Problema**:
- Também tem `pending_student_id` para alunos legacy

---

#### DIET_MEALS (Refeições)
**Colunas Principais**:
- `diet_plan_id` (FK): Plano pai
- `day_of_week`: -1 (único) ou 0-6 (domingo-sábado)
- `meal_type`: `breakfast`, `lunch`, `dinner`, `snack`
- `meal_order`: Ordem da refeição
- `meal_time`: Horário sugerido

---

#### DIET_MEAL_ITEMS (Alimentos da Refeição)
**Colunas Principais**:
- `diet_meal_id` (FK): Refeição pai
- `food_id` (FK): Alimento
- `quantity`: Quantidade
- `unit`: `g`, `ml`, `un`, `col`, `xic`

---

#### FOODS (Catálogo de Alimentos)
**Colunas Principais**:
- `name`: Nome do alimento
- `category`: Categoria
- `calories`, `protein`, `carbs`, `fat`, `fiber`
- `serving_size`, `serving_unit`
- `is_custom`: Se foi criado por profissional
- `search_vector`: Para busca full-text

---

### 🎮 Módulo: Gamificação

#### ACHIEVEMENTS (Conquistas)
**Colunas Principais**:
- `student_id` (FK): Aluno que conquistou
- `type`: Tipo de conquista
- `title`, `description`, `icon`
- `points`: Pontos ganhos
- `earned_at`: Quando conquistou

---

#### DAILY_GOALS (Metas Diárias)
**Colunas Principais**:
- `student_id` (FK): Aluno
- `date`: Data
- `meals_target`, `meals_completed`
- `workout_target`, `workout_completed`
- `water_target`, `water_completed`
- `sleep_target`, `sleep_completed`
- `completion_percentage`

---

#### STUDENT_STREAKS (Sequências)
**Colunas Principais**:
- `student_id` (FK): Aluno
- `current_streak`: Sequência atual
- `longest_streak`: Maior sequência
- `last_activity_date`: Última atividade

---

#### LEADERBOARD_SCORES (Ranking)
**Colunas Principais**:
- `student_id` (FK): Aluno
- `week_start_date`: Início da semana
- `points`: Pontos totais
- `breakdown`: Detalhamento (JSONB)

---

### 💬 Módulo: Comunicação

#### CONVERSATIONS (Conversas)
**Colunas Principais**:
- `personal_id` (FK): Profissional
- `student_id` (FK): Aluno
- `last_message_at`: Última mensagem

---

#### CHAT_MESSAGES (Mensagens)
**Colunas Principais**:
- `conversation_id` (FK): Conversa
- `sender_id` (FK): Remetente
- `receiver_id` (FK): Destinatário
- `content`: Conteúdo
- `message_type`: `text`, `image`, `video`, `audio`
- `read_at`: Quando foi lida

---

### 📊 Módulo: Logs e Sessões

#### WORKOUT_SESSIONS (Sessões de Treino)
**Colunas Principais**:
- `workout_id` (FK): Treino
- `student_id` (FK): Aluno
- `started_at`: Início
- `completed_at`: Fim

---

#### WORKOUT_LOGS (Logs de Treino)
**Colunas Principais**:
- `student_id` (FK): Aluno
- `workout_id` (FK): Treino
- `completed_at`: Quando completou
- `feedback`: Feedback do aluno

---

#### DIET_LOGS (Logs de Dieta)
**Colunas Principais**:
- `student_id` (FK): Aluno
- `diet_plan_id` (FK): Plano
- `diet_meal_id` (FK): Refeição
- `logged_date`: Data
- `completed`: Se completou
- `actual_items`: Itens reais (JSONB)

---

#### PHYSICAL_ASSESSMENTS (Avaliações Físicas)
**Colunas Principais**:
- `student_id` (FK): Aluno
- `personal_id` (FK): Profissional
- `weight`, `height`
- `neck`, `shoulder`, `chest`, `waist`, `hips`, etc.
- `skinfold_*`: Dobras cutâneas
- `body_fat_percentage`, `bmi`, `bmr`, `tdee`

---

## ⚠️ PROBLEMA IDENTIFICADO: Sistema de Alunos Pendentes

### Fluxo Atual (PROBLEMÁTICO)

```
1. Profissional cria aluno
   ↓
2. Registro em STUDENTS (ID: UUID-A)
   ├─ invite_code: "ABC123"
   └─ personal_id: profissional
   ↓
3. Periodização criada
   ├─ pending_student_id: UUID-A ❌
   └─ student_id: NULL
   ↓
4. Aluno faz login com "ABC123"
   ↓
5. Novo registro em PROFILES (ID: UUID-B) ✅
   ├─ auth user criado
   └─ ID diferente de UUID-A!
   ↓
6. Aluno busca periodizações
   ├─ WHERE student_id = UUID-B
   └─ ❌ NADA ENCONTRADO (periodização tem UUID-A)
```

### Tabelas Afetadas

1. **periodizations**:
   - `pending_student_id` → `students.id` (legacy)
   - `student_id` → `profiles.id` (correto)

2. **diet_plans**:
   - `pending_student_id` → `students.id` (legacy)
   - `student_id` → `profiles.id` (correto)

3. **client_professional_relationships**:
   - `pending_client_id` → `students.id` (legacy)
   - `client_id` → `profiles.id` (correto)

---

## ✅ SOLUÇÃO PROPOSTA

### Fase 1: Criar Alunos com ID Fixo

1. **Função RPC**: `create_student_with_auth`
   - Cria auth user imediatamente
   - Cria registro em `profiles`
   - Cria link em `students_personals`
   - Retorna código de convite

2. **Fluxo Novo**:
```
1. Profissional cria aluno
   ↓
2. create_student_with_auth()
   ├─ Auth user (UUID-FIXO)
   ├─ Profile (UUID-FIXO)
   └─ students_personals link
   ↓
3. Periodização criada
   ├─ student_id: UUID-FIXO ✅
   └─ pending_student_id: NULL
   ↓
4. Aluno faz login
   ├─ Reconhece UUID-FIXO
   └─ ✅ Periodizações aparecem!
```

### Fase 2: Migrar Alunos Existentes

1. Para cada aluno em `students`:
   - Criar auth user
   - Criar profile
   - Atualizar `periodizations.student_id`
   - Atualizar `diet_plans.student_id`
   - Criar link em `students_personals`
   - Deletar registro em `students`

### Fase 3: Limpeza

1. Remover colunas `pending_student_id`
2. Remover tabela `students`
3. Simplificar RLS policies
4. Atualizar documentação

---

## 📊 Estatísticas do Banco

- **Total de Tabelas**: 40
- **Tabelas com FK para profiles**: 30+
- **Tabelas com FK para students (legacy)**: 3
- **Tabelas de logs/sessões**: 8
- **Tabelas de gamificação**: 4
- **Tabelas administrativas**: 5

---

## 🔗 Relacionamentos Críticos

### Aluno → Profissional
- `students_personals` (N:M)
- Permite múltiplos profissionais por aluno
- Permite múltiplos alunos por profissional

### Periodização → Treinos
```
periodizations (1)
  └─ training_plans (N)
      └─ workouts (N)
          └─ workout_items (N)
              └─ exercises (1)
```

### Dieta → Refeições
```
diet_plans (1)
  └─ diet_meals (N)
      └─ diet_meal_items (N)
          └─ foods (1)
```

---

## 🎯 Próximos Passos

1. ✅ Limpar links quebrados em `students_personals`
2. ⏳ Migrar alunos de `students` para `profiles`
3. ⏳ Testar criação de novo aluno
4. ⏳ Verificar se periodizações aparecem
5. ⏳ Remover colunas `pending_student_id`
6. ⏳ Deprecar tabela `students`
