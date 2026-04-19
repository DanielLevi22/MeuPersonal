# PRD: AI Pricing — Planos e Gates de Funcionalidades

**Data de criação:** 2026-04-19
**Status:** draft
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Modelo de precificação para os planos de aluno autônomo e gates de funcionalidades de IA, incluindo trial gratuito, planos pagos e estratégia de conversão.

### Por quê?
As funcionalidades de IA têm custo real mas baixo (~R$0,60–1,12/usuário/mês). O modelo de preços precisa refletir o valor percebido ("secretária de performance 24h"), não o custo técnico. Sem gates bem definidos, não há pressão para conversão e o produto não sustenta crescimento.

### Como saberemos que está pronto?
- [ ] Trial de 21 dias funcional (sem cartão) com acesso Pro completo
- [ ] Paywall ativo no dia 22 com resumo de progresso acumulado
- [ ] Gates de funcionalidade funcionando por plano (assistente, check-ins, briefing)
- [ ] Página de planos clara com comparativo Free / Starter / Pro
- [ ] Métricas de conversão coletadas: trial → pago

---

## Contexto de custo de IA

| Feature | Modelo | Custo estimado/usuário/mês |
|---|---|---|
| Assistente diário (30 interações) | Claude Haiku 4.5 | ~R$0,18 |
| Briefing pré-treino (12 treinos/mês) | Claude Haiku 4.5 | ~R$0,06 |
| Review semanal (4x/mês) | Claude Haiku 4.5 | ~R$0,09 |
| Check-in com visão (4 fotos/mês) | Claude Sonnet 4.6 + Vision | ~R$0,54 |
| Onboarding (1x) | Claude Sonnet 4.6 | ~R$0,25 |
| **Total mensal (Pro intenso)** | | **~R$1,12/usuário** |

Com prompt caching: **~R$0,65/usuário/mês**. Margem alta mesmo no plano mais barato.

---

## Produtos e público-alvo

### Produto A — B2B (Especialista paga, alunos grátis)
Planos do especialista: R$89–129/mês (definição em PRD separado de billing).
**Alunos gerenciados recebem todas as features de IA sem custo adicional** — isso é diferencial de venda pro especialista: "ofereça IA para seus alunos incluso".

### Produto B — B2C (Aluno autônomo, sem especialista)
Foco deste PRD.

---

## Planos — Aluno Autônomo

| Feature | **Free** | **Starter — R$19/mês** | **Pro — R$39/mês** |
|---|---|---|---|
| Criação de plano via IA | 1x | Ilimitado | Ilimitado |
| Assistente diário | 3 interações/dia | 10/dia | Ilimitado |
| Briefing pré-treino | ❌ | ✓ | ✓ |
| Modo guiado durante treino | ❌ | ✓ | ✓ |
| Review semanal da IA | ❌ | Mensal | Semanal |
| Check-in com análise visual | ❌ | 1/mês | 4/mês |
| Histórico de PRs e progressão | 30 dias | Ilimitado | Ilimitado |
| Relatório antes/depois | ❌ | ❌ | ✓ |
| Conexão com especialistas (marketplace) | Browse only | Contato | Contato prioritário |

---

## Trial

- **21 dias com acesso Pro completo**
- Sem cartão no início — reduz fricção de aquisição
- Ao final do trial: cartão obrigatório para continuar (não bloquear dados, apenas novas interações)

### Por que 21 dias e não 14?
21 dias é suficiente para o aluno viver **3 momentos de "uau"**:
- Semana 1: primeiro treino guiado + briefing
- Semana 2: primeiro check-in + análise visual
- Semana 3: primeiro review semanal com progresso acumulado

---

## Ganchos de conversão (paywall inteligente)

### 1. Medo de perder histórico (dia 22)
No fim do trial, antes do paywall, mostrar:

> "Você treinou 14 vezes, bateu 3 PRs e seu check-in mostra progresso real.
> Não perca seu histórico — continue por R$19/mês."

Os dados acumulados são o produto. Perder é psicologicamente custoso.

### 2. A secretária sumiu (limite diário)
No plano Free, ao bater 3 interações/dia:

> "Você atingiu o limite de hoje. No Starter você tem 10 interações por dia."

O hábito de conversar com a IA já foi criado — parar é frustrante.

### 3. O briefing que falta
No Free o briefing pré-treino aparece como feature bloqueada. No dia que o aluno for treinar sem saber o que fazer, ele lembra que a IA faria isso.

### 4. Check-in sem análise
No Free o aluno pode tirar a foto do check-in, mas a análise fica bloqueada — ele vê a foto, não vê o progresso. A curiosidade converte.

---

## Fluxo de aquisição ideal

```
Download gratuito (sem barreira)
  → Onboarding: "Cria teu plano em 5 min com IA"
  → Trial 21 dias — Pro completo, sem cartão
  → Semana 1: treino guiado + briefing → "isso é incrível"
  → Semana 2: check-in + análise visual → vê resultado real
  → Semana 3: review semanal → dados concretos de progresso
  → Dia 22: paywall com histórico acumulado → conversão
```

---

## Métricas de sucesso

- Conversão trial → pago: meta > 25%
- Churn mensal: meta < 8%
- Tempo até primeiro "uau" (briefing ou check-in): meta < 7 dias
- Custo de aquisição vs LTV: LTV > 6x CAC

---

## Fora do escopo deste PRD
- Planos do especialista (billing B2B)
- Pagamento integrado via Stripe/Asaas (PRD de billing separado)
- Descontos anuais
- Plano família ou grupo
