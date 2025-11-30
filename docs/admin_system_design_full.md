# Sistema de Administrador - MeuPersonal

## 📋 Visão Geral

O sistema de administrador permitirá que usuários com privilégios elevados gerenciem toda a plataforma, incluindo usuários, conteúdo, analytics, e configurações do sistema.

---

## 🎯 Objetivos

1. **Controle Total**: Administradores têm acesso a todas as informações e funcionalidades
2. **Gestão de Usuários**: Gerenciar profissionais, alunos e outros administradores
3. **Moderação de Conteúdo**: Revisar e moderar exercícios, alimentos, planos
4. **Analytics Global**: Visualizar métricas e estatísticas da plataforma
5. **Configurações**: Gerenciar configurações globais, features flags, e pricing
6. **Suporte**: Ferramentas para dar suporte aos usuários

---

## 🔐 Estrutura de Roles (Atualizada)

### Account Types

```typescript
type AccountType = 
  | 'admin'                 // 🆕 Administrador do sistema
  | 'professional'          // Profissional (Personal, Nutricionista)
  | 'managed_student'       // Aluno gerenciado por profissional
  | 'autonomous_student';   // Aluno autônomo (freemium/premium)
```

### Hierarquia de Permissões

```
┌─────────────────────────────────────────┐
│           ADMIN (Super User)            │
│  - Acesso total ao sistema              │
│  - Gerencia todos os usuários           │
│  - Configura plataforma                 │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐      ┌────────────────┐
│  PROFESSIONAL │      │ AUTONOMOUS     │
│               │      │ STUDENT        │
│ - Gerencia    │      │ - Self-service │
│   alunos      │      │ - Subscription │
└───────────────┘      └────────────────┘
        │
        ▼
┌───────────────┐
│  MANAGED      │
│  STUDENT      │
│ - Read-only   │
└───────────────┘
```

---

## 🗄️ Alterações no Banco de Dados

### 1. Atualizar ENUM `account_type`

```sql
-- Migration: 20241124_add_admin_role.sql

-- Adicionar 'admin' ao enum account_type
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'admin';

-- Adicionar coluna para identificar super admin
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NULL;

-- Criar índice para admins
CREATE INDEX IF NOT EXISTS idx_profiles_admin 
  ON profiles(account_type) 
  WHERE account_type = 'admin';

-- Comentários
COMMENT ON COLUMN profiles.is_super_admin IS 'Super admin com acesso irrestrito (não pode ser removido)';
COMMENT ON COLUMN profiles.admin_notes IS 'Notas internas sobre o usuário (visível apenas para admins)';
```

### 2. Tabela de Audit Logs

```sql
-- Tabela para rastrear ações de administradores
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'user_update', 'content_delete', 'config_change', etc.
  target_type TEXT, -- 'user', 'workout', 'diet', 'config', etc.
  target_id UUID,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action_type);

COMMENT ON TABLE admin_audit_logs IS 'Registro de todas as ações realizadas por administradores';
```

### 3. Tabela de Feature Flags

```sql
-- Tabela para controlar features em desenvolvimento
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_key TEXT UNIQUE NOT NULL,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_account_types account_type[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled) WHERE is_enabled = true;

COMMENT ON TABLE feature_flags IS 'Feature flags para controle de funcionalidades em desenvolvimento';
```

### 4. Tabela de Configurações Globais

```sql
-- Configurações globais da plataforma
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- Seed de configurações iniciais
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('maintenance_mode', '{"enabled": false, "message": ""}', 'Modo de manutenção'),
  ('registration_enabled', '{"enabled": true}', 'Permitir novos cadastros'),
  ('max_students_per_professional', '{"limit": 100}', 'Limite de alunos por profissional'),
  ('subscription_prices', '{"basic": 29.90, "premium": 49.90}', 'Preços das assinaturas');
```

---

## 🎨 Telas do Admin Panel

### 📱 Estrutura de Navegação

