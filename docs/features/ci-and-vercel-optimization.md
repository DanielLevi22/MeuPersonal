# Feature: ci-and-vercel-optimization

**Status:** active
**PRD:** [ci-and-vercel-optimization](../PRDs/ci-and-vercel-optimization.md)
**Plataformas:** infra
**Última atualização:** 2026-04-12

---

## O que é

Otimização do pipeline de CI e do deploy Vercel para rodar apenas quando arquivos relevantes mudam.

## Por que existe

O CI rodava lint + testes do app e do web em todo commit (docs, fixes de qualquer tipo). O Vercel deployava em todo push, independente de haver mudança no frontend. Isso desperdiçava minutos de CI e gerava deploys desnecessários.

---

## Fluxo de dados

```
Push / PR aberto
  → job "changes" (dorny/paths-filter) detecta o que mudou
  → jobs de app só rodam se app/** ou packages/** mudaram
  → jobs de web só rodam se web/** ou packages/** mudaram
  → job "ci-success" agrega resultados — único required check no Branch Protection
  → Vercel: ignoreCommand verifica se web/** mudou antes de buildar
```

## Implementação

### `.github/workflows/ci.yml`

| Job | Condição de execução |
|-----|---------------------|
| `changes` | Sempre — detecta o que mudou via `dorny/paths-filter@v3` |
| `lint`, `typecheck`, `test` | Só se `app/**` ou `packages/**` mudaram |
| `web-lint`, `web-typecheck`, `web-test` | Só se `web/**` ou `packages/**` mudaram |
| `ci-success` | Sempre — agrega resultados, é o único required check |

### `web/vercel.json`

```json
{
  "ignoreCommand": "git diff HEAD^ HEAD --name-only | grep -qE '^web/' && exit 1 || exit 0"
}
```

Lógica do `ignoreCommand`:
- Vercel executa o comando antes de buildar
- **exit 0** → Vercel pula o build
- **exit 1** → Vercel executa o build
- `grep -qE '^web/'` retorna 0 se encontrou arquivos em web/, 1 se não encontrou
- `&& exit 1 || exit 0` inverte para a lógica que o Vercel espera

---

## Regras de negócio

1. Qualquer mudança em `packages/**` dispara CI de app E web (código compartilhado afeta ambos)
2. Mudanças só em `docs/**`, `.husky/`, `scripts/` ou raiz não disparam nenhum job de CI
3. O Branch Protection deve apontar para `✅ CI Passed` (job `ci-success`), não para jobs individuais

## Decisões técnicas não-óbvias

- **`dorny/paths-filter`**: action de terceiro para detectar mudanças por path. Alternativa seria usar `git diff` manual, mas essa action lida corretamente com PRs e force-pushes.
- **Job `ci-success` como gate único**: se o Branch Protection exigisse cada job individualmente, jobs com `if: false` (não executados) bloqueariam o merge. O job `ci-success` com `if: always()` resolve isso — ele sempre roda e verifica apenas os jobs relevantes.

## Branch Protection — configuração manual necessária

Após o merge deste PR, configurar no GitHub:

**Settings → Branches → Add rule → `main` e `development`:**
- [x] Require a pull request before merging
- [x] Require status checks to pass → adicionar: **`✅ CI Passed`**
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings
