# 🚀 Guia de Configuração CI/CD

Este projeto usa **GitHub Actions** + **EAS (Expo Application Services)** para CI/CD.

## 📋 Workflows

| Workflow | Trigger | O que faz |
|---|---|---|
| `ci.yml` | Push / PR em `main` ou `develop` | Lint → TypeCheck → Testes → Preview Build |
| `release.yml` | Push de tag `vX.X.X` | Valida → Build Production → Submit Google Play → GitHub Release |

---

## 🔧 Configuração Inicial

### 1. Secrets no GitHub

Vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret | Onde obter |
|---|---|
| `EXPO_TOKEN` | [expo.dev → Access Tokens](https://expo.dev/accounts/%5Baccount%5D/settings/access-tokens) |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `EXPO_PUBLIC_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |

### 2. Google Play (para Submit)

Para o submit automático funcionar, adicione também:

| Secret | Onde obter |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Play Console → Setup → API access |

E configure no `eas.json`:
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

### 3. EAS Project

Certifique-se que o `app.json` tem o `projectId` correto:
```json
"extra": {
  "eas": { "projectId": "cfcc0b23-987d-4039-9679-dab9739f6552" }
}
```

---

## 🔁 Como fazer um Release

```bash
# 1. Garantir que está na main com tudo atualizado
git checkout main
git pull

# 2. Criar uma tag de versão
git tag v1.0.1
git push origin v1.0.1

# 3. O pipeline dispara automaticamente!
```

O workflow irá:
1. ✅ Rodar lint, typecheck e testes
2. 📦 Fazer build production via EAS
3. 📲 Submeter ao Google Play (Internal Track)
4. 📝 Criar GitHub Release com changelog automático

---

## 🧪 Rodando localmente

```bash
# Testes unitários
npm test

# Testes com cobertura
npm run test:coverage

# Lint
npm run lint

# Lint com auto-correção
npm run lint:fix
```
