# Arquitetura e Stack Tecnológica - MeuPersonal

## 1. Stack Tecnológica (Decisão Final)

| Camada | Tecnologia | Justificativa |
| --- | --- | --- |
| **Mobile** | **React Native + Expo** | Desenvolvimento ágil, cross-platform (iOS/Android), ecossistema maduro. Uso do **Expo Router** para navegação file-based. |
| **Linguagem** | **TypeScript** | Segurança de tipos, essencial para manutenção e escalabilidade. |
| **Estado Global** | **Zustand** | Simples, leve e sem boilerplate excessivo (vs Redux). |
| **Persistência Local** | **React Native MMKV** | Armazenamento chave-valor de altíssima performance para cache offline e tokens. |
| **Backend / BaaS** | **Supabase** | PostgreSQL gerenciado, Autenticação, Storage e Edge Functions. Substituto open-source do Firebase. |
| **ORM** | **Drizzle ORM** | Leve, type-safe e performático. Facilita migrações e queries SQL. |
| **Pagamentos** | **Stripe** (Cartão) + **Asaas** (PIX/Boleto) | Melhor combinação para SaaS no Brasil. |
| **Analytics/Logs** | **PostHog** + **Sentry** | Monitoramento de erros e comportamento do usuário. |

## 2. Estrutura do Projeto - Monorepo (Turborepo)

O projeto utiliza arquitetura **Monorepo** com **Turborepo** para compartilhar código entre aplicações:

```
meupersonal.app/
├── apps/
│   ├── mobile/                    # Aplicativo React Native + Expo
│   │   ├── app/                   # Rotas (Expo Router)
│   │   │   ├── (auth)/           # Autenticação
│   │   │   │   ├── login.tsx
│   │   │   │   └── register.tsx
│   │   │   ├── (tabs)/           # Navegação principal
│   │   │   │   ├── index.tsx     # Dashboard
│   │   │   │   ├── students.tsx  # Alunos
│   │   │   │   ├── workouts.tsx  # Treinos
│   │   │   │   └── profile.tsx   # Perfil
│   │   │   └── _layout.tsx
│   │   ├── src/
│   │   │   ├── components/       # Componentes UI
│   │   │   ├── hooks/            # Custom Hooks
│   │   │   ├── store/            # Zustand stores
│   │   │   └── utils/            # Utilitários
│   │   └── package.json
│   └── web/                       # Dashboard Web (Next.js - futuro)
├── packages/
│   ├── config/                    # Configurações TypeScript compartilhadas
│   │   └── tsconfig/
│   │       └── base.json
│   ├── core/                      # Lógica de negócio compartilhada
│   │   └── src/
│   │       └── index.ts
│   └── supabase/                  # Cliente Supabase + CASL
│       └── src/
│           ├── abilities.ts       # Controle de acesso (CASL)
│           ├── client.ts          # Cliente Supabase
│           ├── types.ts           # Tipos TypeScript
│           └── index.ts
├── docs/                          # Documentação
├── turbo.json                     # Configuração Turborepo
├── pnpm-workspace.yaml            # Workspace pnpm
└── package.json
```

## 2.1. Packages Compartilhados

### `@meupersonal/config`
**Propósito:** Configurações TypeScript compartilhadas entre todos os apps e packages.

**Conteúdo:**
- `tsconfig/base.json` - Configuração base do TypeScript

**Uso:**
```json
// Em apps/mobile/tsconfig.json
{
  "extends": "@meupersonal/config/tsconfig/base.json"
}
```

### `@meupersonal/core`
**Propósito:** Lógica de negócio e tipos compartilhados entre mobile e web.

**Conteúdo:**
- Tipos TypeScript comuns
- Funções utilitárias de negócio
- Validações compartilhadas

**Uso:**
```typescript
import { type User } from '@meupersonal/core';
```

### `@meupersonal/supabase`
**Propósito:** Cliente Supabase e controle de acesso (CASL) centralizados.

**Conteúdo:**
- `client.ts` - Cliente Supabase configurado
- `abilities.ts` - Definições de permissões CASL
- `types.ts` - Tipos do banco de dados

**Uso:**
```typescript
import { supabase, defineAbilitiesFor } from '@meupersonal/supabase';

const ability = defineAbilitiesFor('personal');
if (ability.can('create', 'Workout')) {
  // Criar treino
}
```

## 3. Modelo de Dados (Esboço do Schema)

### Tabela: `profiles`
- `id` (uuid, PK, ref auth.users)
- `email` (text)
- `full_name` (text)
- `role` (enum: 'personal', 'student')
- `avatar_url` (text)
- `created_at` (timestamp)

