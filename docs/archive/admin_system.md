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

Ver arquivo: [20241124_add_admin_role.sql](../packages/supabase/migrations/20241124_add_admin_role.sql)

### Principais Tabelas

1. **`profiles`** - Atualizada com:
   - `account_type` incluindo 'admin'
   - `is_super_admin` - Super admin não pode ser removido
   - `admin_notes` - Notas internas sobre usuários
   - `last_login_at` - Rastreamento de login

2. **`admin_audit_logs`** - Registro de todas as ações de admins
3. **`feature_flags`** - Controle de features em desenvolvimento
4. **`system_settings`** - Configurações globais da plataforma

---

## 🎨 Estrutura do Admin Panel

### Navegação Principal

```
/(admin)
  ├── Dashboard Principal
  ├── Gerenciamento de Usuários
  ├── Gerenciamento de Profissionais
  ├── Gerenciamento de Alunos
  ├── Gerenciamento de Conteúdo
  ├── Analytics Global
  ├── Configurações do Sistema
  ├── Suporte
  └── Audit Logs
```

### Principais Funcionalidades

#### 1. Dashboard
- Métricas em tempo real (usuários, receita, conversões)
- Gráficos de crescimento
- Alertas e notificações
- Atividades recentes

#### 2. Gerenciamento de Usuários
- Busca avançada e filtros
- Editar, banir, deletar usuários
- Ver detalhes completos
- **Impersonation** (fazer login como usuário)
- Alterar account_type
- Conceder/remover premium

#### 3. Gerenciamento de Conteúdo
- Aprovar/rejeitar exercícios
- Moderar alimentos
- Gerenciar reports de conteúdo

#### 4. Analytics Global
- DAU, MAU, Churn Rate
- MRR, ARR, ARPU
- Métricas de engajamento

#### 5. Configurações
- Feature flags (ligar/desligar features)
- Configurar planos e preços
- Modo de manutenção
- Configurações gerais

#### 6. Audit Logs
- Rastreamento completo de ações de admins
- Filtros por admin, tipo de ação, data
- Exportação de logs

---

## 🔒 Segurança

### Medidas de Segurança

1. **2FA Obrigatório** para administradores
2. **Audit Trail** - Todas as ações são registradas
3. **IP Whitelist** - Opcional para restringir acesso
4. **Session Timeout** - Sessões expiram mais rápido
5. **Confirmações** - Para ações destrutivas
6. **Soft Delete** - Preferir ao invés de deletar permanentemente

### Permissões (CASL)

```typescript
if (context.accountType === 'admin') {
  can('manage', 'all'); // Acesso total
  can('impersonate', 'User');
  can('delete', 'User');
  can('ban', 'User');
  
  // Exceção: Super admins não podem ser deletados
  if (!context.isSuperAdmin) {
    cannot('delete', 'User', { isSuperAdmin: true });
  }
}
```

---

## 🚀 Plano de Implementação

### Fase 1: Base (Semana 1)
- [x] Documentação completa
- [ ] Migration para adicionar `admin` ao account_type
- [ ] Atualizar abilities.ts com permissões de admin
- [ ] Criar RLS policies para admin
- [ ] Criar primeiro usuário admin manualmente
- [ ] Layout básico do admin panel

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

### Fase 4: Features Avançadas (Semana 4)
- [ ] Feature flags
- [ ] Configurações do sistema
- [ ] Suporte/tickets
- [ ] Impersonation
- [ ] Modo de manutenção

---

## 📚 Documentação Adicional

Para detalhes completos sobre cada tela, componentes, e especificações técnicas, consulte:
- [Admin System Design (Completo)](./admin_system_design_full.md)
- [Database Schema](./database-schema.md)
- [Access Control](./access_control.md)

---

## 🎯 Resumo

O sistema de administrador oferece:

✅ **Controle Total** - Acesso a todos os dados e funcionalidades
✅ **Segurança** - Audit logs, confirmações, proteções
✅ **Escalabilidade** - Feature flags e configurações dinâmicas
✅ **Analytics** - Visão completa de métricas
✅ **Suporte** - Ferramentas para ajudar usuários
✅ **Moderação** - Controle de qualidade da plataforma
