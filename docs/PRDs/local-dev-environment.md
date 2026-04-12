# PRD: local-dev-environment

**Data de criação:** 2026-04-12
**Status:** draft
**Branch:** — (aguardando database-audit-and-refactor)
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Configurar a arquitetura de 3 ambientes (Local → Preview → Production) com 2 projetos Supabase gratuitos e Vercel deployando por branch. Garantir que cada ambiente aponte para o banco correto e que seja impossível desenvolver contra o banco de produção por acidente.

### Por quê?
Hoje tudo aponta para o mesmo banco (produção). Um erro de migration em desenvolvimento afeta dados reais de usuários. Não há onde validar código integrado antes de chegar em produção. Com 2 projetos Supabase gratuitos isso é resolvido sem custo.

### Como saberemos que está pronto?
- [ ] Projeto **Preview** criado no Supabase com todas as migrations aplicadas
- [ ] Projeto **Production** criado no Supabase com todas as migrations aplicadas
- [ ] Variáveis de ambiente configuradas por contexto (local, preview, production)
- [ ] Vercel deploya Preview URL a partir de `development` com banco Preview
- [ ] Vercel deploya Produção a partir de `main` com banco Production
- [ ] App mobile em desenvolvimento aponta para banco Preview
- [ ] É impossível rodar localmente contra o banco de produção por acidente
- [ ] `docs/features/local-dev-environment.md` criado

---

## Arquitetura decidida (ADR-003)

```
LOCAL               →   PREVIEW              →   PRODUCTION
feature/* branches      development branch       main branch
Banco Preview           Supabase Projeto 1       Supabase Projeto 2
(ou CLI local)          Vercel Preview URL       Vercel Produção
```

| Branch | Ambiente | Supabase | Vercel |
|---|---|---|---|
| `feature/*` | Local | Projeto Preview | — |
| `development` | Preview | Projeto Preview | Preview URL |
| `main` | Production | Projeto Production | Production URL |

---

## Dependência crítica

> ⚠️ Este PRD depende do `database-audit-and-refactor` estar concluído primeiro.
> As migrations precisam estar limpas e versionadas antes de criar os projetos
> — `supabase db reset` deve funcionar do zero sem erros.

---

## Escopo

### Incluído
- Criar projeto **Preview** no Supabase Dashboard
- Criar projeto **Production** no Supabase Dashboard (se ainda não existe)
- Aplicar migrations limpas nos 2 projetos
- Configurar variáveis de ambiente:
  - `app/.env.development` → banco Preview
  - `web/.env.local` → banco Preview
  - GitHub Secrets → Preview e Production separados
- Configurar Vercel:
  - Branch `development` → Preview URL → banco Preview
  - Branch `main` → Production → banco Production
- Supabase CLI local (opcional, para desenvolvimento offline)

### Fora do escopo
- Ambiente de staging separado (2 projetos free cobrem o necessário)
- CI rodando contra banco real (testes usam mocks)
- Supabase Storage configuração (só se necessário)

---

## Variáveis de ambiente por contexto

### Mobile (`app/`)
```
.env.development   → EXPO_PUBLIC_SUPABASE_URL = URL do projeto Preview
.env.production    → EXPO_PUBLIC_SUPABASE_URL = URL do projeto Production
```

### Web (`web/`)
```
.env.local         → NEXT_PUBLIC_SUPABASE_URL = URL do projeto Preview
(production via Vercel env vars) → URL do projeto Production
```

### GitHub Secrets
```
EXPO_PUBLIC_SUPABASE_URL_PREVIEW    → projeto Preview
EXPO_PUBLIC_SUPABASE_ANON_KEY_PREVIEW

NEXT_PUBLIC_SUPABASE_URL_PREVIEW    → projeto Preview
NEXT_PUBLIC_SUPABASE_ANON_KEY_PREVIEW

EXPO_PUBLIC_SUPABASE_URL_PROD       → projeto Production
EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD

NEXT_PUBLIC_SUPABASE_URL_PROD       → projeto Production
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD
```

---

## Checklist de done

- [ ] Migrations limpas aplicadas nos 2 projetos sem erro
- [ ] App e web rodando localmente contra banco Preview (confirmado)
- [ ] Vercel deployando corretamente por branch
- [ ] GitHub Secrets configurados
- [ ] PR mergeado em `development`
- [ ] `docs/features/local-dev-environment.md` criado
- [ ] `docs/STATUS.md` atualizado
