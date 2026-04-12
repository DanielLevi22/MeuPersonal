# Feature: {{FEATURE_NAME}}

**Status:** active | deprecated
**PRD:** [{{FEATURE_NAME}}](../PRDs/{{FEATURE_NAME}}.md)
**Plataformas:** web | mobile | ambos
**Última atualização:** {{DATE}}

---

## O que é

<!-- Uma frase descrevendo o que esta feature faz para o usuário final. -->

## Por que existe

<!-- Qual problema resolve. Qual o valor de negócio. -->

---

## Fluxo de dados

```
[Ação do usuário]
  → [Componente/Screen]
  → [Hook]
  → [Supabase / Service]
  → [Tabela]
  ← [Cache invalidado / Estado atualizado]
```

## Tabelas do banco

| Tabela | Operações | RLS ativo |
|--------|-----------|-----------|
| `nome_tabela` | SELECT, INSERT | ✅ |

---

## Implementação

### Web (`web/src/modules/{{module}}/`)

| Tipo | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Page | `app/dashboard/...` | — |
| Component | `components/...` | — |
| Hook | `hooks/...` | — |

### Mobile (`app/src/modules/{{module}}/`)

| Tipo | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Screen | `screens/...` | — |
| Hook | `hooks/...` | — |
| Store | `store/...` | — |

---

## Regras de negócio

<!-- Lista das regras que governam esta feature. Cada regra deve ser verificável. -->
1. Regra 1: descrição
2. Regra 2: descrição

## Decisões técnicas não-óbvias

<!-- Explica escolhas que não são óbvias pela leitura do código. -->
- **Decisão**: motivo

## Divergências web ↔ mobile

<!-- Qualquer comportamento diferente entre as duas plataformas. Idealmente: nenhum. -->
- Nenhuma | ou listar divergências
