# 🎯 Sistema de Gamificação e Melhoria de UX - MeuPersonal

## Visão Geral
Transformar o app de uma ferramenta passiva de consulta em uma experiência engajante que motiva o aluno a alcançar seus objetivos através de:
- Sistema de metas diárias e semanais
- Notificações de conquistas
- Visualização de progresso com gráficos
- Desafios e recompensas

---

## 1. Dashboard do Aluno (Tela Principal)

### Layout Proposto

```
┌─────────────────────────────────────┐
│  👋 Olá, João!                      │
│  Você está a 75% da meta semanal!   │
│                                      │
│  ┌─────────────────────────────┐   │
│  │  🔥 Sequência: 7 dias       │   │
│  │  ⭐ Nível: Iniciante        │   │
│  └─────────────────────────────┘   │
│                                      │
│  📊 HOJE                            │
│  ┌──────────┐  ┌──────────┐        │
│  │ Dieta    │  │ Treino   │        │
│  │ 3/4 ✓    │  │ 1/1 ✓    │        │
│  │ [████░]  │  │ [█████]  │        │
│  └──────────┘  └──────────┘        │
│                                      │
│  🎯 METAS DA SEMANA                 │
│  ┌─────────────────────────────┐   │
│  │ Refeições: 18/21 (85%)      │   │
│  │ [████████████████░░░]       │   │
│  │                              │   │
│  │ Treinos: 4/5 (80%)          │   │
│  │ [████████████████░░░]       │   │
│  └─────────────────────────────┘   │
│                                      │
│  🏆 CONQUISTAS RECENTES             │
│  ┌─────────────────────────────┐   │
│  │ 🥇 Primeira semana completa │   │
│  │ 💪 5 treinos seguidos       │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Elementos Visuais
- **Header Personalizado**: Saudação + progresso semanal em destaque
- **Cards de Status**: Dieta e Treino do dia com progresso visual
- **Barra de Progresso Animada**: Feedback visual imediato
- **Cores Dinâmicas**: 
  - Verde: Meta alcançada (100%)
  - Amarelo: Em progresso (50-99%)
  - Vermelho: Atrasado (<50%)

---

## 2. Sistema de Metas e Conquistas

### 🔗 Integração com Planos Ativos

**IMPORTANTE:** As metas são **calculadas automaticamente** com base nos planos ativos do aluno:

#### Metas de Dieta
- **Fonte**: Plano de dieta ativo (`diet_plans` com `status = 'active'`)
- **Cálculo diário**: Conta o número de refeições (`diet_meals`) agendadas para o dia da semana atual
- **Exemplo**: Se o plano tem 4 refeições na segunda-feira, a meta do dia é 4/4

#### Metas de Treino
- **Fonte**: Plano de treino ativo (`workout_plans` com `status = 'active'`)
- **Cálculo semanal**: Conta quantos treinos estão programados para a semana
- **Exemplo**: Se o plano tem treino Seg/Qua/Sex, a meta semanal é 3 treinos

#### Atualização Dinâmica
- Se o professor **atualizar** o plano (adicionar/remover refeições), as metas são **recalculadas automaticamente**
- Se o aluno **não tiver plano ativo**, as metas não são exibidas (estado vazio)
- Background sync garante que mudanças do professor sejam refletidas em até 15 minutos

### Estrutura de Dados

```typescript
interface DailyGoal {
  id: string;
  student_id: string;
  diet_plan_id?: string; // Referência ao plano ativo
  workout_plan_id?: string; // Referência ao plano ativo
  date: string; // YYYY-MM-DD
  meals_target: number; // Calculado do diet_plan
  meals_completed: number;
  workout_target: number; // Calculado do workout_plan
  workout_completed: number;
  water_target_ml?: number; // Opcional
  water_consumed_ml?: number;
  completed: boolean;
  completion_percentage: number;
}

interface WeeklyGoal {
  id: string;
  student_id: string;
  week_start: string;
  week_end: string;
  meals_target: number; // Ex: 21 refeições
  meals_completed: number;
  workouts_target: number; // Ex: 5 treinos
  workouts_completed: number;
  completion_percentage: number;
}

interface Achievement {
  id: string;
  student_id: string;
  type: 'streak' | 'milestone' | 'challenge';
  title: string;
  description: string;
  icon: string;
  earned_at: string;
  points?: number;
}

