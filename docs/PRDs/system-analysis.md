# PRD: system-analysis

**Data de criação:** 2026-04-12
**Status:** approved
**Branch:** feature/system-analysis
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Mapeamento completo do sistema — módulo por módulo — para entender o que existe, o que funciona, o que é código morto e quais perguntas de produto ainda estão em aberto. Resultado: `docs/SYSTEM_MAPPING.md` preenchido para todos os 7 módulos.

### Por quê?
O schema do banco foi redesenhado sem um mapeamento prévio do que o código realmente usa. Isso gerou retrabalho (tabelas modeladas antes de entender os fluxos reais). Antes de aplicar qualquer migration ou refatorar código, precisamos saber exatamente o que existe e o que pode ser deletado com segurança. Nunca presumir — sempre perguntar.

### Como saberemos que está pronto?
- [ ] Todos os 7 módulos em `docs/SYSTEM_MAPPING.md` com status `✅ Mapeado`
- [ ] Todas as perguntas pendentes de cada módulo respondidas (nenhum item `[ ]` em aberto)
- [ ] Lista consolidada de código morto preenchida com paths reais (não "A identificar")
- [ ] Decisões de schema de cada módulo registradas (prontas para virar migrations)
- [ ] Auth: perguntas P1–P5 respondidas

---

## Contexto

O projeto acumulou meses de iterações rápidas. Existem tabelas que nunca foram usadas, dois schemas de nutrição convivendo, fluxo de invite code implementado e depois abandonado (dead code em web e mobile), e múltiplos sistemas de execução de treino. Antes de reescrever o banco do zero, precisamos de um inventário honesto do que existe.

O arquivo `docs/SYSTEM_MAPPING.md` já foi criado com o módulo Auth parcialmente mapeado e as 5 perguntas pendentes (P1–P5) identificadas.

## Escopo

### Incluído
- Responder P1–P5 do módulo Auth (conversa com Daniel)
- Mapear módulos: Students, Nutrition, Workouts, Assessment, Gamification, Chat
- Para cada módulo: levantar contexto, responder perguntas de produto, identificar código morto com paths reais
- Registrar decisões de schema de cada módulo (rascunho, sem migrations ainda)
- Atualizar `docs/SYSTEM_MAPPING.md` a cada módulo fechado

### Fora do escopo (explicitamente)
- Escrever migrations — zero SQL nesta branch
- Refatorar código existente
- Deletar código morto — apenas identificar e listar
- Implementar qualquer feature nova

---

## Módulos a mapear

| Módulo | Status atual | Perguntas pendentes |
|--------|-------------|---------------------|
| Auth | 🔄 Em andamento | P1–P5 |
| Students | ⏳ Aguardando Auth | — |
| Nutrition | ⏳ Pendente | — |
| Workouts | ⏳ Pendente | — |
| Assessment | ⏳ Pendente | — |
| Gamification | ⏳ Pendente | — |
| Chat | ⏳ Pendente | — |

---

## Decisões técnicas

Este PRD é de análise, não de implementação. Não há código a escrever. O output é documentação em `docs/SYSTEM_MAPPING.md`.

Regra de trabalho: avançar para o próximo módulo **somente** quando o atual estiver com todas as perguntas respondidas. Nenhuma presunção — qualquer comportamento de negócio não confirmado pelo código vira pergunta ao Daniel.

---

## Checklist de done

> Só muda o Status para `done` quando TODOS estão marcados.

- [ ] Auth: P1–P5 respondidas e módulo marcado `✅ Mapeado`
- [ ] Students: mapeado com código morto identificado
- [ ] Nutrition: mapeado com código morto identificado
- [ ] Workouts: mapeado com código morto identificado
- [ ] Assessment: mapeado
- [ ] Gamification: mapeado (confirmar streaks bug)
- [ ] Chat: mapeado (confirmar o que vai pro PRD social vs core)
- [ ] Lista consolidada de código morto com paths reais
- [ ] PR mergeado em `development`
- [ ] `docs/STATUS.md` atualizado