```
/(admin)
  ├── _layout.tsx              # Layout principal com sidebar
  ├── index.tsx                # Dashboard principal
  ├── users/
  │   ├── index.tsx            # Lista de usuários
  │   ├── [id].tsx             # Detalhes do usuário
  │   └── create.tsx           # Criar novo usuário
  ├── professionals/
  │   ├── index.tsx            # Lista de profissionais
  │   ├── [id].tsx             # Detalhes do profissional
  │   └── analytics.tsx        # Analytics de profissionais
  ├── students/
  │   ├── index.tsx            # Lista de alunos
  │   ├── [id].tsx             # Detalhes do aluno
  │   └── analytics.tsx        # Analytics de alunos
  ├── content/
  │   ├── exercises/
  │   │   ├── index.tsx        # Gerenciar exercícios
  │   │   ├── [id].tsx         # Editar exercício
  │   │   └── pending.tsx      # Exercícios pendentes de aprovação
  │   ├── foods/
  │   │   ├── index.tsx        # Gerenciar alimentos
  │   │   └── [id].tsx         # Editar alimento
  │   └── reports.tsx          # Conteúdo reportado
  ├── analytics/
  │   ├── index.tsx            # Dashboard de analytics
  │   ├── users.tsx            # Métricas de usuários
  │   ├── engagement.tsx       # Métricas de engajamento
  │   └── revenue.tsx          # Métricas de receita
  ├── settings/
  │   ├── index.tsx            # Configurações gerais
  │   ├── features.tsx         # Feature flags
  │   ├── subscriptions.tsx    # Configurar planos
  │   └── maintenance.tsx      # Modo de manutenção
  ├── support/
  │   ├── tickets.tsx          # Tickets de suporte
  │   └── [id].tsx             # Detalhes do ticket
  └── audit/
      └── logs.tsx             # Logs de auditoria
```

---

## 📊 Detalhamento das Telas

### 1. Dashboard Principal (`/(admin)/index.tsx`)

**Objetivo**: Visão geral do sistema em tempo real

**Componentes**:
- 📈 **Métricas Principais** (Cards)
  - Total de usuários (com crescimento %)
  - Usuários ativos (últimos 7 dias)
  - Receita mensal (MRR)
  - Taxa de conversão (free → paid)
  
- 📊 **Gráficos**
  - Crescimento de usuários (linha do tempo)
  - Distribuição por account_type (pizza)
  - Receita por subscription_tier (barras)
  
- 🚨 **Alertas e Notificações**
  - Conteúdo reportado pendente
  - Tickets de suporte não resolvidos
  - Erros críticos do sistema
  
- 📋 **Atividades Recentes**
  - Últimos cadastros
  - Últimas assinaturas
  - Últimas ações de admin

**Exemplo de Layout**:
```
┌─────────────────────────────────────────────────┐
│  📊 Dashboard Admin                             │
├─────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ 1.2K │  │ 850  │  │ R$   │  │ 12%  │       │
│  │Users │  │Active│  │45.2K │  │Conv. │       │
│  └──────┘  └──────┘  └──────┘  └──────┘       │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐     │
│  │ User Growth     │  │ Revenue Chart   │     │
│  │ [Line Chart]    │  │ [Bar Chart]     │     │
│  └─────────────────┘  └─────────────────┘     │
│                                                  │
│  🚨 Alerts                                      │
│  • 5 pending content reports                   │
│  • 12 open support tickets                     │
│                                                  │
│  📋 Recent Activity                             │
│  • João Silva registered as professional       │
│  • Maria Santos upgraded to premium            │
└─────────────────────────────────────────────────┘
```

---

### 2. Gerenciamento de Usuários (`/(admin)/users/`)

#### 2.1 Lista de Usuários (`index.tsx`)

**Funcionalidades**:
- 🔍 **Busca e Filtros**
  - Por nome, email, ID
  - Por account_type
  - Por subscription_tier
  - Por status (ativo, inativo, banido)
  - Por data de cadastro
  
- 📊 **Tabela de Usuários**
  - Avatar + Nome
  - Email
  - Account Type (badge colorido)
  - Subscription Tier
  - Data de cadastro
  - Último login
  - Status
  - Ações rápidas (ver, editar, banir)
  
- ⚡ **Ações em Massa**
  - Exportar para CSV
  - Enviar email em massa
  - Banir múltiplos usuários

**Layout**:
```
┌─────────────────────────────────────────────────┐
│  👥 Users Management                            │
├─────────────────────────────────────────────────┤
│  [Search] [Type▼] [Tier▼] [Status▼] [+ New]   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Avatar │ Name    │ Type  │ Tier │ Actions│  │
│  ├─────────────────────────────────────────┤   │
│  │ 👤     │ João    │ 🔧Pro │ -    │ ⋮      │  │
│  │ 👤     │ Maria   │ 🎓Stu │ 💎Pre│ ⋮      │  │
│  │ 👤     │ Pedro   │ 🎓Stu │ Free │ ⋮      │  │
│  └─────────────────────────────────────────┘   │
│  Showing 1-20 of 1,234 users                    │
└─────────────────────────────────────────────────┘
```

#### 2.2 Detalhes do Usuário (`[id].tsx`)

**Seções**:

1. **Informações Básicas**
   - Avatar (editável)
   - Nome completo
   - Email
   - Telefone
   - Data de nascimento
   - Account type (editável por admin)
   
2. **Status e Segurança**
   - Status da conta (ativo, suspenso, banido)
   - Email verificado?
   - Último login
   - IP do último login
   - Tentativas de login falhadas
   - Botão: "Resetar senha"
   - Botão: "Banir usuário"
   
