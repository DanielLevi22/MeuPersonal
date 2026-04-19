# PRD: Specialist Dashboard — Dashboard Web do Especialista

**Data de criação:** 2026-04-19
**Status:** draft
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Dashboard web completo e intuitivo para o especialista gerenciar sua carteira de alunos, receber alertas de IA, acessar o AI Coach Chat por aluno, comunicar-se via plataforma e acompanhar o desempenho do negócio — tudo em um único lugar, sem precisar sair para o WhatsApp ou planilhas.

### Por quê?
Hoje o especialista gerencia alunos via WhatsApp, planos em planilhas e pagamentos no Pix — ferramentas desconectadas que consomem tempo e perdem contexto. O dashboard centraliza tudo e usa IA para proativamente informar o que precisa de atenção, transformando o especialista num gestor de performance eficiente.

### Como saberemos que está pronto?
- [ ] Especialista vê em < 5 segundos quais alunos precisam de atenção hoje
- [ ] Consegue abrir o AI Coach Chat de qualquer aluno em 1 clique
- [ ] Consegue mandar mensagem para aluno sem sair da plataforma
- [ ] Vê progresso real do aluno (PRs, aderência, check-in) antes de qualquer sessão
- [ ] Recebe alertas via WhatsApp quando aluno está em risco (plano Pro+)
- [ ] Consegue criar e duplicar planos para múltiplos alunos

---

## Estrutura geral do dashboard

```
/dashboard
  /                   → home (overview + alertas)
  /students           → lista de alunos
  /students/[id]      → perfil completo do aluno
  /students/[id]/chat → AI Coach Chat
  /messages           → todas as conversas
  /analytics          → métricas do negócio
  /marketplace        → perfil público e leads
  /settings           → conta, plano, notificações, WhatsApp
```

---

## Tela 1 — Home / Overview

```
┌─────────────────────────────────────────────────────┐
│  Bom dia, Carlos!  Segunda, 20 de Abril              │
├─────────────────────────────────────────────────────┤
│  PRECISA DE VOCÊ AGORA                              │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🔴 João Silva — 5 dias sem logar             │  │
│  │    Última atividade: Treino B (15/04)        │  │
│  │    [Mandar mensagem]  [Ver perfil]            │  │
│  ├──────────────────────────────────────────────┤  │
│  │ 🟡 Ana Souza — 2 treinos não registrados     │  │
│  │    Plano vence em 3 dias                     │  │
│  │    [Renovar plano]  [Ver perfil]              │  │
│  └──────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  HOJE                                               │
│  📋 8 alunos têm treino hoje                        │
│  ✓  3 já registraram a sessão                       │
│  💬 2 mensagens não lidas                           │
├────────────────┬────────────────────────────────────┤
│  CARTEIRA      │  ESTA SEMANA                       │
│  24 ativos     │  Aderência média: 78%              │
│  2 em risco    │  PRs batidos: 7                    │
│  1 inativo     │  Check-ins realizados: 5            │
└────────────────┴────────────────────────────────────┘
```

### Alertas inteligentes (gerados pela IA)

| Trigger | Severidade | Canal |
|---|---|---|
| Aluno sem logar 3+ dias | 🟡 Médio | App |
| Aluno sem logar 5+ dias | 🔴 Alto | App + WhatsApp |
| 2+ treinos consecutivos perdidos | 🟡 Médio | App |
| 3+ treinos consecutivos perdidos | 🔴 Alto | App + WhatsApp |
| Plano do aluno vencendo em 3 dias | 🟡 Médio | App |
| Sono < 2,5/5 por 3 dias seguidos | 🟡 Médio | App |
| Check-in com regressão detectada | 🔴 Alto | App + WhatsApp |
| Mensagem do aluno sem resposta há 24h | 🟡 Médio | App + WhatsApp |

**Formato da mensagem WhatsApp (template pré-aprovado Meta):**
> "Olá {{nome_especialista}}! Seu aluno {{nome_aluno}} não treina há {{dias}} dias. Acesse o perfil completo: {{link}}"

---

## Tela 2 — Lista de Alunos

```
[Buscar aluno...]  [Filtro ▼]  [+ Novo aluno]

● ATENÇÃO (2)
  João Silva      🔴 risco alto    5 dias sem logar      [Ver]
  Ana Souza       🟡 atenção       plano vencendo        [Ver]

● ATIVOS (22)
  Pedro Lima      🟢 ótimo         Semana 8 / 78% ader.  [Ver]
  Maria Costa     🟢 ótimo         Semana 3 / 91% ader.  [Ver]
  ...

● INATIVOS (1)
  Carlos Melo     ⚫ inativo       Último acesso: 30 dias [Ver]
```

**Filtros disponíveis:**
- Status: todos / em risco / ativos / inativos
- Plano: treino / nutrição / ambos
- Aderência: acima de 80% / abaixo de 60%
- Fase da periodização: semana X

---

## Tela 3 — Perfil do Aluno

```
┌─────────────────────────────────────────────────────┐
│  João Silva, 28 anos  •  Hipertrofia  •  Semana 8   │
│  [Abrir AI Coach ✨]  [Mensagem]  [Editar plano]    │
├──────────────┬──────────────────────────────────────┤
│ ESTA SEMANA  │ HISTÓRICO                            │
│ Treinos: 3/4 │ PRs: Supino 85kg, Agach. 100kg      │
│ Dieta: 85%  │ Peso: 82kg → 79kg (-3kg em 8 sem)   │
│ Sono: 3.2/5  │ Check-ins: 3 realizados              │
├──────────────┴──────────────────────────────────────┤
│ PERIODIZAÇÃO ATUAL                                  │
│ Hipertrofia 12 semanas  •  Fase 2 de 3              │
│ [Ver treinos]  [Editar via AI Coach]                │
├─────────────────────────────────────────────────────┤
│ HABIT LOOP — ÚLTIMOS 7 DIAS                         │
│ Seg Ter Qua Qui Sex Sáb Dom                         │
│ 😴 3  4   2   3   4   5   -   (média: 3.5)         │
│ ⚡ 4  3   2   4   4   4   -   (média: 3.5)         │
│ 💧 ✓  ✓   ✗   ✓   ✓   ✓   -                       │
├─────────────────────────────────────────────────────┤
│ ÚLTIMO CHECK-IN  •  há 12 dias                      │
│ [foto thumbnail]  "Progresso dentro do esperado     │
│  para semana 6. Continuar com o plano atual."       │
├─────────────────────────────────────────────────────┤
│ MENSAGENS RECENTES                                  │
│ João: "Posso trocar o supino por cross-over?"       │
│ [Ver conversa completa]  [Responder]                │
└─────────────────────────────────────────────────────┘
```

---

## Tela 4 — AI Coach Chat (por aluno)

Interface de chat full-screen acessada a partir do perfil do aluno.

```
← João Silva  •  AI Coach Chat

┌─────────────────────────────────────────────────────┐
│ CONTEXTO CARREGADO                                  │
│ ✓ Periodização: Hipertrofia 12sem (Fase 2/3)        │
│ ✓ Treinos: 3 treinos, 12 exercícios                 │
│ ✓ Anamnese: objetivo ganho muscular, sem lesões     │
│ ✓ Último assessment: 18/03/2026                     │
└─────────────────────────────────────────────────────┘

IA: "João está na Fase 2 da periodização de hipertrofia.
     A Fase 2 tem 3 treinos mas ainda sem exercícios definidos.
     Quer montar os treinos agora ou revisar a Fase 1 primeiro?"

Especialista: "Vamos montar os treinos da fase 2"

IA: "Perfeito. Com base na anamnese (foco em hipertrofia,
     4 dias/semana, sem restrições), proponho:
     
     Treino A — Peito e Tríceps
     Treino B — Costas e Bíceps  
     Treino C — Pernas
     Treino D — Ombros e Core
     
     Começo pelo Treino A?"

[campo de texto]                          [Enviar ↵]
```

---

## Tela 5 — Mensagens

- Todas as conversas com alunos em uma lista
- Indicador de não lidas
- Busca por aluno ou conteúdo
- Aluno pode iniciar conversa pelo mobile ou web
- Especialista responde pelo web
- Notificação push no mobile do especialista quando há mensagem nova

---

## Tela 6 — Analytics

```
VISÃO GERAL DO NEGÓCIO
━━━━━━━━━━━━━━━━━━━━━
Alunos ativos:      24   (+2 vs mês anterior)
Receita mensal:     R$2.880   (24 × R$120 médio)
Taxa de retenção:   87%   (meta: >85%)
Churn do mês:       1 aluno

ENGAJAMENTO DA CARTEIRA
━━━━━━━━━━━━━━━━━━━━━━━
Aderência média treino:   78%
Aderência média dieta:    71%
Alunos em risco (<60%):   2
Review semanal lido:      68%

MEUS MELHORES RESULTADOS (últimos 90 dias)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ana Souza:    -8kg em 12 semanas
Pedro Lima:   +4kg massa magra em 16 semanas
[+ Adicionar ao perfil público com consentimento]
```

