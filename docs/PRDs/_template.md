# PRD: {{FEATURE_NAME}}

**Data de criação:** {{DATE}}
**Status:** draft | approved | in-progress | done
**Branch:** feature/{{FEATURE_NAME}}
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

> Nenhuma linha de código é escrita sem estas 3 perguntas respondidas.

### O quê?
<!-- Descrição objetiva em 1-2 frases do que será construído. -->

### Por quê?
<!-- Qual problema do usuário isso resolve. Qual o valor de negócio. -->

### Como saberemos que está pronto?
<!-- Critérios de aceitação verificáveis. Se não dá pra testar, não é critério. -->
- [ ] critério 1
- [ ] critério 2
- [ ] critério 3

---

## Contexto

<!-- Qual é o estado atual? O que motivou esta feature agora? -->

## Escopo

### Incluído
- item 1
- item 2

### Fora do escopo (explicitamente)
- item que pode parecer óbvio mas NÃO será feito nesta entrega
- melhorias futuras vão aqui, não na implementação

---

## Fluxo de dados

```
[Trigger/Ação do usuário]
  → [Componente/Screen]
  → [Hook / Mutation]
  → [Service / Supabase]
  → [Tabela do banco]
  ← [Retorno / Estado atualizado]
```

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `nome_tabela` | SELECT / INSERT / UPDATE / DELETE | nota relevante |

## Impacto em outros módulos

<!-- Esta feature afeta outros módulos? Quais? Como? -->
- Nenhum | ou listar módulos afetados

---

## Decisões técnicas

<!-- Decisões não-óbvias que precisam ser registradas. Ex: por que usar X e não Y. -->

---

## Checklist de done

> Só muda o Status para `done` quando TODOS estão marcados.

- [ ] Código funciona e passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/{{FEATURE_NAME}}.md` criado ou atualizado
- [ ] `docs/STATUS.md` atualizado
