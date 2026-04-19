# PRD: Billing — Planos e Assinaturas

**Data de criação:** 2026-04-19
**Status:** draft
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Infraestrutura completa de assinaturas e cobranças da plataforma: planos para especialistas (B2B) e planos para alunos autônomos (B2C), trial gratuito, upgrade/downgrade, integração com Stripe (cartão) e Asaas (PIX/boleto).

### Por quê?
Sem billing funcionando, os gates de plano não existem, o trial não converte e a plataforma não gera receita. É infraestrutura bloqueante para todas as outras features premium.

### Como saberemos que está pronto?
- [ ] Especialista consegue assinar um plano via cartão (Stripe) ou PIX/boleto (Asaas)
- [ ] Aluno autônomo consegue assinar Starter ou Pro via cartão ou PIX
- [ ] Trial de 30 dias (especialista) e 21 dias (aluno autônomo) funcionam sem cartão
- [ ] Gates de plano bloqueiam funcionalidades premium para quem não assinou
- [ ] Webhook processa pagamento confirmado e ativa plano automaticamente
- [ ] Cancelamento desativa features premium mas mantém dados do usuário
- [ ] Admin consegue ver assinaturas, aplicar créditos e cancelar manualmente

---

## Modelo de negócio

### Quem paga o quê

```
B2B → Especialista paga mensalmente
      Alunos gerenciados pelo especialista são GRATUITOS

B2C → Aluno autônomo (sem especialista) paga diretamente
      Ao contratar um especialista via marketplace, para de pagar
      (especialista assume o custo via plano dele)
```

O aluno nunca paga enquanto tiver especialista ativo — isso remove fricção de adoção.

---

## Planos do Especialista (B2B)

| | **Free Trial** | **Starter** | **Pro** | **Elite** |
|---|---|---|---|---|
| **Preço** | Grátis 30 dias | R$89/mês | R$129/mês | R$199/mês |
| **Alunos ativos** | até 5 | até 30 | até 100 | Ilimitado |
| **AI Coach Chat** | ✓ | ✓ | ✓ | ✓ |
| **Briefing pré-treino (alunos)** | ✓ | ✓ | ✓ | ✓ |
| **Alertas de abandono** | ✓ | ✓ | ✓ | ✓ |
| **Dashboard de carteira** | básico | básico | completo | completo |
| **Alertas via WhatsApp** | ❌ | ❌ | ✓ | ✓ |
| **Relatório por aluno (IA)** | ❌ | mensal | semanal | diário |
| **Comunicação integrada** | ❌ | ✓ | ✓ | ✓ |
| **Perfil no marketplace** | ❌ | ❌ | listado | destaque |
| **Analytics de negócio** | ❌ | ❌ | ✓ | ✓ |
| **Templates de planos** | ❌ | ❌ | ✓ | ✓ |
| **Suporte** | comunidade | email | prioritário | dedicado |

### Pressão de upgrade natural
- Starter com 31 alunos → bloqueado, modal de upgrade
- Pro com 101 alunos → bloqueado, modal de upgrade
- Funcionalidades de WhatsApp visíveis mas bloqueadas no Starter → "disponível no Pro"

---

## Planos do Aluno Autônomo (B2C)

| | **Free** | **Starter** | **Pro** |
|---|---|---|---|
| **Preço** | Grátis | R$19/mês | R$39/mês |
| **Trial Pro** | 21 dias sem cartão | — | — |
| **Criação de plano via IA** | 1x | ilimitado | ilimitado |
| **Assistente diário** | 3/dia | 10/dia | ilimitado |
| **Habit loop diário** | ✓ | ✓ | ✓ |
| **Briefing pré-treino** | ❌ | ✓ | ✓ |
| **Review semanal** | ❌ | mensal | semanal |
| **Check-in com análise visual** | ❌ | 1/mês | 4/mês |
| **Histórico completo + PRs** | 30 dias | ilimitado | ilimitado |
| **Relatório antes/depois** | ❌ | ❌ | ✓ |
| **Marketplace (buscar especialista)** | browse | contato | prioridade |

---

## Trial e conversão

### Especialista — 30 dias
- Acesso Pro completo
- Sem cartão para começar
- Dia 25: email + notificação "5 dias restantes — não perca seu progresso"
- Dia 30: downgrade para Free (5 alunos) — dados mantidos, alunos excedentes ficam inativos

