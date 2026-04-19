# PRD: AI Specialist Engagement — Especialista Indispensável na Plataforma

**Data de criação:** 2026-04-19
**Status:** draft
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Conjunto de features de IA e dados que tornam a plataforma indispensável para o especialista: alertas inteligentes sobre engajamento dos alunos, vitrine de resultados verificados, analytics de negócio, e ferramentas que fazem o especialista entregar mais valor sem mais esforço.

### Por quê?
Hoje o especialista monta planos manualmente e gerencia alunos via WhatsApp. A plataforma precisa ser mais útil que o WhatsApp + planilha para que ele não abandone. Quando o especialista tem 20+ alunos ativos na plataforma, o custo de sair é enorme — esse é o principal mecanismo de retenção B2B.

### Como saberemos que está pronto?
- [ ] Especialista recebe alerta quando aluno está em risco de abandono
- [ ] Dashboard mostra engajamento de todos os alunos em um só lugar
- [ ] Perfil público do especialista com resultados verificados de alunos
- [ ] Relatório semanal automático por aluno gerado pela IA
- [ ] Especialista consegue mandar mensagens para alunos dentro da plataforma

---

## Features por categoria

### 1. Inteligência sobre alunos (AI-powered)

**Alertas de risco de abandono**
A IA monitora padrões de cada aluno e avisa o especialista:

> "João não loga há 5 dias e perdeu 2 treinos consecutivos.
> Risco de abandono: Alto. Quer mandar uma mensagem?"

Triggers de alerta:
- 3+ dias sem abrir o app
- 2+ treinos consecutivos não registrados
- Queda > 30% no engajamento semanal vs média do aluno
- Check-in não feito quando estava agendado

**Insights de progresso por aluno**
Antes de cada sessão presencial, o especialista vê:
- Treinos completos vs planejados na semana
- PRs batidos
- Aderência à dieta (% das refeições logadas)
- Última nota de humor/energia do aluno
- Foto do último check-in

**Resumo semanal por aluno (gerado por IA)**
Todo domingo, a IA gera um resumo de cada aluno que o especialista pode revisar em 30 segundos ou encaminhar diretamente ao aluno com um toque.

---

### 2. Dashboard de negócio

**Visão geral da carteira**
- Total de alunos ativos vs inativos
- Taxa de engajamento média da carteira (% treinos completos)
- Alunos em risco (lista ordenada por urgência)
- Alunos com melhor performance (para destacar no perfil público)
- Receita mensal recorrente (quando integrado ao billing)

**Retenção de alunos**
- Tempo médio de permanência dos alunos
- Motivo de cancelamento (quando o aluno sai, pergunta o motivo)
- Comparativo mês a mês

---

### 3. Vitrine de resultados verificados

**Perfil público do especialista**
Cada especialista tem uma página pública (para o marketplace) com:
- Credenciais verificadas (CREF validado pela plataforma)
- Especialidades e metodologias
- Número de alunos ativos
- Tempo de experiência
- Avaliações de ex-alunos

**Portfólio de resultados**
Com consentimento do aluno, o especialista pode exibir:
- Fotos antes/depois dos check-ins (dados reais, não autodeclarados)
- Métricas: "Aluno X perdeu 8kg em 12 semanas"
- Badge "Resultado verificado pela plataforma" — impossível de falsificar

**Reviews de alunos**
Ao encerrar ou pausar o vínculo, aluno recebe convite para avaliar (1-5 + comentário). Reviews visíveis no perfil público.

---

### 4. Comunicação integrada

**Mensagens dentro da plataforma**
Chat direto entre especialista e aluno, sem precisar sair para o WhatsApp.
- Histórico completo de conversas
- Aluno pode mandar foto de refeição ou dúvida sobre o treino
- Especialista pode responder áudios curtos (futuro)
- Notificação push no mobile quando há nova mensagem

**Check-in semanal automatizado**
Especialista configura um check-in semanal automático para cada aluno:
> "Como foi sua semana, João? [1-5 estrelas] + [campo de texto]"
A IA consolida as respostas e entrega um resumo ao especialista.

---

### 5. Ferramentas de produtividade (AI-assisted)

**Geração de relatório de progresso**
Com 1 clique, a IA gera um relatório formatado do aluno para o período:
- Progresso em treinos, composição corporal, aderência
- Comparativo com objetivo inicial
- Recomendações para o próximo ciclo
- Pronto para enviar ao aluno ou imprimir

**Templates de planos reutilizáveis**
Especialista cria um plano, salva como template e aplica para alunos similares. A IA adapta automaticamente para o perfil de cada aluno (objetivo, nível, restrições).

---

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|---|---|---|
| `specialist_alerts` | SELECT, INSERT, UPDATE | **NOVA** — alertas gerados pela IA |
| `specialist_messages` | SELECT, INSERT | **NOVA** — mensagens entre especialista e aluno |
| `specialist_profiles_public` | SELECT, INSERT, UPDATE | **NOVA** — perfil público do especialista |
| `student_reviews` | SELECT, INSERT | **NOVA** — avaliações de alunos |
| `plan_templates` | SELECT, INSERT, UPDATE | **NOVA** — templates reutilizáveis |
| `workout_sessions` | SELECT | Dados de engajamento dos alunos |
| `meal_logs` | SELECT | Aderência à dieta |
| `student_checkins` | SELECT | Progresso visual |

---

## Fases de entrega

### Fase 1 — Alertas e dashboard (1 semana)
- [ ] Cron job diário que avalia engajamento de cada aluno
- [ ] `specialist_alerts` com lógica de triggers
- [ ] Dashboard web com visão de carteira e alertas
- [ ] Notificação push para o especialista quando aluno em risco

### Fase 2 — Comunicação integrada (1 semana)
- [ ] Chat especialista-aluno dentro da plataforma
- [ ] Check-in semanal automatizado configurável
- [ ] Notificações de novas mensagens (web + mobile)

### Fase 3 — Vitrine e reviews (1 semana)
- [ ] Perfil público do especialista
- [ ] Fluxo de consentimento para exibir resultados do aluno
- [ ] Reviews ao encerrar vínculo
- [ ] Badge de resultado verificado

### Fase 4 — Produtividade e relatórios (1 semana)
- [ ] Geração de relatório de progresso com 1 clique
- [ ] Templates de planos reutilizáveis
- [ ] Resumo semanal por aluno gerado automaticamente

---

## Checklist de done
- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/ai-specialist-engagement.md` criado
- [ ] `docs/STATUS.md` atualizado
- [ ] RLS configurado para todas as novas tabelas
