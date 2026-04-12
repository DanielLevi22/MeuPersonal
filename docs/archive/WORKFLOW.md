# 🔄 Fluxo de Trabalho — MeuPersonal

Documentação completa do workflow de desenvolvimento, ambientes e deploy do app.

---

## 🌍 Ambientes

O projeto possui **3 ambientes separados**, cada um com sua própria instância Supabase:

| Ambiente | Branch | Supabase | Quem usa |
|---|---|---|---|
| **Development** | local / feature branches | Projeto dev | Desenvolvedores |
| **Preview** | `develop` | Projeto staging | QA / homologação |
| **Production** | `main` + tags `vX.X.X` | Projeto produção | Usuários finais |

---

## 🌿 Estratégia de Branches

```
main          ← produção estável, protegida
  └─ develop  ← integração / staging
       └─ feature/nome-da-feature   ← desenvolvimento
       └─ fix/nome-do-bug
       └─ chore/tarefa-de-infra
```

### Fluxo padrão

```
1. Criar branch a partir de develop
   git checkout develop
   git checkout -b feature/minha-feature

2. Desenvolver e fazer commits (Conventional Commits)
   git commit -m "feat: adicionar tela de ranking"

3. Abrir PR para develop → passa pelo CI
   CI: Lint + TypeCheck + Testes

4. Após aprovação + merge em develop:
   → Build automático EAS Preview (APK staging)
   → Time de QA testa no ambiente staging

5. Quando develop está estável → PR para main
   → Build automático EAS Production

6. Para release oficial → criar tag
   git tag v1.0.1
   git push origin v1.0.1
   → Submit automático Google Play (Internal Track)
   → GitHub Release criado automaticamente
```

---

## 🤖 Pipelines CI/CD

### CI (`ci.yml`) — Roda em todo PR/push

| Trigger | Jobs |
|---|---|
| Push em `main` ou `develop` | Lint → TypeCheck → Testes |
| PR aberto para `main` ou `develop` | Lint → TypeCheck → Testes |

### Release (`release.yml`) — Builds e Deploy

| Trigger | Jobs executados |
|---|---|
| Push em `develop` | Validate → **Build Preview** (EAS staging) |
| Push em `main` | Validate → **Build Production** (EAS prod) |
| Tag `vX.X.X` | Validate → Build Production → **Submit Google Play** → **GitHub Release** |

---

## 📦 Perfis EAS (`eas.json`)

| Perfil | Tipo | Distribuição | Variáveis |
|---|---|---|---|
| `development` | Dev client | Interna | Supabase DEV |
| `preview` | APK release | Interna | Supabase STAGING |
| `production` | APK release | Google Play | Supabase PROD |

---

## 🔐 Secrets (GitHub Actions)

Configure em **Settings → Secrets and variables → Actions**:

| Secret | Ambiente | Descrição |
|---|---|---|
| `EXPO_TOKEN` | Todos | Token da conta expo.dev |
| `EXPO_PUBLIC_SUPABASE_URL_DEV` | Dev/CI | URL do projeto Supabase dev |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV` | Dev/CI | Anon key do Supabase dev |
| `EXPO_PUBLIC_SUPABASE_URL_PREVIEW` | Preview | URL do projeto Supabase staging |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY_PREVIEW` | Preview | Anon key do Supabase staging |
| `EXPO_PUBLIC_SUPABASE_URL_PROD` | Production | URL do projeto Supabase prod |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD` | Production | Anon key do Supabase prod |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Todos | Google AI Studio API Key |

---

## 📝 Conventional Commits

Todo commit **deve** seguir o padrão (validado automaticamente pelo Husky):

```
<tipo>: <descrição curta em minúsculas>

[corpo opcional]
```

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Apenas documentação |
| `style` | Formatação, sem mudança de lógica |
| `refactor` | Refatoração |
| `perf` | Melhoria de performance |
| `test` | Adicionar/corrigir testes |
| `chore` | Manutenção, atualização de deps |
| `ci` | Mudanças em CI/CD |
| `revert` | Reverter commit anterior |

### Exemplos

```bash
# ✅ Correto
git commit -m "feat: adicionar tela de ranking semanal"
git commit -m "fix: corrigir badge de convite expirado"
git commit -m "chore: atualizar expo para 54.0.31"
git commit -m "test: adicionar testes para fetchStudents"

# ❌ Bloqueado pelo hook
git commit -m "ajustes"
git commit -m "WIP"
git commit -m "correção"
```

---

## 🚀 Como fazer uma Release

```bash
# 1. Garantir que develop está estável e testado
git checkout develop
git pull

# 2. Criar PR develop → main e aprovar
# (build production roda automaticamente ao merge)

# 3. Criar tag de versão na main
git checkout main
git pull
git tag v1.2.0
git push origin v1.2.0

# Automaticamente vai:
# → Build EAS production
# → Submit ao Google Play (Internal Track)
# → Criar GitHub Release com changelog
```

### Versionamento semântico (`vMAJOR.MINOR.PATCH`)

| Tipo | Quando incrementar |
|---|---|
| `MAJOR` | Mudança incompatível (ex: novo login) |
| `MINOR` | Nova funcionalidade retrocompatível |
| `PATCH` | Correção de bug retrocompatível |

---

## 🧪 Testes Locais

```bash
# Unit tests
npm test