---

## Tela 7 — Marketplace (Perfil Público)

- Editar bio, especialidades, modalidades, preço
- Ver leads recebidos (alunos interessados)
- Aceitar ou declinar leads
- Ver reviews recebidos e responder
- Status de verificação CREF
- Preview de como o perfil aparece para alunos

---

## Configurações — Notificações WhatsApp

```
Alertas via WhatsApp  [Ativado ●]

Número: +55 11 99999-9999  [Editar]

Receber alerta quando:
[✓] Aluno sem logar 5+ dias
[✓] 3+ treinos consecutivos perdidos
[✓] Check-in com regressão detectada
[ ] Mensagem sem resposta há 24h
[✓] Plano de aluno vencendo

Horário de silêncio: 22h → 07h  [Configurar]

[Salvar]
```

---

## Integração WhatsApp — implementação

### Provider recomendado
**Meta WhatsApp Business API** via BSP (Business Solution Provider).
BSPs brasileiros indicados: **Zenvia**, **Take Blip** ou **360dialog**.

### Custo estimado
- ~R$0,15 por mensagem enviada
- Especialista Pro (30 alunos): ~R$3–8/mês em alertas
- Incluído no plano Pro sem custo adicional (margem absorve)

### Fluxo técnico
```
Cron job detecta trigger (aluno X sem logar 5 dias)
  → Verifica se especialista tem WhatsApp ativo no plano Pro+
  → Busca número do especialista
  → Envia via WhatsApp Business API:
    Template: "Atenção, {{nome}}! Seu aluno {{aluno}} não
    treina há {{dias}} dias. Ver perfil: {{link}}"
  → Registra envio em specialist_alerts (whatsapp_sent_at)
```

### LGPD
- Número de WhatsApp é dado pessoal — consentimento explícito no onboarding
- Especialista pode remover número e desativar a qualquer momento
- Número não é exposto a terceiros nem ao suporte básico

---

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|---|---|---|
| `specialist_alerts` | SELECT, INSERT, UPDATE | Alertas gerados pela IA |
| `specialist_whatsapp_settings` | SELECT, INSERT, UPDATE | **NOVA** — config de WhatsApp por especialista |
| `specialist_messages` | SELECT, INSERT | Mensagens com alunos |
| `daily_habit_logs` | SELECT | Dados de sono/energia dos alunos |
| `weekly_reviews` | SELECT | Reviews dos alunos |
| `student_checkins` | SELECT | Fotos e análises de check-in |

```sql
CREATE TABLE specialist_whatsapp_settings (
  specialist_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  is_active boolean DEFAULT true,
  alert_types text[] DEFAULT '{abandon_risk,missed_workouts,checkin_regression}',
  quiet_hours_start smallint DEFAULT 22,   -- hora local
  quiet_hours_end smallint DEFAULT 7,
  consented_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Fases de entrega

### Fase 1 — Home e lista de alunos (1 semana)
- [ ] Home com alertas e overview da carteira
- [ ] Lista de alunos com status e filtros
- [ ] Perfil do aluno com dados de engajamento e habit loop

### Fase 2 — AI Coach Chat integrado (1 semana)
- [ ] Chat full-screen por aluno (reaproveitando ai-coach-chat)
- [ ] Contexto do aluno carregado automaticamente ao abrir

### Fase 3 — Mensagens e WhatsApp (1 semana)
- [ ] Chat direto especialista-aluno
- [ ] Configuração de WhatsApp nas settings
- [ ] Envio de alertas via WhatsApp Business API
- [ ] Horário de silêncio respeitado

### Fase 4 — Analytics e marketplace (1 semana)
- [ ] Dashboard de analytics do negócio
- [ ] Edição de perfil público do marketplace
- [ ] Gestão de leads recebidos

---

## Checklist de done
- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/specialist-dashboard.md` criado
- [ ] `docs/STATUS.md` atualizado
- [ ] WhatsApp testado em sandbox (Meta test number)
- [ ] Consentimento LGPD para WhatsApp implementado