### Aluno autônomo — 21 dias
- Acesso Pro completo
- Sem cartão para começar
- Dia 17: notificação com resumo do progresso acumulado
- Dia 21: downgrade para Free — histórico mantido, features bloqueadas

### Ganchos de conversão

**Especialista:**
> "Seu trial termina em 5 dias. Você tem 12 alunos ativos — no plano Free só pode ter 5. Assine o Starter para manter todos."

**Aluno autônomo (dia 22):**
> "Você treinou 14 vezes, bateu 3 PRs e fez 1 check-in com progresso real. Continue por R$19/mês."

---

## Fluxo de migração B2C → B2B

```
Aluno autônomo (paga R$19–39/mês)
  → Contrata especialista via marketplace
  → Especialista aceita o aluno
  → Sistema cria vínculo em student_specialists
  → Assinatura do aluno é cancelada automaticamente
  → Aluno passa a ser gerenciado (gratuito)
  → Especialista é cobrado pelo slot a partir do próximo ciclo
```

---

## Integrações de pagamento

### Stripe (cartão de crédito/débito)
- Cobrança recorrente mensal
- Webhook: `payment_intent.succeeded` → ativa plano
- Webhook: `invoice.payment_failed` → grace period de 3 dias → suspende
- Portal do cliente Stripe para o usuário gerenciar cartão

### Asaas (PIX e boleto — Brasil)
- PIX: confirmação em tempo real via webhook
- Boleto: prazo de 3 dias úteis, confirmação via webhook
- Renovação mensal com novo boleto/PIX gerado automaticamente
- Fallback: se vencer sem pagar → grace period de 5 dias → suspende

---

## Tabelas do banco

| Tabela | Operação | Observação |
|---|---|---|
| `subscriptions` | SELECT, INSERT, UPDATE | **NOVA** — assinaturas ativas |
| `subscription_plans` | SELECT | **NOVA** — definição dos planos e limites |
| `payment_events` | INSERT | **NOVA** — log de webhooks recebidos |
| `profiles` | UPDATE | Atualizar `plan_id` e `plan_expires_at` |

### Novas tabelas

```sql
CREATE TABLE subscription_plans (
  id text PRIMARY KEY,                -- 'specialist_starter', 'student_pro', etc.
  name text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('specialist', 'student')),
  price_brl numeric NOT NULL,
  max_students integer,               -- null = ilimitado
  features jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
  provider text NOT NULL CHECK (provider IN ('stripe', 'asaas')),
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id),
  provider text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  processed_at timestamptz DEFAULT now()
);
```

---

## Fases de entrega

### Fase 1 — Infraestrutura base (1 semana)
- [ ] Tabelas `subscription_plans`, `subscriptions`, `payment_events`
- [ ] RLS: usuário vê só sua própria assinatura; admin vê todas
- [ ] Seed dos planos em `subscription_plans`
- [ ] Middleware de verificação de plano (helper `getUserPlan()`)

### Fase 2 — Gates de funcionalidade (1 semana)
- [ ] `checkFeatureAccess(userId, feature)` — retorna true/false
- [ ] Gates aplicados em todas as rotas de IA e features premium
- [ ] UI de paywall (modal com CTA para upgrade)
- [ ] Contadores de uso (assistente diário, check-ins/mês)

### Fase 3 — Stripe (1 semana)
- [ ] Checkout via Stripe para cartão (Starter e Pro)
- [ ] Webhook handler para `payment_intent.succeeded` e `invoice.payment_failed`
- [ ] Portal do cliente Stripe para gerenciar cartão
- [ ] Emails automáticos: boas-vindas, pagamento confirmado, falha no pagamento

### Fase 4 — Asaas (1 semana)
- [ ] Geração de PIX e boleto via Asaas
- [ ] Webhook handler para confirmação de pagamento
- [ ] Renovação automática mensal

### Fase 5 — Trial e migração (3-4 dias)
- [ ] Trial sem cartão (30 dias especialista, 21 dias aluno)
- [ ] Notificações de fim de trial (dia 25/17)
- [ ] Downgrade automático ao vencer trial
- [ ] Migração B2C → B2B ao contratar especialista

---

## Checklist de done
- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/billing.md` criado
- [ ] `docs/STATUS.md` atualizado
- [ ] RLS configurado — usuário vê só a própria assinatura
- [ ] Stripe e Asaas testados em modo sandbox