interface StudentStreak {
  id: string;
  student_id: string;
  current_streak: number; // Dias consecutivos
  longest_streak: number;
  last_activity_date: string;
}
```

### Tipos de Conquistas

1. **Sequências (Streaks)**
   - 🔥 3 dias seguidos
   - 🔥🔥 7 dias seguidos
   - 🔥🔥🔥 30 dias seguidos

2. **Marcos (Milestones)**
   - 🥇 Primeira semana completa
   - 💯 100% da meta semanal
   - 🎯 10 semanas consecutivas

3. **Desafios**
   - 💪 Semana perfeita (100% dieta + treino)
   - 🏋️ Mês do guerreiro (20 treinos)
   - 🥗 Nutrição impecável (7 dias 100%)

### 2.1 Mecânicas de Retenção (Novo)

#### 🔥 Sistema de Ofensiva (Duolingo Style)
- **Visual**: Ícone de fogo que muda de estado (aceso, apagando, congelado).
- **Congelamento de Ofensiva (Streak Freeze)**:
  - Permite "pular" um dia sem perder a sequência.
  - Pode ser ganho ao completar 7 dias perfeitos ou comprado com "pontos".
- **Recuperação**: Se perder a ofensiva, tem 24h para fazer um treino "hard" e recuperar.



---

## 3. Notificações Inteligentes

### Tipos de Notificações

#### 3.1 Notificações de Progresso Diário
```
🎉 Parabéns, João!
Meta do dia alcançada! 4/4 refeições ✓
Toque para ver seu progresso
```

#### 3.2 Notificações de Conquistas
```
🏆 Nova conquista desbloqueada!
Você completou 7 dias seguidos! 🔥
Continue assim!
```

#### 3.3 Notificações Motivacionais
```
💪 Falta pouco!
Você está a 1 refeição de bater a meta de hoje!
```

#### 3.4 Resumo Semanal
```
📊 Seu resumo da semana
85% das metas alcançadas!
Toque para ver os detalhes
```

### Implementação

```typescript
// src/services/achievementService.ts
export async function checkDailyGoalCompletion(studentId: string, date: string) {
  const goal = await getDailyGoal(studentId, date);
  
  if (goal.completion_percentage === 100 && !goal.completed) {
    // Marcar como completo
    await updateDailyGoal(goal.id, { completed: true });
    
    // Enviar notificação
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Parabéns!',
        body: `Meta do dia alcançada! ${goal.meals_completed}/${goal.meals_target} refeições ✓`,
        data: { type: 'daily_goal_complete', goalId: goal.id },
      },
      trigger: null, // Imediato
    });
    
    // Verificar streak
    await updateStreak(studentId);
  }
}
```

---

## 4. Tela de Progresso Detalhado

### Layout

```
┌─────────────────────────────────────┐
│  ← Seu Progresso                    │
│                                      │
│  📅 Semana 23/11 - 29/11            │
│                                      │
│  ┌─────────────────────────────┐   │
│  │   RESUMO SEMANAL             │   │
│  │                              │   │
│  │   85% das metas alcançadas   │   │
│  │   [████████████████░░░]      │   │
│  │                              │   │
│  │   📊 Gráfico de Barras       │   │
│  │   (Refeições por dia)        │   │
│  │   ┌─┐     ┌─┐                │   │
│  │   │█│ ┌─┐ │█│ ┌─┐            │   │
│  │   │█│ │█│ │█│ │█│            │   │
│  │   └─┘ └─┘ └─┘ └─┘            │   │
│  │   Seg Ter Qua Qui            │   │
│  └─────────────────────────────┘   │
│                                      │
│  ┌─────────────────────────────┐   │
│  │   TREINOS                    │   │
│  │                              │   │
│  │   4/5 treinos completos      │   │
│  │   [████████████████░░░]      │   │
│  │                              │   │
│  │   📈 Gráfico de Linha        │   │
│  │   (Frequência semanal)       │   │
│  └─────────────────────────────┘   │
│                                      │
│  🏆 CONQUISTAS DA SEMANA            │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 🔥   │ │ 💪   │ │ 🥇   │        │
│  │ 7    │ │ 5    │ │ 100% │        │
│  │ dias │ │treino│ │ meta │        │
│  └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘
```

### Bibliotecas Recomendadas
- **react-native-chart-kit**: Gráficos simples e bonitos
- **victory-native**: Gráficos mais avançados
- **react-native-svg**: Para gráficos customizados

---

## 5. Melhorias de Design (UI/UX)

### 5.1 Paleta de Cores

```typescript
// src/constants/Colors.ts
export const gamificationColors = {
  success: {
    primary: '#10B981', // Verde vibrante
    light: '#D1FAE5',
    dark: '#065F46',
  },
  warning: {
    primary: '#F59E0B', // Amarelo/Laranja
    light: '#FEF3C7',
    dark: '#92400E',
  },
  danger: {
    primary: '#EF4444', // Vermelho
    light: '#FEE2E2',
    dark: '#991B1B',
  },
  info: {
    primary: '#3B82F6', // Azul
    light: '#DBEAFE',
    dark: '#1E3A8A',
  },
  achievement: {
    gold: '#F59E0B',
    silver: '#9CA3AF',
    bronze: '#CD7F32',
  },
};
```

### 5.2 Componentes Reutilizáveis

#### ProgressCard
```tsx
<ProgressCard
  title="Dieta de Hoje"
  current={3}
  target={4}
  icon="🍽️"
  color="success"
