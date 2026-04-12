# PRD: ci-and-vercel-optimization

**Data de criação:** 2026-04-12
**Status:** done
**Branch:** — (a criar via new-feature.js)
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
1. Impedir que o Vercel faça deploy quando nenhum arquivo do `web/` mudou
2. Adicionar path filters no CI para não rodar jobs desnecessários
3. Configurar Branch Protection no GitHub para bloquear merge sem CI verde

### Por quê?
- Vercel roda build a cada commit (docs, app, qualquer coisa) — desperdício de build minutes e deploys desnecessários
- CI roda lint + testes do app e do web mesmo quando só um doc mudou — lento e desnecessário
- Não há nada impedindo merge de código quebrado no GitHub — o CI existe mas não é obrigatório

### Como saberemos que está pronto?
- [ ] Commit que altera só `app/` não dispara build no Vercel
- [ ] Commit que altera só `docs/` não roda nenhum job de CI
- [ ] PR com CI falhando não pode ser mergeado em `development` nem em `main`
- [ ] PR com CI passando pode ser mergeado normalmente

---

## Escopo

### Incluído
- `web/vercel.json` com `ignoreCommand` para skip de builds sem mudança no web
- `.github/workflows/ci.yml` com path filters por job (app vs web vs docs)
- Passo a passo para configurar Branch Protection no GitHub Settings (manual)

### Fora do escopo
- Mover o deploy do Vercel para dentro do GitHub Actions (pode ser feito depois)
- Alterar os release workflows (`release-app.yml`, `release-web.yml`)

---

## Detalhes técnicos acordados

### Vercel ignoreCommand
```json
{
  "ignoreCommand": "git diff HEAD^ HEAD --name-only | grep -qE '^web/' && exit 1 || exit 0"
}
```
Lógica: exit 1 → Vercel builda | exit 0 → Vercel pula.

### CI path filters
```
Mudou web/**     → roda web-lint + web-typecheck + web-test
Mudou app/**     → roda lint + typecheck + test
Mudou ambos      → roda tudo
Mudou só docs/** → não roda nada
```

### Branch Protection (configuração manual no GitHub)
Jobs obrigatórios para `main` e `development`:
- `🔍 [App] Lint & Format`
- `🔎 [App] TypeScript Check`
- `🧪 [App] Unit Tests`
- `🔍 [Web] Lint & Format`
- `🔎 [Web] TypeScript Check`
- `🧪 [Web] Unit Tests`

---

## Checklist de done

- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] Branch Protection configurado no GitHub (manual)
- [ ] `docs/STATUS.md` atualizado