3. **Subscription** (se autonomous_student)
   - Tier atual
   - Status (ativa, vencida, cancelada)
   - Data de renovação
   - Histórico de pagamentos
   - Botão: "Conceder premium grátis"
   
4. **Relacionamentos** (se managed_student ou professional)
   - Lista de profissionais vinculados (se aluno)
   - Lista de alunos (se profissional)
   - Status de cada relacionamento
   
5. **Atividade**
   - Treinos criados/atribuídos
   - Dietas criadas/atribuídas
   - Último acesso ao app
   - Features mais usadas
   
6. **Admin Notes**
   - Campo de texto para notas internas
   - Histórico de ações de admin neste usuário
   
7. **Ações de Admin**
   - Editar informações
   - Alterar account type
   - Conceder/remover premium
   - Suspender conta
   - Banir permanentemente
   - Deletar conta (com confirmação)
   - Fazer login como usuário (impersonation)

---

### 3. Gerenciamento de Profissionais (`/(admin)/professionals/`)

**Funcionalidades Específicas**:
- Ver todos os profissionais
- Verificar certificações (CREF, CRN)
- Aprovar/rejeitar profissionais
- Ver quantidade de alunos por profissional
- Analytics de performance
- Limitar número de alunos

**Métricas**:
- Total de profissionais ativos
- Média de alunos por profissional
- Profissionais mais ativos
- Taxa de retenção de alunos

---

### 4. Gerenciamento de Conteúdo (`/(admin)/content/`)

#### 4.1 Exercícios

**Funcionalidades**:
- Aprovar exercícios criados por profissionais
- Editar exercícios existentes
- Criar exercícios oficiais
- Marcar exercícios como "verificados"
- Deletar exercícios inapropriados
- Categorizar exercícios

**Campos de Exercício**:
- Nome
- Descrição
- Categoria (peito, costas, pernas, etc.)
- Dificuldade
- Equipamento necessário
- Vídeo/GIF demonstrativo
- Criado por (profissional)
- Status (pendente, aprovado, rejeitado)

#### 4.2 Alimentos

**Funcionalidades**:
- Aprovar alimentos customizados
- Editar informações nutricionais
- Criar alimentos oficiais
- Deletar alimentos duplicados/incorretos

#### 4.3 Conteúdo Reportado

**Funcionalidades**:
- Ver lista de reports
- Filtrar por tipo (exercício, alimento, usuário)
- Tomar ação (aprovar, deletar, banir criador)
- Enviar feedback ao reportador

---

### 5. Analytics Global (`/(admin)/analytics/`)

#### 5.1 Métricas de Usuários

**Gráficos**:
- Crescimento de usuários (diário, semanal, mensal)
- Distribuição geográfica
- Distribuição por account_type
- Taxa de churn
- Lifetime Value (LTV)

#### 5.2 Métricas de Engajamento

**Métricas**:
- DAU (Daily Active Users)
- MAU (Monthly Active Users)
- Session duration média
- Features mais usadas
- Taxa de retenção (D1, D7, D30)

#### 5.3 Métricas de Receita

**Métricas**:
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- ARPU (Average Revenue Per User)
- Taxa de conversão (free → paid)
- Churn rate
- Receita por subscription tier

---

### 6. Configurações do Sistema (`/(admin)/settings/`)

#### 6.1 Configurações Gerais

**Opções**:
- Nome da plataforma
- Logo
- Cores do tema
- Permitir novos cadastros
- Modo de manutenção
- Mensagem de manutenção

#### 6.2 Feature Flags

**Funcionalidades**:
- Listar todas as features
- Habilitar/desabilitar features
- Rollout gradual (0-100%)
- Target por account_type
- Histórico de mudanças

**Exemplo de Features**:
- `new_dashboard_ui` - Novo design do dashboard
- `ai_workout_generator` - Gerador de treinos com IA
- `social_feed` - Feed social
- `challenges` - Desafios e competições

#### 6.3 Planos e Preços

**Configurações**:
- Preço do plano Basic
- Preço do plano Premium
- Período de trial
- Features por tier
- Limites por tier

#### 6.4 Modo de Manutenção

**Funcionalidades**:
- Ativar/desativar manutenção
- Mensagem customizada
- Whitelist de IPs (admins podem acessar)
- Agendar manutenção

---

### 7. Suporte (`/(admin)/support/`)

**Funcionalidades**:
- Ver tickets de suporte
- Responder tickets
- Atribuir tickets a admins
- Marcar como resolvido
- Ver histórico de conversas
- Buscar por usuário

**Status de Tickets**:
- Aberto
- Em progresso
- Aguardando usuário
- Resolvido
- Fechado

---

### 8. Audit Logs (`/(admin)/audit/logs.tsx`)

**Funcionalidades**:
- Ver todas as ações de administradores
- Filtrar por admin
- Filtrar por tipo de ação
- Filtrar por data
- Exportar logs

