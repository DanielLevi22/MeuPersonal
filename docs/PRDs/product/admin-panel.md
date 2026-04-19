# PRD: Admin Panel — Painel de Administração

**Data de criação:** 2026-04-19
**Status:** draft
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Painel web de administração da plataforma para a equipe interna: gestão de usuários, aprovação de especialistas, moderação do marketplace, controle de assinaturas, analytics de negócio e monitoramento de saúde do sistema.

### Por quê?
Sem admin panel, operações críticas (verificar CREF, cancelar assinatura problemática, moderar review falso) dependem de acesso direto ao banco. Isso é inseguro, lento e não escala. O admin panel é infraestrutura operacional necessária antes do lançamento.

### Como saberemos que está pronto?
- [ ] Admin consegue aprovar ou rejeitar verificação de CREF de especialistas
- [ ] Admin consegue ver, cancelar e aplicar créditos em assinaturas
- [ ] Admin consegue moderar reviews e denúncias do marketplace
- [ ] Admin vê MRR, churn e usuários ativos em tempo real
- [ ] Admin consegue gerenciar banco de exercícios e alimentos
- [ ] Acesso ao admin restrito a role `admin` — impossível acessar sem permissão

---

## Estrutura de navegação

```
/admin
  /dashboard          → métricas gerais e alertas do dia
  /users
    /specialists      → lista e gestão de especialistas
    /students         → lista e gestão de alunos
  /verifications      → fila de aprovação de CREF
  /subscriptions      → todas as assinaturas ativas e histório
  /marketplace
    /reviews          → moderar reviews e denúncias
    /featured         → gerenciar especialistas em destaque
  /content
    /exercises        → CRUD banco de exercícios
    /foods            → CRUD banco de alimentos
  /notifications      → monitorar fila de notificações e falhas
  /system
    /cron-jobs        → status dos jobs automáticos
    /ai-costs         → custo de IA por dia/semana/mês
    /logs             → logs de erros críticos
  /settings           → feature flags, limites de plano, textos
```

---

## Seções em detalhe

### Dashboard
- MRR atual e variação vs mês anterior
- Novos usuários hoje / esta semana / este mês
- Conversão trial → pago (especialistas e alunos autônomos)
- Churn do mês
- Alertas críticos: pagamentos falhando, cron jobs com erro, pico de custo de IA
- Top 5 especialistas por número de alunos ativos

### Usuários — Especialistas
- Lista com: nome, email, plano, alunos ativos, data de cadastro, status (ativo/suspenso)
- Filtros: plano, status, verificado/não verificado, com/sem alunos
- Ação por especialista:
  - Ver perfil completo
  - Alterar plano manualmente (override)
  - Suspender / reativar conta
  - Aplicar crédito (ex: mês grátis como compensação)
  - Resetar senha (envia email)
  - Ver histórico de pagamentos

### Usuários — Alunos
- Lista com: nome, email, tipo (gerenciado/autônomo), plano, especialista vinculado
- Filtros: tipo, plano, último acesso
- Ação: suspender, resetar senha, ver histórico

### Fila de Verificação (CREF)
```
┌──────────────────────────────────────────┐
│ João Silva — CREF: 012345-G/SP           │
│ Enviado em: 18/04/2026                   │
│ [Ver documento]                          │
│                                          │
│ [✓ Aprovar]  [✗ Rejeitar]               │
│ Motivo (se rejeitar): ____________       │
└──────────────────────────────────────────┘
```
- Ao aprovar: badge "Verificado" ativado no perfil público
- Ao rejeitar: email automático com motivo + link para reenviar

### Assinaturas
- Todas as assinaturas com: usuário, plano, status, próxima cobrança, provider
- Filtros: status (ativa, trial, inadimplente, cancelada), plano, provider
- Ações: cancelar, pausar, aplicar crédito, forçar renovação
- Log de eventos: cada mudança de status registrada com timestamp e responsável

