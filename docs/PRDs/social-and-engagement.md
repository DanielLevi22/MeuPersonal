# PRD: social-and-engagement

**Data de criação:** 2026-04-12
**Status:** draft — visão futura, não iniciar sem discussão de produto
**Branch:** — (não iniciado)
**Autor:** Daniel Levi

---

## Contexto

Feature de alto valor estratégico mas alto custo de implementação. Pode mudar de plataforma (Supabase → outro) antes de ser desenvolvida. Não bloquear o schema core por causa desta feature.

---

## As 3 perguntas obrigatórias

### O quê?
Camada social dentro do MeuPersonal: comunidade por grupo de trainer, feed de conquistas, ranking entre alunos, chat e sistema de notificações para engajamento contínuo.

### Por quê?
Retenção de alunos via engajamento social. Aluno que interage com outros alunos do mesmo trainer tem menor churn. O trainer se torna o hub de uma comunidade, não só um prestador de serviço.

### Como saberemos que está pronto?
*(a definir — depende das decisões de produto abaixo)*

---

## Decisões de produto pendentes

Estas perguntas precisam ser respondidas antes de qualquer modelagem de schema:

1. **Escopo da comunidade**
   - Alunos interagem só com colegas do mesmo trainer?
   - Existe feed global entre todos os alunos da plataforma?
   - O trainer participa da comunidade ou só modera?

2. **Ranking**
   - Por grupo do trainer (aluno vê só os colegas)?
   - Global da plataforma?
   - Por categoria (nutrição separado de treino)?

3. **Conteúdo**
   - Texto, fotos de progresso, vídeos?
   - Conquistas/treinos geram posts automáticos no feed?
   - Sistema de reações/comentários?

4. **Chat**
   - Apenas trainer ↔ aluno (DM)?
   - Aluno ↔ aluno também?
   - Grupo do trainer (broadcast)?

5. **Notificações**
   - Push via Expo Notifications?
   - In-app (badge + tela)?
   - WhatsApp/email para reengajamento?

6. **Infraestrutura**
   - Continua no Supabase (Realtime)?
   - Migra para plataforma dedicada (Stream, Sendbird, etc.)?
   - Custo estimado por usuário ativo?

---

## Visão arquitetural preliminar (não validada)

```
spaces (comunidade por trainer ou DM)
  type: enum (community, dm)
  owner_id: trainer ou null

posts
  space_id
  author_id
  type: enum (text, achievement, workout_log, photo)
  content / media

post_reactions
post_comments

notifications
  user_id
  type
  data: jsonb
  read_at
```

---

## Dependências

- Definir plataforma de infraestrutura (Supabase Realtime vs terceiro)
- Definir modelo de negócio: social é feature do plano pago?
- Custo de storage para mídia (fotos de progresso)

---

## Checklist de done

*(a preencher quando o PRD for promovido de draft para approved)*

- [ ] Decisões de produto respondidas
- [ ] Schema modelado e aprovado
- [ ] Custo de infraestrutura estimado
- [ ] PR mergeado em development
- [ ] docs/features/social-and-engagement.md criado
- [ ] docs/STATUS.md atualizado
