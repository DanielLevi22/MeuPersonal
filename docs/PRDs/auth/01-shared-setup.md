# PRD: auth-shared-setup

**Data de criação:** 2026-04-13
**Status:** approved
**Branch:** feature/auth-shared-setup
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Criar o pacote `shared/` na raiz do monorepo com `AuthService`, `authStore` e tipos compartilhados, de forma que tanto `app/` (React Native) quanto `web/` (Next.js) importem a mesma lógica via `@meupersonal/shared`.

### Por quê?
Sem `shared/`, AuthService e authStore serão duplicados — dois lugares para manter a mesma lógica de autenticação. Qualquer bug ou mudança de contrato do Supabase precisaria ser corrigida em dois arquivos. O `shared/` é o prerequisito para qualquer feature do Auth (e módulos seguintes).

### Como saberemos que está pronto?
- [ ] `shared/src/` existe na raiz do monorepo com a estrutura definida
- [ ] `@meupersonal/shared` importável em `app/` e `web/` via path alias no tsconfig
- [ ] `AuthService` com métodos: `signIn`, `signUp`, `signOut`, `getSession`, `resetPassword`
- [ ] `authStore` (Zustand) com: `user`, `profile`, `session`, `isLoading`, `setSession`, `clearSession`
- [ ] Tipos exportados: `Profile`, `AccountType`, `ServiceType`, `AuthState`
- [ ] `tsc --noEmit` limpo em `app/` e `web/`
- [ ] `biome check` limpo

---

## Contexto

O monorepo tem `app/` (Expo) e `web/` (Next.js). Ambos já têm pacotes internos em `src/packages/` (core, supabase), referenciados por path alias no tsconfig. O `shared/` seguirá o mesmo padrão — sem npm workspaces, apenas path alias apontando para `../../shared/src`.

## Escopo

### Incluído
- Estrutura de pastas `shared/src/`
- `AuthService` — chamadas ao Supabase Auth
- `authStore` — Zustand store de autenticação
- Tipos base de Auth: `Profile`, `AccountType`, `ServiceType`, `AuthState`
- `tsconfig.json` em `shared/` para type-checking isolado
- Path alias `@meupersonal/shared` em `app/tsconfig.json` e `web/tsconfig.json`

### Fora do escopo
- Componentes de UI de auth (telas, formulários) — vão em `app/` e `web/` separadamente
- CASL abilities (entram junto com a feature de login)
- Lógica de masquerade (feature 5 do auth)
- Qualquer outro módulo além de Auth

---

## Estrutura de arquivos

```
shared/
  src/
    services/
      auth.service.ts       → AuthService (signIn, signUp, signOut, getSession, resetPassword)
    stores/
      auth.store.ts         → Zustand authStore
    types/
      auth.types.ts         → Profile, AccountType, ServiceType, AuthState
    index.ts                → re-exporta tudo
  tsconfig.json
```

## Fluxo de dados

```
app/ ou web/
  → import { AuthService } from '@meupersonal/shared'
  → AuthService.signIn(email, password)
  → supabase.auth.signInWithPassword()
  ← { data: { session, user }, error }
```

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `profiles` | SELECT | Buscar perfil após login |
| `professional_services` | SELECT | Buscar tipos de serviço do profissional |

## Impacto em outros módulos

- Todos os módulos de auth dependerão deste pacote
- Nenhum módulo existente é alterado nesta feature

---

## Decisões técnicas

- **Path alias vs npm workspace**: usa path alias (`../../shared/src`) para manter consistência com o padrão já existente (`core`, `supabase`). Npm workspaces adicionaria complexidade sem benefício real neste momento.
- **Supabase client**: `AuthService` recebe o cliente Supabase como parâmetro ou importa de `@meupersonal/supabase` — manter compatibilidade com o cliente existente.
- **Zustand sem persistência no shared/**: a persistência (MMKV no mobile, localStorage no web) é configurada em cada plataforma ao criar o store, não no shared/.

---

## Checklist de done

> Só muda o Status para `done` quando TODOS estão marcados.

- [ ] Código funciona e passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/auth-shared-setup.md` criado ou atualizado
- [ ] `docs/STATUS.md` atualizado
