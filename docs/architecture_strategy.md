# Arquitetura Extensível e Estratégia de Produto - MeuPersonal

## 1. Princípios de Arquitetura Extensível

### 1.1. Design Orientado a Extensibilidade

**Objetivo:** Sistema preparado para crescer sem refatorações massivas.

#### Princípios SOLID Aplicados
- **Single Responsibility**: Cada módulo tem uma responsabilidade clara
- **Open/Closed**: Aberto para extensão, fechado para modificação
- **Liskov Substitution**: Interfaces consistentes entre implementações
- **Interface Segregation**: Interfaces específicas por contexto
- **Dependency Inversion**: Dependências de abstrações, não implementações

#### Padrões de Design
```typescript
// ❌ EVITAR: Lógica acoplada
if (user.role === 'personal') {
  // código específico
} else if (user.role === 'nutritionist') {
  // código específico
}

// ✅ PREFERIR: Strategy Pattern
interface ProfessionalStrategy {
  canCreateWorkout(): boolean;
  canCreateDiet(): boolean;
  getPermissions(): Permission[];
}

class PersonalTrainerStrategy implements ProfessionalStrategy {
  canCreateWorkout() { return true; }
  canCreateDiet() { return false; }
  // ...
}
```

### 1.2. Arquitetura em Camadas

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (Mobile App / Web Dashboard)       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         Application Layer           │
│  (Business Logic / Use Cases)       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│          Domain Layer               │
│  (Entities / Value Objects)         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Infrastructure Layer           │
│  (Supabase / APIs / Storage)        │
└─────────────────────────────────────┘
```

### 1.3. Estrutura de Pastas Escalável

```
src/
├── core/                    # Lógica de negócio pura
│   ├── entities/           # Modelos de domínio
│   ├── use-cases/          # Casos de uso
│   └── interfaces/         # Contratos
├── infrastructure/         # Implementações externas
│   ├── supabase/          # Cliente Supabase
│   ├── storage/           # Armazenamento local
│   └── notifications/     # Push notifications
├── application/           # Orquestração
│   ├── services/         # Serviços de aplicação
│   └── stores/           # Estado global (Zustand)
└── presentation/         # UI
    ├── components/       # Componentes reutilizáveis
    ├── screens/         # Telas
    └── hooks/           # Custom hooks
```

---

## 2. Modelo Freemium para Alunos Autônomos

### 2.1. Visão Geral

**Conceito:** Permitir que alunos **sem personal** usem o app de forma limitada.

### 2.2. Planos de Acesso

#### 🆓 Plano Gratuito (Aluno Solo)
**Público:** Alunos que querem treinar sozinhos

**Funcionalidades:**
- ✅ Criar treinos básicos (até 3 treinos)
- ✅ Biblioteca de exercícios limitada (50 exercícios)
- ✅ Registrar progresso de treino
- ✅ Gráficos básicos de evolução
- ❌ **NÃO** tem dieta personalizada
- ❌ **NÃO** tem acompanhamento profissional
- ❌ **NÃO** tem gamificação completa

**Limitações:**
- Máximo 3 treinos salvos
- Sem histórico completo (apenas 30 dias)
- Anúncios (banner ads)

---

#### 💎 Plano Premium (Aluno Solo)
**Preço:** R$ 19,90/mês

**Funcionalidades:**
- ✅ Treinos ilimitados
- ✅ Biblioteca completa de exercícios (1000+)
- ✅ Dieta básica (templates pré-definidos)
- ✅ Gamificação completa (metas, conquistas)
- ✅ Histórico completo
- ✅ Sem anúncios
- ✅ Exportar treinos (PDF)
- ❌ **NÃO** tem personal dedicado

---

#### 🏆 Plano com Personal
**Preço:** Gratuito para o aluno (Personal paga)

**Funcionalidades:**
- ✅ Tudo do Premium
- ✅ Treinos personalizados pelo Personal
- ✅ Dieta personalizada pelo Nutricionista
- ✅ Acompanhamento profissional
- ✅ Feedback em tempo real
- ✅ Ajustes de plano sob demanda

---

### 2.3. Monetização - Estratégias

#### Estratégia 1: Freemium com Ads
```
Aluno Gratuito → Vê anúncios → Upgrade para Premium (R$ 19,90)
```

#### Estratégia 2: Trial Premium
```
Aluno Gratuito → 7 dias Premium grátis → Conversão para pago
```

#### Estratégia 3: Marketplace de Profissionais
```
Aluno Premium → Busca Personal no app → Contrata (comissão 10-15%)
```

#### Estratégia 4: Conteúdo Exclusivo
```
Aluno Premium → Acesso a vídeos/artigos → Assinatura R$ 29,90
```

---

### 2.4. Estrutura de Dados (Freemium)

```typescript
interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium' | 'professional';
  status: 'active' | 'canceled' | 'expired';
  started_at: string;
  expires_at?: string;
  features: {
    max_workouts: number;        // 3 (free) | unlimited (premium)
    max_exercises: number;        // 50 (free) | unlimited (premium)
    has_diet: boolean;           // false (free) | true (premium)
    has_gamification: boolean;   // false (free) | true (premium)
    has_ads: boolean;            // true (free) | false (premium)
  };
}
```

---

## 3. Integração Web + Mobile

### 3.1. Arquitetura Multi-Plataforma

```
┌──────────────────────────────────────────────────────┐
│                   Supabase Backend                    │
│  (PostgreSQL + Auth + Storage + Realtime)            │
└──────────────────────────────────────────────────────┘
         ↓                                    ↓
