# CLAUDE.md — MeuPersonal

Guia operacional para o agente. Leia antes de qualquer sessão de trabalho.

---

## O que é o produto

SaaS para Personal Trainers gerenciarem alunos, treinos e nutrição.

- **Personal Trainer** paga R$ 89–129/mês (alunos ilimitados, gratuitos)
- **Modelo**: trial 14–30 dias → assinatura recorrente via Stripe (cartão) + Asaas (PIX/boleto)
- **Target de lançamento**: Abril 2026
- **Status atual**: ~75% das features core implementadas

---

## Stack — decisões trancadas, não reabrir

| Camada | Decisão |
|---|---|
| Mobile | React Native + Expo + Expo Router (file-based) |
| Web | Next.js 16 |
| Estado global | Zustand + MMKV (persistência) |
| Estado servidor | TanStack Query (cache, loading, error) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| ORM | Drizzle ORM + drizzle-kit |
| Estilização | Tailwind CSS / NativeWind |
| Acesso | CASL (frontend) + RLS Supabase (banco) |
| Pagamentos | Stripe + Asaas — não implementado ainda |
| Linting | Biome 2.4.10 (config raiz: `/biome.json`) |
| Testes mobile | Jest (unit) + Maestro (E2E) |
| Testes web | Vitest + @testing-library/react |

---

## Arquitetura do monorepo

```
/app          → React Native (Expo)
/web          → Next.js dashboard (para personal trainers)
/docs         → Documentação do projeto
```

### Estrutura de módulos (feature-based)

Cada feature é um módulo isolado. **Nunca crie arquivos fora dessa estrutura sem aprovação.**

```
src/modules/<feature>/
  components/   → UI do módulo
  screens/      → Telas (mobile) ou pages/ (web)
  hooks/        → Custom hooks
  store/        → Zustand store
  services/     → Lógica de negócio / chamadas Supabase
  types.ts      → Tipos do módulo
  index.ts      → API pública — único ponto de entrada
```

### Regras de comunicação entre módulos

```
✅ Módulo → shared/
✅ Módulo → @meupersonal/core ou @meupersonal/supabase
✅ Screen  → Módulo (via index.ts)
❌ Módulo  → Módulo (importação direta proibida)
❌ shared/ → Módulo
```

Comunicação entre módulos: via Zustand store global ou props. Auth é exceção (global).

### Path aliases

```ts
// Mobile (app/)
@/*                   → ./src/*
@/modules/*           → ./src/modules/*
@/nutrition           → ./src/modules/nutrition
@/workout             → ./src/modules/workout
@/students            → ./src/modules/students
@/auth                → ./src/modules/auth
@meupersonal/core     → ./src/packages/core
@meupersonal/supabase → ./src/packages/supabase

// Web (web/)
@/*                   → ./src/*
@/workout             → ./src/modules/workouts  (pasta é plural no web)
@/nutrition           → ./src/modules/nutrition
@meupersonal/core     → ./src/packages/core
```

### Naming conventions

| Tipo | Convenção | Exemplo |
|---|---|---|
| Módulos/pastas | lowercase | `workout`, `nutrition` |
| Componentes | PascalCase | `MealCard`, `RestTimer` |
| Hooks | camelCase + prefixo `use` | `useWorkoutTimer` |
| Stores | camelCase + sufixo `Store` | `nutritionStore` |
| Services | PascalCase + sufixo `Service` | `WorkoutAIService` |
| Tipos/interfaces | PascalCase | `WorkoutItem`, `DietPlan` |

---

## Regras do agente — comportamento obrigatório

### Antes de implementar qualquer coisa
1. **Ler contexto**: Verificar `CLAUDE.md` e o arquivo relevante do módulo
2. **Propor abordagem**: "Minha proposta é X — concordas?" antes de qualquer mudança estrutural
3. **Confirmar antes de**: criar novos arquivos, instalar libs, modificar schema do banco

### Durante a implementação
- Fazer **exatamente o que foi pedido** — não refatorar B ou C enquanto resolve A
- **Não inventar features** — se ficou ambíguo, perguntar
- Ao terminar, verificar se não deixou arquivos temporários ou console.log de debug
- **Nunca usar `any`** — se o tipo não é conhecido, criar interface ou usar `unknown`

### Sinalizar antes de prosseguir se
- A mudança afeta mais de um módulo
- Vai instalar uma nova dependência
- O arquivo resultante vai ter mais de 300 linhas
- A abordagem parece over-engineered para o problema

---

## Convenções de código — Mobile (Expo)

### Expo Router — rotas

```tsx
// ✅ SEMPRE tipado
router.push('/(tabs)/workouts' as never);
// ou melhor:
import { ROUTES } from '@/shared/constants/routes';
router.push(ROUTES.WORKOUTS);

// ❌ NUNCA string solta
router.push('/workouts');
```

**Nunca use string literal solta em `router.push`.** Rotas são tipadas ou constantes.

### Ícones

Usar exclusivamente `@expo/vector-icons`:
```tsx
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ✅ Correto
<Ionicons name="barbell-outline" size={24} color="#FF6B35" />
```

### Estilização — REGRA ABSOLUTA no mobile

```tsx
// ✅ SEMPRE assim
<View className="bg-surface p-4 rounded-2xl">
  <Text className="text-foreground text-lg">Texto</Text>
</View>

// ❌ NUNCA assim
<View style={{ backgroundColor: '#141B2D', padding: 16 }}>
<View style={styles.container}>  // StyleSheet proibido
<View className="bg-[#141B2D]">  // Cores hardcoded proibidas
```

Use sempre os tokens do design system definidos em `tailwind.config.js`:
`bg-background`, `bg-surface`, `bg-primary`, `bg-accent`, `text-foreground`, `text-muted`, `border-border`, etc.

Use `cn()` para classes condicionais:
```ts
import { cn } from '@/lib/utils'; // mobile
import { cn } from '@/shared/utils/cn'; // web
```

## Convenções de código — Web (Next.js)

### Server vs Client Components

```tsx
// Client component — marcar SEMPRE explicitamente quando necessário
'use client';
export function LoginForm() { ... }

// Server component — padrão no App Router, sem diretiva
export function UserTable() { ... }  // server por padrão

// Regra: só use 'use client' quando precisar de:
// useState, useEffect, event handlers, browser APIs
```

### App Router — estrutura de rotas

```
web/src/app/
  (auth)/         → grupo de rotas de auth (sem prefixo na URL)
  (admin)/        → grupo de rotas admin
  dashboard/      → rotas do dashboard
  api/            → API routes
  layout.tsx      → layout raiz
  page.tsx        → página inicial
```

### Data fetching no web

```tsx
// Server Component — fetch direto (sem TanStack Query)
async function Page() {
  const data = await supabase.from('workouts').select('*');
  return <WorkoutList data={data} />;
}

// Client Component — TanStack Query
'use client';
function WorkoutList() {
  const { data } = useWorkouts(userId);
  return ...;
}
```

---

## Convenções de código — Compartilhadas

### Estado

| Tipo | Use |
|---|---|
| Estado do servidor (dados do Supabase) | TanStack Query (client) / fetch direto (server) |
| Estado global da aplicação (auth, UI) | Zustand |
| Estado local do componente | useState |

**Não use Zustand para dados do servidor.** Não use TanStack Query para estado de UI.

### Acesso e Permissões

Toda ação protegida precisa de **duas camadas**:
1. **CASL** no frontend (esconder/desabilitar UI)
2. **RLS** no Supabase (bloquear no banco)

```ts
import { defineAbilitiesFor } from '@meupersonal/supabase';
const ability = defineAbilitiesFor(user.role);
if (ability.can('create', 'Workout')) { ... }
```

Roles: `admin`, `professional`, `managed_student`, `autonomous_student`

---

## Fluxo de desenvolvimento (nosso protocolo)

### Modelo de par

- **Daniel define o quê** — direção, prioridade, aprovação de arquitetura
- **Agente decide o como** — implementação, proposta de abordagem técnica
- **Decisões estruturais sempre aprovadas antes de implementar**

Protocolo padrão:
```
Daniel → "preciso de X porque Y"
Agente → "minha proposta é Z — concordas?"
Daniel → aprova ou redireciona
Agente → implementa
```

### Branches

```
main         → production-ready sempre (CI obrigatório)
develop      → integração contínua
feature/xxx  → uma feature, vida < 3 dias
fix/xxx      → correção de bug
chore/xxx    → infra, deps, configuração
```

Nada vai pra `main` sem passar por `develop` primeiro (exceto hotfix crítico).

### Commits (conventional commits — commitlint ativo)

```
feat: nova funcionalidade
fix: correção de bug
chore: dependências, config, infra
refactor: refatoração sem mudança de comportamento
test: adição ou correção de testes
docs: documentação
```

**Regra do texto:** cada commit passa no CI. Sem "vai consertar no próximo". Commits são production-ready.

### Releases independentes

```bash
git tag app/v1.2.0   # release só do mobile
git tag web/v0.5.0   # release só do web
```

---

## Variáveis de ambiente

### Mobile (`app/`)

Arquivo local: `app/.env.development` (ignorado pelo git, não commitar)
Referência: `app/.env.example`

| Variável | Propósito |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase (safe para expor no cliente) |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Chave da API Google Gemini (AI features) |
| `EXPO_PUBLIC_APP_ENV` | Ambiente atual: `development`, `preview`, `production` |

Arquivos por ambiente: `.env.development`, `.env.preview`, `.env.production`

### Web (`web/`)

Arquivo local: `web/.env` ou `web/.env.local` (ignorado pelo git)

| Variável | Propósito |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase |
| `EXPO_PUBLIC_DATABASE_URL` | URL PostgreSQL direto — **apenas para migrations Drizzle, nunca expor no cliente** |

> ⚠️ O cliente Supabase compartilhado (`@meupersonal/supabase`) aceita ambos os prefixos `EXPO_PUBLIC_` e `NEXT_PUBLIC_`. Prefira `NEXT_PUBLIC_` no web para clareza.

### CI/CD (GitHub Secrets)

| Secret | Usado em |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL_DEV` / `_PREVIEW` / `_PROD` | Builds EAS e testes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV` / `_PREVIEW` / `_PROD` | Builds EAS e testes |
| `NEXT_PUBLIC_SUPABASE_URL_DEV` / `_PREVIEW` / `_PROD` | Deploy web |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV` / `_PREVIEW` / `_PROD` | Deploy web |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Testes com AI |
| `EXPO_TOKEN` | Autenticação EAS (Expo Application Services) |

---

## Design patterns

### Criar um novo módulo

```
src/modules/<nome>/
  index.ts          ← exporta apenas a API pública
  types.ts          ← tipos do módulo
  services/         ← lógica de negócio, chamadas Supabase
  store/            ← Zustand store (apenas estado global necessário)
  hooks/            ← custom hooks (wrappam TanStack Query)
  components/       ← componentes UI
  screens/          ← telas completas
```

### Fetch de dados (padrão TanStack Query)

```ts
// hook no módulo
export function useWorkouts(userId: string) {
  return useQuery({
    queryKey: ['workouts', userId],
    queryFn: () => WorkoutService.fetchByUser(userId),
    enabled: !!userId,
  });
}

// mutation
export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: WorkoutService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
  });
}
```

### Nova tabela no Supabase — checklist obrigatório

- [ ] Migration SQL com `drizzle-kit`
- [ ] RLS habilitado na tabela (`alter table X enable row level security`)
- [ ] Políticas RLS para cada role que precisa de acesso
- [ ] Tipos TypeScript atualizados em `@meupersonal/supabase/types.ts`
- [ ] CASL abilities atualizadas se necessário

### Checklist pós-feature

- [ ] Testes unitários para lógica de negócio crítica
- [ ] `biome check .` limpo
- [ ] `tsc --noEmit` limpo
- [ ] Branch mergeada com PR (não commitar direto na main/develop)
- [ ] Issue fechada no GitHub

---

## Gates de qualidade — tudo obrigatório

Antes de qualquer commit:
- `biome check .` passa (lint + format)
- `tsc --noEmit` passa (tipos)
- Testes relacionados à mudança passam
- CI verde

**Nunca use `--no-verify`.** Se o hook falhar, corrija o problema.

### Segurança

- `npm audit` roda no CI — vulnerabilidades `high`/`critical` quebram o build
- Novas dependências: verificar antes de adicionar
- Variáveis de ambiente: nunca hardcodar chaves no código
- Supabase: toda nova tabela precisa de RLS

---

## O que NÃO fazer

- **Não use StyleSheet** ou estilos inline no mobile
- **Não abra debate sobre stack** — React Native, Supabase, Zustand, Drizzle estão trancados
- **Não implemente sem aprovar abordagem** quando for algo estrutural
- **Não adicione abstrações para uso único** — três linhas similares são melhores que abstração prematura
- **Não deixe arquivo > 300 linhas** sem discutir — sinal de que precisa ser dividido
- **Não empilhe features** sem refactor — a cada 3–4 features, uma sessão de simplificação
- **Não diga sim para tudo** — se algo parece over-engineered ou inseguro, fale antes de implementar

---

## Common hurdles — problemas já resolvidos

### Android build falha no Windows (path too long)
**Sintoma:** Build falha com erro de path length no Gradle.
**Solução:** Habilitar Long Paths no Windows:
```
regedit → HKLM\SYSTEM\CurrentControlSet\Control\FileSystem → LongPathsEnabled = 1
```
Ou via PowerShell admin: `New-ItemProperty -Path "HKLM:\SYSTEM\..." -Name LongPathsEnabled -Value 1`

### Maestro não instala no Windows
**Sintoma:** `maestro` command not found após tentativa de instalação.
**Solução:** Instalar via Scoop:
```bash
scoop install maestro
```

### commitlint bloqueia commit com siglas maiúsculas
**Sintoma:** `subject must be lower-case` — bloqueia commits com "CI/CD", "API", "RLS", etc.
**Solução:** Usar minúsculas no subject: `ci/cd`, `api`, `rls`. Corpo do commit pode ter maiúsculas.

### Biome suppression comments tornam-se inválidos ao atualizar versão
**Sintoma:** `suppression comment has no effect` após upgrade do Biome.
**Solução:** Remover os comentários `// biome-ignore` que não têm mais efeito. A regra foi removida ou o código foi corrigido.

### LF/CRLF warnings no Windows ao commitar
**Sintoma:** `warning: LF will be replaced by CRLF` em todo arquivo novo.
**Impacto:** Apenas warning, não bloqueia. Git converte automaticamente.
**Solução permanente (opcional):** `git config core.autocrlf true` no repositório local.

### web/.env usa prefixo errado
**Sintoma:** Variáveis com `EXPO_PUBLIC_` no web não são reconhecidas pelo Next.js nativamente.
**Solução:** Usar `NEXT_PUBLIC_` no web. O cliente Supabase compartilhado aceita ambos como fallback, mas `NEXT_PUBLIC_` é o correto para Next.js.

### Hooks chamados após early return
**Sintoma:** Biome/ESLint reporta `useHookAtTopLevel` — hook declarado após `if (loading) return`.
**Solução:** Mover todos os `useCallback`/`useMemo`/`useEffect` para antes de qualquer early return.

---

## Issues em aberto

- Notificações push: infraestrutura pronta, integração pendente
- Gamificação: migrations no Supabase Dashboard ainda não aplicadas
- Staging Supabase: dev e prod usam o mesmo projeto por enquanto (separar antes do lançamento)

---

## Documentação de referência

| Documento | Localização |
|---|---|
| Índice completo da documentação | `docs/README.md` |
| Status do projeto | `docs/PROJECT_STATUS.md` |
| Decisões de arquitetura | `docs/decisions.md` |
| Masterplan arquitetural | `docs/ARCHITECTURE_MASTERPLAN.md` |
| Arquitetura técnica | `docs/architecture.md` |
| Arquitetura modular (mobile) | `docs/architecture/mobile-modules.md` |
| Arquitetura modular (web) | `docs/architecture/web-modules.md` |
| Regras de negócio | `docs/business_rules.md` |
| Controle de acesso | `docs/access_control.md` + `docs/CASL_GUIDE.md` |
| Boas práticas de código | `docs/best_practices.md` |
| Design system | `docs/design_system.md` |
| Schema do banco | `docs/database-schema.md` |
| Monorepo | `docs/MONOREPO.md` |
| Fluxo de desenvolvimento | `docs/WORKFLOW.md` |
| Regras de IA | `docs/AI_MANDATORY_RULES.md` |

---

## Agent Skills — quando usar

Skills ficam em `.agent/skills/` na raiz do monorepo. São ativados via `/nome-do-skill` no Claude Code ou referenciados pelo agente quando o contexto se aplica.

| Skill | Quando aplicar |
|---|---|
| `vercel-react-best-practices` | Ao escrever, revisar ou refatorar qualquer componente React ou página Next.js. Contém 45 regras em 8 categorias (waterfalls, bundle size, re-renders, SSR performance, etc.). **Prioridade CRÍTICA** para features em `web/`. |
| `web-design-guidelines` | Ao revisar UI — acessibilidade, UX, conformidade de design. Aciona quando pedido: "revise minha UI", "audit design", "check acessibilidade". |

### Regras de maior impacto (vercel-react-best-practices)

Sempre verificar ao trabalhar no `web/`:
- **Waterfalls**: usar `Promise.all()` para fetches independentes, Suspense para streaming
- **Bundle**: importar direto (nunca barrel files), `next/dynamic` para componentes pesados
- **Re-renders**: `useMemo`/`useCallback` com dependências primitivas, functional setState
- **SSR**: `React.cache()` para deduplicação por request, `after()` para operações não-bloqueantes
