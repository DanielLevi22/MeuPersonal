# meupersonal.app

# TreinoPro - Documento de Decisão de Arquitetura (ADR) e Plano de Projeto

**Data**: 21 de Novembro de 2025

**Autor**: 

**Status**: Aprovado e em execução

**Versão**: 1.0

## 1. Objetivo do Produto

Criar um aplicativo mobile SaaS onde Personal Trainers cadastram treinos e dietas para seus alunos, com cobrança recorrente do personal e uso gratuito para os alunos.

**MVP - Funcionalidades obrigatórias**

- Cadastro/login (Personal ou Aluno)
- Personal cria e convida alunos (link WhatsApp/e-mail)
- Montagem de treinos (exercícios, séries, repetições, carga, descanso, observações e vídeos)
- Montagem de dieta simples (refeições do dia + alimentos + quantidades)
- Aluno vê treino e dieta do dia + check-in de conclusão
- Notificações push diárias
- Cobrança recorrente do personal trainer

## 2. Modelo de Negócio (decisão final)

- Personal Trainer paga R$ 89–129/mês (alunos ilimitados grátis)
- Cobrança via Stripe + Asaas (PIX, boleto e cartão)
- Sem freemium na v1 (conversão maior com teste de 14–30 dias)

## 3. Stack Técnica - Decisão Final (21/11/2025)

| Camada | Tecnologia | Justificativa |
| --- | --- | --- |
| Mobile | React Native + Expo (EAS Build) | Melhor ecossistema, dev único, hot reload rápido |
| Navegação | Expo Router (file-based) | Simplicidade e performance |
| Gerenciamento de Estado | Zustand + MMKV | Leve, rápido e persistente |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) | Firebase "brasileiro" com SQL real e gratuito até ~50k users |
| ORM / Migrações | Drizzle ORM + drizzle-kit | Tipagem perfeita com TypeScript |
| Pagamentos | Stripe + Asaas (fallback PIX/Boleto) | Cobrança recorrente + conformidade Brasil |
| Notificações | Expo Notifications + FCM | Funciona offline e em background |
| Monitoramento | Sentry + PostHog (self-hosted grátis) | Erros e analytics |

## 4. Estrutura de Pastas (definitiva)

/app
(tabs)/
personal/
index.tsx
alunos/
[id]/
treinos/
dietas/
progresso/
novo-aluno.tsx
aluno/
index.tsx
dieta.tsx
progresso.tsx
auth/
login.tsx
escolher-perfil.tsx
/src
components/
lib/
supabase.ts
drizzle.ts
stripe.ts
asaas.ts
notifications.ts
hooks/
schemas/          → Drizzle + Zod
store/            → Zustand stores
types/
utils/
drizzle/
migrations/
assets/
expo/

text

## 6. Cronograma Detalhado (10 semanas - início imediato)

| Semana | Entregável (testável no celular) | Horas estimadas |
| --- | --- | --- |
| 1 | Projeto + Auth Supabase + Escolha de perfil | 15–20h |
| 2 | Dashboard Personal + CRUD Aluno + Convite WhatsApp | 20h |
| 3 | Banco de 300 exercícios + Montagem de treino | 25h |
| 4 | Tela do aluno - Treino do dia + check-in | 25h |
| 5 | Sistema de dietas completo | 20h |
| 6 | Notificações push + comentários no treino | 20h |
| 7 | Integração Stripe + Asaas + tela de assinatura | 25h |
| 8 | Testes beta com 10–15 personais reais | 20h |
| 9 | Correções + Build final (TestFlight + Play Store) | 15h |
| 10 | Lançamento oficial + primeiras vendas | — |

**Data prevista de lançamento oficial**: 28 de Fevereiro de 2026

## 7. Nome do App (decisão pendente - escolher até 23/11)

Candidatos disponíveis (domínio + stores + instagram):

- TreinoPro
- MeuPersonal
- FitFlow
- Evoly
- PersonalApp

## 8. Próximos Passos Imediatos (48h)

1. Escolher e reservar nome definitivo + domínio
2. Criar projeto Supabase
3. Rodar boilerplate Expo + Supabase + Drizzle
4. Criar landing page (Framer/Carrd) e captar primeiros 100 leads
5. Criar repositório GitHub privado

## 9. Decisões Já Tomadas e Trancadas

- Stack: React Native Expo + Supabase + Drizzle + Zustand ✅
- Modelo de cobrança: Só personal paga ✅
- MVP com no máximo 8 telas principais ✅
- Sem Flutter (mesmo sendo ótima opção) → você escolheu RN ❤️
- Lançamento máximo Abril/2026 ✅

Este documento será atualizado a cada mudança relevante de arquitetura.