┌─────────────────────┐          ┌─────────────────────┐
│   Mobile App        │          │   Web Dashboard     │
│   (React Native)    │          │   (Next.js)         │
│                     │          │                     │
│  - Aluno            │          │  - Professor        │
│  - Professor        │          │  - Admin            │
│  - Nutricionista    │          │  - Analytics        │
└─────────────────────┘          └─────────────────────┘
```

### 3.2. Vantagens da Integração Web

#### Para Profissionais
- ✅ Tela maior para criar treinos/dietas complexos
- ✅ Gestão de múltiplos alunos mais eficiente
- ✅ Relatórios e dashboards avançados
- ✅ Exportação em massa (Excel, PDF)
- ✅ Agendamento de consultas

#### Para Administração
- ✅ Painel de controle centralizado
- ✅ Gestão de assinaturas
- ✅ Suporte ao cliente
- ✅ Analytics e métricas
- ✅ Moderação de conteúdo

---

### 3.3. Stack Tecnológica Recomendada

#### Web Dashboard
```typescript
// Framework: Next.js 15 (App Router)
// UI: shadcn/ui + Tailwind CSS
// State: Zustand (mesmo do mobile)
// Database: Supabase (compartilhado)
// Auth: Supabase Auth (SSO entre web/mobile)

// Estrutura
web-dashboard/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── students/
│   │   ├── workouts/
│   │   ├── diets/
│   │   └── analytics/
│   └── api/
├── components/
├── lib/
│   └── supabase.ts  // Cliente compartilhado
└── stores/          // Stores compartilhadas
```

#### Mobile App (Atual)
```typescript
// Framework: React Native + Expo
// UI: NativeWind (Tailwind)
// State: Zustand
// Database: Supabase
// Auth: Supabase Auth
```

---

### 3.4. Sincronização em Tempo Real

```typescript
// Exemplo: Professor cria treino no web, aluno vê no mobile

// Web Dashboard
const { data } = await supabase
  .from('workouts')
  .insert({ student_id, name, exercises })
  .select();