### Marketplace — Reviews
- Fila de reviews denunciados (aluno ou especialista pode denunciar)
- Admin vê: review completo, contexto da relação (tempo de vínculo, histórico)
- Ações: manter, remover, banir usuário que denunciou abusivamente

### Conteúdo — Exercícios
- Lista com: nome, grupo muscular, nível, equipamento, tem vídeo?
- CRUD completo: criar, editar, desativar
- Upload de vídeo demonstrativo (Supabase Storage)
- Aprovação de exercícios customizados enviados por usuários

### Conteúdo — Alimentos
- Lista com: nome, calorias, macros, fonte (TACO, USDA, customizado)
- CRUD completo
- Aprovação de alimentos customizados criados por usuários

### Sistema — Cron Jobs
| Job | Frequência | Último status | Próxima execução | Ação |
|---|---|---|---|---|
| Review semanal | Domingo 20h | ✓ OK | 26/04 20:00 | Reprocessar |
| Alertas de abandono | Diário 9h | ✓ OK | 20/04 09:00 | Reprocessar |
| Relatório especialista | Domingo 21h | ✗ ERRO | 26/04 21:00 | Ver log / Reprocessar |
| Notificações push | A cada hora | ✓ OK | 20/04 10:00 | — |

### Sistema — Custos de IA
- Custo total de IA por dia (breakdown por tipo: briefing, check-in, assistente, etc.)
- Custo médio por usuário ativo
- Alertas automáticos se custo diário > threshold definido
- Top 10 usuários com maior consumo de IA (para detectar abuso)

### Configurações
- Feature flags: ativar/desativar features por plano sem deploy
- Limites de plano: alterar número de interações/dia, check-ins/mês
- Textos de notificação: editar mensagens de alerta e review
- Taxa do marketplace: % ou valor fixo por conexão

---

## Controle de acesso

- Role `admin` no banco: acesso total ao admin panel
- Role `support`: acesso a usuários e assinaturas, sem acesso a configurações
- Toda ação no admin é auditada em `admin_audit_logs` (quem fez o quê e quando)
- Login do admin exige 2FA obrigatório

### Nova tabela

```sql
CREATE TABLE admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,              -- 'approve_cref', 'cancel_subscription', etc.
  target_type text NOT NULL,         -- 'user', 'subscription', 'review', etc.
  target_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

---

## Stack do admin panel

- Mesmo Next.js do web (rota `/admin` com middleware de proteção)
- Acesso bloqueado por middleware: só role `admin` ou `support`
- UI: componentes existentes do dashboard (sem novo design system)
- Tabelas de dados: TanStack Table (já usada no web)

---

## Fases de entrega

### Fase 1 — Fundação e usuários (1 semana)
- [ ] Middleware `/admin` com proteção de role
- [ ] Dashboard com MRR, novos usuários, alertas
- [ ] Lista de especialistas e alunos com filtros e ações básicas
- [ ] `admin_audit_logs` para rastrear ações

### Fase 2 — Verificação e assinaturas (1 semana)
- [ ] Fila de verificação de CREF com aprovação/rejeição
- [ ] Gestão de assinaturas (cancelar, crédito, histórico)
- [ ] Email automático ao aprovar/rejeitar CREF

### Fase 3 — Marketplace e conteúdo (1 semana)
- [ ] Moderação de reviews e denúncias
- [ ] CRUD de exercícios com upload de vídeo
- [ ] CRUD de alimentos

### Fase 4 — Sistema e analytics (1 semana)
- [ ] Monitor de cron jobs com reprocessamento manual
- [ ] Dashboard de custos de IA
- [ ] Configurações e feature flags
- [ ] 2FA obrigatório para login admin

---

## Checklist de done
- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/admin-panel.md` criado
- [ ] `docs/STATUS.md` atualizado
- [ ] RLS: rotas admin inacessíveis sem role correto
- [ ] 2FA funcionando no login admin
