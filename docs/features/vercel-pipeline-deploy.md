# Feature: vercel-pipeline-deploy

**Status:** active
**PRD:** [vercel-pipeline-deploy](../PRDs/vercel-pipeline-deploy.md)
**Plataformas:** infra
**Última atualização:** 2026-04-12

---

## O que é

Deploy do frontend web controlado inteiramente pelo GitHub Actions via Vercel CLI. O Vercel não tem integração Git ativa — cada deploy é disparado explicitamente pela pipeline com as variáveis de ambiente corretas por ambiente.

## Por que existe

Com a integração Git automática do Vercel, qualquer push deployava sem controle de qual banco usava. Agora cada deploy injeta `NEXT_PUBLIC_SUPABASE_URL` correto: banco Preview para `development`, banco Production para `main`.

---

## Fluxo de dados

```
Push em development (web/** mudou)
  → release-web.yml dispara
  → validate (lint + typecheck)
  → vercel pull (config do projeto)
  → vercel build (com SUPABASE_URL_PREVIEW injetado)
  → vercel deploy --prebuilt → Preview URL

Push em main (web/** mudou)
  → release-web.yml dispara
  → validate (lint + typecheck)
  → vercel pull (config do projeto)
  → vercel build --prod (com SUPABASE_URL_PROD injetado)
  → vercel deploy --prebuilt --prod → Produção
```

## Implementação

### `.github/workflows/release-web.yml`

| Job | Condição | Banco |
|-----|----------|-------|
| `validate` | Sempre (lint + typecheck) | — |
| `deploy-preview` | Push em `development` | Preview |
| `deploy-production` | Push em `main` ou tag `web/v*` | Production |
| `github-release` | Tag `web/v*` apenas | — |

### `web/vercel.json`
Contém apenas `{ "framework": "nextjs" }`. O `ignoreCommand` foi removido — o Vercel não assiste mais o repositório.

## Secrets necessários (GitHub)

| Secret | Ambiente |
|---|---|
| `VERCEL_TOKEN` | Ambos |
| `VERCEL_ORG_ID` | Ambos |
| `VERCEL_PROJECT_ID` | Ambos |
| `NEXT_PUBLIC_SUPABASE_URL_PREVIEW` | Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_PREVIEW` | Preview |
| `NEXT_PUBLIC_SUPABASE_URL_PROD` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD` | Production |

## Decisões técnicas não-óbvias

- **`vercel build` antes de `vercel deploy --prebuilt`**: `NEXT_PUBLIC_*` vars são injetadas em tempo de build (não runtime). Se deixarmos o Vercel buildar, ele não teria acesso aos secrets do GitHub. Por isso buildamos no Actions e deployamos o output já pronto.
- **`vercel pull` obrigatório**: sem ele o CLI não sabe a configuração do projeto (framework, regiões, etc.) e o build falha.

## Configuração manual necessária no Vercel Dashboard

Desconectar a integração Git para o Vercel não deployar por conta própria:
```
Vercel Dashboard → projeto → Settings → Git → Disconnect
```