# Unit tests com cobertura
npm run test:coverage

# E2E (Maestro) — requer app rodando
npm run test:e2e

# Lint
npm run lint

# Lint + auto-fix
npm run lint:fix
```

---

## 🛡️ Proteção de Branches (configurar no GitHub)

Settings → Branches → Add rule:

| Branch | Regra |
|---|---|
| `main` | Require PR, Require status checks: lint + typecheck + test |
| `develop` | Require PR, Require status checks: lint + typecheck + test |

---

## 📁 Estrutura de Arquivos Relevantes

```
.github/
├── workflows/
│   ├── ci.yml                  # Pipeline de CI (lint + tests)
│   └── release.yml             # Pipeline de Release (build + deploy)
├── CODEOWNERS                  # Revisores por área de código
├── dependabot.yml              # Atualizações automáticas de deps
└── pull_request_template.md    # Template padrão para PRs

.husky/
├── pre-commit                  # Roda lint antes de todo commit
└── commit-msg                  # Valida mensagem com commitlint

.env.development                # Variáveis do ambiente dev
.env.preview                    # Variáveis do ambiente staging
.env.production                 # Variáveis do ambiente produção
eas.json                        # Configuração dos perfis EAS
commitlint.config.js            # Regras de conventional commits
CHANGELOG.md                    # Histórico de versões
```

---

## ✅ Checklist de Configuração — GitHub

> Tudo que precisa ser feito **manualmente no GitHub** para ativar o workflow completo.

---

### 1️⃣ Secrets (GitHub Actions)

📍 **Settings → Secrets and variables → Actions → New repository secret**

Adicionar um por um:

| # | Nome do Secret | Onde obter o valor |
|---|---|---|
| 1 | `EXPO_TOKEN` | [expo.dev → Account → Access Tokens](https://expo.dev/accounts/daniellevi98/settings/access-tokens) |
| 2 | `EXPO_PUBLIC_SUPABASE_URL_DEV` | Supabase (projeto dev) → Settings → API → Project URL |
| 3 | `EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV` | Supabase (projeto dev) → Settings → API → anon public key |
| 4 | `EXPO_PUBLIC_SUPABASE_URL_PREVIEW` | Supabase (projeto staging) → Settings → API → Project URL |
| 5 | `EXPO_PUBLIC_SUPABASE_ANON_KEY_PREVIEW` | Supabase (projeto staging) → Settings → API → anon public key |
| 6 | `EXPO_PUBLIC_SUPABASE_URL_PROD` | Supabase (projeto prod) → Settings → API → Project URL |
| 7 | `EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD` | Supabase (projeto prod) → Settings → API → anon public key |
| 8 | `EXPO_PUBLIC_GEMINI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |

> ⚠️ Você precisa de **pelo menos 2 projetos no Supabase**: um para dev/preview e um para produção.
> O ideal é ter 3 projetos separados (dev, preview, prod).

---

### 2️⃣ Proteção de Branches

📍 **Settings → Branches → Add branch ruleset** (ou "Add classic branch protection rule")

**Para a branch `main`:**
- [x] Require a pull request before merging
- [x] Require approvals: **1**
- [x] Require status checks to pass before merging
  - Adicionar: `lint`, `typecheck`, `test`
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

**Para a branch `develop`:**
- [x] Require a pull request before merging
- [x] Require status checks to pass before merging
  - Adicionar: `lint`, `typecheck`, `test`

---

### 3️⃣ Ativar Dependabot

📍 **Settings → Security → Code security and analysis**

- [x] Dependabot alerts → **Enable**
- [x] Dependabot security updates → **Enable**
- [x] Dependabot version updates → **Enable** *(já configurado pelo `dependabot.yml`)*

---

### 4️⃣ Google Play — Service Account (para submit automático)

> Necessário apenas para o submit automático ao Google Play.

📍 **Google Play Console → Setup → API access**

1. Criar projeto no Google Cloud vinculado ao Play Console
2. Criar **Service Account** com permissão "Release Manager"
3. Baixar o arquivo JSON da chave
4. Adicionar o conteúdo JSON como secret no GitHub:

| Secret | Descrição |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Conteúdo do arquivo JSON da service account |

5. Atualizar `eas.json` → perfil `production` → submit:

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "$GOOGLE_SERVICE_ACCOUNT_KEY",
      "track": "internal"
    }
  }
}
```

---

### 5️⃣ Expo — Projeto EAS

📍 [expo.dev → Projects](https://expo.dev/accounts/daniellevi98/projects)

- [ ] Verificar que o projeto `MeuPersonal` existe (projectId: `cfcc0b23-987d-4039-9679-dab9739f6552`)
- [ ] Gerar `EXPO_TOKEN` em Account → Access Tokens → **Create Token**

---

### 6️⃣ Criar branch `develop` no repositório

```bash
git checkout -b develop
git push origin develop
```

---

### Resumo do que ativa cada item

| Item configurado | O que desbloqueia |
|---|---|
| Secrets Supabase + Expo Token | Pipelines CI e Release funcionando |
| Branch protection | PRs obrigatórias, CI bloqueia merge com falha |
| Dependabot | PRs automáticas de atualização de deps |
| Google Service Account | Submit automático ao Google Play |
| Branch `develop` criada | Trigger de build preview (staging) |