**Informações Registradas**:
- Quem fez a ação
- O que foi feito
- Quando foi feito
- IP e User Agent
- Dados antes/depois (diff)

---

## 🔒 Permissões e Segurança

### Abilities para Admin

```typescript
// packages/supabase/src/abilities.ts

export function defineAbilitiesFor(context: UserContext): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  // === ADMIN (SUPER USER) ===
  if (context.accountType === 'admin') {
    can('manage', 'all'); // Acesso total a tudo
    
    // Abilities específicas de admin
    can('manage', 'User');
    can('manage', 'AdminPanel');
    can('manage', 'SystemSettings');
    can('manage', 'FeatureFlags');
    can('manage', 'AuditLogs');
    can('impersonate', 'User'); // Login como outro usuário
    can('delete', 'User');
    can('ban', 'User');
    
    // Exceção: Super admins não podem ser deletados
    if (!context.isSuperAdmin) {
      cannot('delete', 'User', { isSuperAdmin: true });
    }
  }
  
  // ... resto das permissões
}
```

### RLS Policies para Admin

```sql
-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- Admins podem atualizar qualquer perfil
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- Admins podem deletar usuários (exceto super admins)
CREATE POLICY "Admins can delete users"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
    AND NOT is_super_admin
  );
```

---

## 🎨 Design System para Admin Panel

### Cores

```typescript
const adminTheme = {
  primary: '#6366F1',      // Indigo
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Amber
  danger: '#EF4444',       // Red
  info: '#3B82F6',         // Blue
  
  // Account Type Colors
  admin: '#8B5CF6',        // Purple
  professional: '#F59E0B', // Orange
  managed: '#3B82F6',      // Blue
  autonomous: '#10B981',   // Green
};
```

### Componentes Específicos

1. **StatCard** - Cards de métricas
2. **UserTable** - Tabela de usuários com ações
3. **ActivityFeed** - Feed de atividades recentes
4. **ConfirmDialog** - Confirmação para ações destrutivas
5. **ImpersonationBanner** - Banner quando admin está como outro usuário
6. **AdminSidebar** - Navegação lateral do admin panel

---

## 🚀 Implementação Sugerida

### Fase 1: Base (Semana 1)
- [ ] Migration para adicionar `admin` ao account_type
- [ ] Atualizar abilities.ts com permissões de admin
- [ ] Criar RLS policies para admin
- [ ] Criar primeiro usuário admin manualmente no DB
- [ ] Criar layout básico do admin panel

### Fase 2: Dashboard e Usuários (Semana 2)
- [ ] Dashboard principal com métricas
- [ ] Lista de usuários
- [ ] Detalhes do usuário
- [ ] Ações básicas (editar, banir, deletar)

### Fase 3: Conteúdo e Analytics (Semana 3)
- [ ] Gerenciamento de exercícios
- [ ] Gerenciamento de alimentos
- [ ] Analytics básico
- [ ] Audit logs

### Fase 4: Configurações e Features Avançadas (Semana 4)
- [ ] Feature flags
- [ ] Configurações do sistema
- [ ] Suporte/tickets
- [ ] Impersonation
- [ ] Modo de manutenção

---

## 📝 Notas Importantes

### Segurança

1. **Autenticação Forte**: Admins devem usar 2FA obrigatório
2. **Audit Trail**: Todas as ações devem ser logadas
3. **IP Whitelist**: Opção de restringir acesso admin por IP
4. **Session Timeout**: Sessões de admin expiram mais rápido
5. **Impersonation Tracking**: Logar quando admin faz login como outro usuário

### Boas Práticas

1. **Confirmações**: Sempre pedir confirmação para ações destrutivas
2. **Reversibilidade**: Preferir "soft delete" ao invés de deletar permanentemente
3. **Notificações**: Notificar usuários quando admin altera sua conta
4. **Transparência**: Manter logs visíveis e auditáveis

### Próximos Passos

1. Revisar e aprovar este design
2. Criar migration para adicionar role de admin
3. Implementar abilities e RLS policies
4. Criar primeiro admin manualmente
5. Desenvolver telas do admin panel progressivamente

---

## 🎯 Resumo Executivo

O sistema de administrador proposto oferece:

✅ **Controle Total**: Acesso a todos os dados e funcionalidades
✅ **Segurança**: Audit logs, confirmações, e proteções contra ações acidentais
✅ **Escalabilidade**: Feature flags e configurações dinâmicas
✅ **Analytics**: Visão completa de métricas e performance
✅ **Suporte**: Ferramentas para ajudar usuários eficientemente
✅ **Moderação**: Controle de conteúdo e qualidade da plataforma

Este sistema permitirá gerenciar o MeuPersonal de forma profissional e escalável! 🚀
