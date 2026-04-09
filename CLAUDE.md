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

Cada feature é um módulo isolado:

```
src/modules/<feature>/
  components/   → UI do módulo
  screens/      → Telas (mobile) ou pages/ (web)
  hooks/        → Custom hooks
  store/        → Zustand store
  services/     → Lógica de negócio / chamadas Supabase
  types.ts      → Tipos do módulo
  index.ts      → API pública do módulo
```

**Não importe diretamente de dentro de outro módulo.** Use o `index.ts` público.

### Path aliases

```ts
// Mobile (app/)
@/*                 → ./src/*
@/modules/*         → ./src/modules/*
@/nutrition         → ./src/modules/nutrition
@/workout           → ./src/modules/workout
@/students          → ./src/modules/students
@/auth              → ./src/modules/auth
@meupersonal/core   → ./src/packages/core
@meupersonal/supabase → ./src/packages/supabase

// Web (web/)
@/*                 → ./src/*
@/workout           → ./src/modules/workouts  (pasta é plural)
@/nutrition         → ./src/modules/nutrition
@meupersonal/core   → ./src/packages/core
```

---

## Convenções de código

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

### Estado

| Tipo | Use |
|---|---|
| Estado do servidor (dados do Supabase) | TanStack Query |
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

## Issues conhecidos

- Android build no Windows: requer "Long Paths" habilitado no registro
- Maestro no Windows: requer Scoop ou instalação manual
- Notificações push: infraestrutura pronta, integração pendente
- Gamificação: migrations no Supabase Dashboard ainda não aplicadas

---

## Documentação de referência

| Documento | Localização |
|---|---|
| Status do projeto | `PROJECT_STATUS.md` |
| Decisões de arquitetura | `dicision.md` |
| Arquitetura técnica | `docs/architecture.md` |
| Regras de negócio | `docs/business_rules.md` |
| Controle de acesso | `docs/access_control.md` + `docs/CASL_GUIDE.md` |
| Boas práticas de código | `docs/best_practices.md` |
| Design system | `docs/design_system.md` |
| Schema do banco | `docs/database-schema.md` |
| Monorepo | `docs/MONOREPO.md` |
