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

## 2. Estrutura do Projeto (File System)

A estrutura segue o padrão do Expo Router:

```
/meupersonal.app
├── /app                   # Rotas e Telas (Expo Router)
│   ├── (auth)             # Grupo de rotas de autenticação (sem tab bar)
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)             # Navegação principal (Tab Bar)
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # Dashboard (Personal ou Aluno)
│   │   ├── students.tsx   # Lista de Alunos (Personal)
│   │   ├── workouts.tsx   # Biblioteca de Treinos
│   │   └── profile.tsx    # Perfil e Configurações
│   ├── _layout.tsx        # Layout Raiz (Providers)
│   └── +not-found.tsx
├── /src
│   ├── /components        # Componentes Reutilizáveis (UI Kit)
│   │   ├── /ui            # Botões, Inputs, Cards (Atomic Design)
│   │   └── /forms         # Formulários complexos
│   ├── /lib               # Configurações de serviços externos
│   │   ├── supabase.ts
│   │   ├── stripe.ts
│   │   └── query-client.ts
│   ├── /store             # Stores do Zustand (authStore, workoutStore)
│   ├── /hooks             # Custom Hooks
│   ├── /types             # Definições de Tipos TypeScript
│   └── /utils             # Funções auxiliares
├── /drizzle               # Migrations e Schemas do Banco
├── app.json               # Configuração do Expo
└── package.json
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

## 4. Fluxo de Dados
1.  **App** consome dados via **Supabase Client**.
2.  **TanStack Query** (React Query) gerencia o fetch, cache e sincronização de dados do servidor.
3.  **Zustand** armazena estado global da aplicação (autenticação, tema, UI state).
4.  **Drizzle** é usado nas Edge Functions (se houver lógica backend complexa) ou o App chama o Supabase diretamente com RLS (Row Level Security) configurado.

### Separação de Responsabilidades
- **TanStack Query**: Estado do servidor (cache, sincronização, loading/error states)
- **Zustand**: Estado global da aplicação (auth, theme, UI state)
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
- **Boas Práticas**: `docs/best_practices.md`
- **Avaliação TanStack Query**: `docs/tanstack_query_evaluation.md`
- **Guia de Migração**: `docs/migration_guide.md`
- **Regras de Negócio**: `docs/business_rules.md`
