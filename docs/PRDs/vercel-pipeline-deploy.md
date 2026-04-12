# PRD: vercel-pipeline-deploy

**Data de criação:** 2026-04-12
**Status:** done
**Branch:** feature/ci-and-vercel-optimization
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Remover a integração Git automática do Vercel e passar o controle total dos deploys para o GitHub Actions via Vercel CLI. Preview deploya a partir de `development` com banco Preview. Production deploya a partir de `main` com banco Production.

### Por quê?
Com a integração Git do Vercel, ele deploya em qualquer push sem controle sobre qual banco usa. Passando para GitHub Actions, cada deploy injeta explicitamente as variáveis corretas por ambiente, garantindo que `development` nunca acesse o banco de produção.

### Como saberemos que está pronto?
- [ ] Push em `development` com mudança em `web/` → deploya automaticamente na Preview URL com banco Preview
- [ ] Push em `main` com mudança em `web/` → deploya automaticamente em produção com banco Production
- [ ] Push em `app/` ou `docs/` → Vercel não deploya nada
- [ ] O Vercel não tem mais integração Git ativa (não age sozinho)

---

## Decisão técnica

**Vercel CLI via GitHub Actions** (`vercel pull` → `vercel build` → `vercel deploy --prebuilt`)

- `vercel pull` → baixa a configuração do projeto Vercel
- `vercel build` → builda com `NEXT_PUBLIC_*` injetados pelo GitHub Actions
- `vercel deploy --prebuilt` → envia o build já pronto para o Vercel

`NEXT_PUBLIC_*` precisam estar presentes no momento do build (não apenas no runtime).
Por isso o build acontece no GitHub Actions com os secrets corretos, não no Vercel.

## Secrets necessários (já adicionados no GitHub)

| Secret | Usado em |
|---|---|
| `VERCEL_TOKEN` | Autenticação CLI |
| `VERCEL_ORG_ID` | Identificação da conta |
| `VERCEL_PROJECT_ID` | Identificação do projeto |
| `NEXT_PUBLIC_SUPABASE_URL_PREVIEW` | Build do preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_PREVIEW` | Build do preview |
| `NEXT_PUBLIC_SUPABASE_URL_PROD` | Build de produção |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD` | Build de produção |

## Escopo

### Incluído
- Atualizar `release-web.yml` com steps reais de deploy via Vercel CLI
- Atualizar `vercel.json` removendo `ignoreCommand` (não é mais necessário)
- Instruções para desconectar integração Git no Vercel Dashboard

### Fora do escopo
- Configuração dos projetos Supabase Preview e Production (PRD: local-dev-environment)
- GitHub Release automation (já existe no workflow)

---

## Checklist de done

- [ ] `release-web.yml` deployando via Vercel CLI
- [ ] `vercel.json` atualizado
- [ ] Integração Git desconectada no Vercel Dashboard (manual)
- [ ] PR mergeado em `development`
- [ ] `docs/features/vercel-pipeline-deploy.md` criado
- [ ] `docs/STATUS.md` atualizado