/>
```

#### AchievementBadge
```tsx
<AchievementBadge
  icon="🔥"
  title="7 dias"
  subtitle="Sequência"
  earned={true}
/>
```

#### StatCard
```tsx
<StatCard
  value="85%"
  label="Meta Semanal"
  trend="up"
  change="+5%"
/>
```

---

## 6. Animações e Feedback

### Micro-interações
- ✅ Animação de "check" ao completar refeição
- 🎉 Confete ao alcançar meta
- 📈 Gráficos animados ao carregar
- 🔥 Ícone de fogo pulsando na sequência

### Haptic Feedback
```typescript
import * as Haptics from 'expo-haptics';

// Ao completar meta
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Ao desbloquear conquista
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
```

---

## 7. Implementação Técnica

### Estrutura de Pastas
```
src/
├── components/
│   ├── gamification/
│   │   ├── ProgressCard.tsx
│   │   ├── AchievementBadge.tsx
│   │   ├── StreakCounter.tsx
│   │   ├── GoalChart.tsx
│   │   └── StatCard.tsx
├── services/
│   ├── achievementService.ts
│   ├── goalService.ts
│   └── streakService.ts
├── store/
│   └── gamificationStore.ts
└── app/
    └── (tabs)/
        ├── index.tsx (Dashboard)
        └── progress.tsx (Progresso Detalhado)
```

### Banco de Dados (Supabase)

```sql
-- Tabela de metas diárias
CREATE TABLE daily_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  meals_target INT DEFAULT 4,
  meals_completed INT DEFAULT 0,
  workout_target INT DEFAULT 1,
  workout_completed INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completion_percentage INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Tabela de conquistas
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL, -- 'streak', 'milestone', 'challenge'
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  points INT DEFAULT 0
);

-- Tabela de sequências
CREATE TABLE student_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) UNIQUE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Roadmap de Implementação

### Fase 1: Fundação (1-2 semanas)
- [ ] Criar tabelas no banco de dados
- [ ] Implementar `goalService` e `achievementService`
- [ ] Criar componentes base (ProgressCard, StatCard)
- [ ] Redesenhar dashboard do aluno

### Fase 2: Gamificação (1-2 semanas)
- [ ] Sistema de metas diárias/semanais
- [ ] Sistema de conquistas
- [ ] Notificações de progresso
- [ ] Tela de progresso detalhado

### Fase 3: Visualização (1 semana)
- [ ] Integrar biblioteca de gráficos
- [ ] Criar gráficos de progresso
- [ ] Animações e micro-interações
- [ ] Haptic feedback

### Fase 4: Polimento (1 semana)
- [ ] Testes com usuários
- [ ] Ajustes de UX
- [ ] Otimização de performance
- [ ] Documentação

---

## 9. Exemplos de Telas

### Tela de Conquista Desbloqueada
```
┌─────────────────────────────────────┐
│                                      │
│          🎉 🎉 🎉                    │
│                                      │
│      Nova Conquista!                │
│                                      │
│         ┌─────────┐                 │
│         │   🔥    │                 │
│         │         │                 │
│         │ 7 DIAS  │                 │
│         └─────────┘                 │
│                                      │
│   Sequência de 7 dias!              │
│   Continue assim! 💪                │
│                                      │
│   [   Compartilhar   ]              │
│   [    Continuar     ]              │
│                                      │
└─────────────────────────────────────┘
```

### Notificação de Resumo Semanal
```
┌─────────────────────────────────────┐
│  📊 Seu Resumo da Semana            │
│                                      │
│  ┌─────────────────────────────┐   │
│  │  85% das metas alcançadas!  │   │
│  │  [████████████████░░░]      │   │
│  └─────────────────────────────┘   │
│                                      │
│  ✅ 18/21 refeições                 │
│  ✅ 4/5 treinos                     │
│  🔥 7 dias de sequência             │
│                                      │
│  🏆 2 novas conquistas              │
│                                      │
│  Continue assim! Você está          │
│  cada vez mais perto do seu         │
│  objetivo! 💪                       │
│                                      │
│  [  Ver Detalhes  ]                 │
└─────────────────────────────────────┘
```

---

## 10. Considerações Finais

### Benefícios Esperados
- ✅ Maior engajamento do aluno
- ✅ Aumento na adesão ao plano
- ✅ Feedback visual constante
- ✅ Motivação através de conquistas
- ✅ Senso de progresso e evolução

### Métricas de Sucesso
- Taxa de conclusão de metas diárias
- Tempo médio de uso do app
- Frequência de abertura do app
- Taxa de retenção de usuários
- NPS (Net Promoter Score)
