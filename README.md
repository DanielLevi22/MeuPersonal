# Eleva Pro

> Plataforma de gestão de saúde e performance assistida por IA para personal trainers, nutricionistas e seus alunos.

---

## O produto

**Eleva Pro** conecta especialistas de saúde aos seus alunos em uma plataforma única — com IA como secretária de performance que monitora, alerta e acompanha 24h. Disponível em web (dashboard do especialista) e mobile (aluno e especialista).

```
Especialista  →  gerencia carteira de alunos com IA
Aluno gerenciado  →  acompanhamento do especialista, grátis
Aluno autônomo  →  IA como coach pessoal, plano próprio
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Mobile | React Native + Expo + Expo Router |
| Web | Next.js 16 (App Router) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| IA | Anthropic Claude (Sonnet 4.6 + Haiku 4.5) |
| Estado global | Zustand + MMKV |
| Estado servidor | TanStack Query |
| Estilização | Tailwind CSS / NativeWind |
| Pagamentos | Stripe + Asaas |
| Linting | Biome |
| Testes | Jest (mobile) + Vitest (web) |

---

## Estrutura do monorepo

```
/app        → React Native (Expo) — mobile
/web        → Next.js — dashboard web
/shared     → serviços e tipos compartilhados (mobile + web)
/supabase   → migrations SQL
/docs       → documentação completa do projeto
/scripts    → automações (new-feature, etc.)
```

---

## Começando

### Pré-requisitos
- Node.js 20+
- pnpm ou npm
- Expo CLI (`npm install -g expo-cli`)
- Conta no Supabase

### Instalação

```bash
# instalar dependências de todos os workspaces
npm install

# mobile
cd app && npx expo start

# web
cd web && npm run dev
```

### Variáveis de ambiente

```bash
# mobile — copiar e preencher
cp app/.env.example app/.env.development

# web — criar arquivo local
cp web/.env.example web/.env.local
```

Veja as variáveis necessárias em [`CLAUDE.md`](CLAUDE.md#variáveis-de-ambiente).

---

## Documentação

| Documento | O que encontrar |
|---|---|
| [`docs/README.md`](docs/README.md) | Visão geral do sistema com diagramas de arquitetura |
| [`docs/modules/ai/`](docs/modules/ai/README.md) | Como o módulo de IA funciona (C4 Nível 3) |
| [`docs/PRDs/README.md`](docs/PRDs/README.md) | Todas as features planejadas e em andamento |
| [`docs/decisions/README.md`](docs/decisions/README.md) | Por que cada decisão de arquitetura foi tomada |
| [`docs/SYSTEM_MAPPING.md`](docs/SYSTEM_MAPPING.md) | Schema canônico do banco e anti-padrões |
| [`docs/HOW_WE_WORK.md`](docs/HOW_WE_WORK.md) | Fluxo de desenvolvimento e convenções |
| [`CLAUDE.md`](CLAUDE.md) | Guia para o agente de IA (stack, regras, padrões) |

---

## Fluxo de desenvolvimento

```bash
# sempre criar branch + PRD juntos
node scripts/new-feature.js <nome-da-feature>

# lint + typecheck (roda no pre-commit)
cd app && npx biome check .
cd web && npm run lint && npm run typecheck

# testes (roda no pre-push)
cd app && npm test
cd web && npm run test
```

Veja o protocolo completo em [`docs/HOW_WE_WORK.md`](docs/HOW_WE_WORK.md).

---

## Status atual

| Módulo | Status |
|---|---|
| Auth | ✅ Implementado |
| Gestão de Alunos | ✅ Implementado |
| Treinos | ✅ Implementado |
| Nutrição | ✅ Implementado |
| Gamificação | ✅ Implementado |
| Avaliação Física | ✅ Implementado |
| AI Coach Chat | 🔨 Em construção |
| AI Aluno Autônomo | 📋 PRD aprovado |
| Billing | 📋 Planejado |
| Marketplace | 📋 Planejado |

Status detalhado: [`docs/STATUS.md`](docs/STATUS.md)