### Tabela: `subscriptions` (Apenas Personais)
- `id` (uuid, PK)
- `user_id` (uuid, FK profiles)
- `status` (active, past_due, canceled)
- `plan_id` (text)
- `current_period_end` (timestamp)

### Tabela: `students_personals` (Relacionamento)
- `id` (uuid, PK)
- `personal_id` (uuid, FK profiles)
- `student_id` (uuid, FK profiles)
- `status` (active, pending, inactive)

### Tabela: `workouts`
- `id` (uuid, PK)
- `creator_id` (uuid, FK profiles - Personal)
- `student_id` (uuid, FK profiles - Aluno, nullable se for template)
- `title` (text)
- `description` (text)
- `scheduled_date` (date, nullable)

## 4. Controle de Acesso (CASL)

O sistema utiliza **CASL (Ability)** para controle de acesso baseado em permissões.

### Localização
`packages/supabase/src/abilities.ts`

### Roles Implementados

| Role | Permissões |
|------|------------|
| **personal** | manage Student/Workout/Exercise<br>read Diet/Analytics<br>update Profile |
| **nutritionist** | manage Student/Diet<br>read Workout/Analytics<br>update Profile |
| **student** | read Workout/Diet/Exercise/Profile<br>update Profile |

### Exemplo de Uso

```typescript
import { defineAbilitiesFor } from '@meupersonal/supabase';

const ability = defineAbilitiesFor(user.role);

// Verificar permissão
if (ability.can('create', 'Workout')) {
  // Mostrar botão "Criar Treino"
}

// Ocultar elementos baseado em permissão
{ability.can('manage', 'Diet') && (
  <Button>Criar Dieta</Button>
)}
```

### Integração com RLS
CASL trabalha em conjunto com **Row Level Security (RLS)** do Supabase:
- **CASL**: Controle no frontend (UI/UX)
- **RLS**: Segurança no backend (banco de dados)

**Documentação completa:** Ver `docs/access_control.md` e `docs/CASL_GUIDE.md`

## 4.1. Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App / Web                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   UI Layer   │  │  CASL Check  │  │ Zustand Store│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────────────┴─────────────────┘           │
│                           │                             │
│                  ┌────────▼────────┐                    │
│                  │ TanStack Query  │                    │
│                  └────────┬────────┘                    │
└───────────────────────────┼─────────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │ @meupersonal/     │
                  │ supabase client   │
                  └─────────┬─────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                    Supabase Backend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     RLS      │  │  PostgreSQL  │  │   Storage    │  │
│  │   Policies   │  │   Database   │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Camadas:**
1. **App** consome dados via `@meupersonal/supabase`
2. **CASL** verifica permissões antes de ações (frontend)
3. **TanStack Query** gerencia fetch, cache e sincronização
4. **Zustand** armazena estado global (auth, tema, UI)
5. **RLS** garante segurança no banco de dados (backend)

### Separação de Responsabilidades
- **TanStack Query**: Estado do servidor (cache, sincronização, loading/error states)
- **Zustand**: Estado global da aplicação (auth, theme, UI state)
- **CASL**: Controle de acesso e permissões
- **useState**: Estado local do componente

## 5. Estilização
- **Tailwind CSS (NativeWind)**: Sistema de design baseado em utilitários
- **NUNCA** use `StyleSheet` ou estilos inline com objetos JavaScript
- Sempre use classes Tailwind com `className`
- Use tokens de cores do design system definidos em `tailwind.config.js`
- Consulte `docs/best_practices.md` para diretrizes completas

## 6. Segurança (RLS)
- Todas as tabelas terão RLS (Row Level Security) ativado.
- *Policy*: `profiles` podem ser lidos por qualquer usuário autenticado (leitura pública básica) ou restrito.
- *Policy*: `workouts` só podem ser criados por `role = personal`.
- *Policy*: `workouts` só podem ser lidos pelo `creator_id` ou `student_id`.

## 7. Documentação de Referência
- **Arquitetura Monorepo**: `docs/MONOREPO.md`
- **Controle de Acesso**: `docs/access_control.md`
- **Guia CASL**: `docs/CASL_GUIDE.md`
- **Boas Práticas**: `docs/best_practices.md`
- **Regras de Negócio**: `docs/business_rules.md`
- **Avaliação TanStack Query**: `docs/tanstack_query_evaluation.md`
- **Guia de Migração**: `docs/migration_guide.md`