// Mobile App (Realtime)
useEffect(() => {
  const channel = supabase
    .channel('workouts')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'workouts',
      filter: `student_id=eq.${studentId}`,
    }, (payload) => {
      // Atualiza UI instantaneamente
      addWorkout(payload.new);
      showNotification('Novo treino disponível!');
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [studentId]);
```

---

## 4. Roadmap de Implementação

### Fase 1: Fundação Extensível (2-3 semanas)
- [ ] Refatorar para arquitetura em camadas
- [ ] Implementar Strategy Pattern para roles
- [ ] Criar interfaces de domínio
- [ ] Documentar contratos de API

### Fase 2: Freemium Mobile (3-4 semanas)
- [ ] Implementar sistema de assinaturas
- [ ] Criar fluxo de upgrade (free → premium)
- [ ] Integrar ads (Google AdMob)
- [ ] Limitar funcionalidades por plano
- [ ] Tela de "Treinar Sozinho"

### Fase 3: Web Dashboard (4-6 semanas)
- [ ] Setup Next.js + Supabase
- [ ] Autenticação SSO (web ↔ mobile)
- [ ] CRUD de alunos/treinos/dietas
- [ ] Dashboard de analytics
- [ ] Exportação de relatórios

### Fase 4: Marketplace (6-8 semanas)
- [ ] Busca de profissionais
- [ ] Sistema de avaliações
- [ ] Pagamento integrado (Stripe/Mercado Pago)
- [ ] Comissionamento automático

---

## 5. Decisões Arquiteturais Críticas

### 5.1. Monorepo vs Multi-Repo

#### Opção A: Monorepo (RECOMENDADO)
```
meupersonal/
├── apps/
│   ├── mobile/          # React Native
│   └── web/             # Next.js
├── packages/
│   ├── core/            # Lógica compartilhada
│   ├── ui/              # Componentes compartilhados
│   └── supabase/        # Cliente compartilhado
└── package.json
```

**Vantagens:**
- ✅ Código compartilhado entre web/mobile
- ✅ Versionamento sincronizado
- ✅ Refatorações mais fáceis
- ✅ Tipos TypeScript compartilhados

**Ferramentas:** Turborepo ou Nx

---

#### Opção B: Multi-Repo
```
meupersonal-mobile/      # Repositório separado
meupersonal-web/         # Repositório separado
meupersonal-core/        # Biblioteca compartilhada (npm)
```

**Vantagens:**
- ✅ Deploys independentes
- ✅ Times separados
- ❌ Duplicação de código
- ❌ Sincronização manual

---

### 5.2. Backend: Supabase vs Backend Customizado

#### Opção A: Supabase (ATUAL - RECOMENDADO)
**Vantagens:**
- ✅ Desenvolvimento rápido
- ✅ Realtime out-of-the-box
- ✅ Auth + Storage integrados
- ✅ RLS para segurança
- ❌ Limitações em lógica complexa

**Quando usar:** MVP, validação de mercado, equipe pequena

---

#### Opção B: Backend Customizado (Futuro)
**Stack:** Node.js + NestJS + PostgreSQL

**Vantagens:**
- ✅ Controle total
- ✅ Lógica de negócio complexa
- ✅ Microserviços
- ❌ Mais tempo de desenvolvimento

**Quando usar:** Escala, lógica muito específica, compliance

---

### 5.3. Recomendação Estratégica

**Curto Prazo (6-12 meses):**
- ✅ Continuar com Supabase
- ✅ Implementar Monorepo (Turborepo)
- ✅ Lançar Web Dashboard
- ✅ Validar Freemium

**Médio Prazo (12-24 meses):**
- ✅ Avaliar migração para backend customizado
- ✅ Implementar Marketplace
- ✅ Expandir para B2B (academias)

---

## 6. Considerações Finais

### Princípios de Desenvolvimento
1. **Start Simple, Scale Smart**: Comece simples, escale com inteligência
2. **Mobile First, Web Second**: Priorize mobile, web é complemento
3. **Data-Driven Decisions**: Decisões baseadas em métricas
4. **User-Centric Design**: Usuário no centro de tudo

### Métricas de Sucesso
- **Freemium**: Taxa de conversão free → premium (meta: 5-10%)
- **Web**: Tempo de criação de treino (meta: -50% vs mobile)
- **Marketplace**: GMV (Gross Merchandise Value)
- **Retenção**: D7, D30 (meta: >40%, >20%)

### Riscos e Mitigações
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Complexidade arquitetural | Alto | Documentação + Code reviews |
| Fragmentação de código | Médio | Monorepo + Shared packages |
| Custos de infraestrutura | Médio | Monitoramento + Otimização |
| Canibalização (free vs paid) | Alto | Limites claros + Value proposition |
