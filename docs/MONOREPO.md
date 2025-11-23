# Guia do Monorepo - MeuPersonal

Este documento serve como guia de referência para trabalhar na arquitetura monorepo do projeto **MeuPersonal**, gerenciada pelo **Turborepo**.

## 1. Estrutura do Projeto

```
meupersonal.app/
├── apps/                    # Aplicações finais
│   ├── mobile/              # App React Native (Expo)
│   └── web/                 # Dashboard Web (Next.js - futuro)
├── packages/                # Bibliotecas compartilhadas
│   ├── config/              # Configurações (TypeScript, ESLint, etc)
│   ├── core/                # Lógica de negócio pura e tipos
│   └── supabase/            # Cliente Supabase e Controle de Acesso
├── docs/                    # Documentação do projeto
├── turbo.json               # Configuração do pipeline de build
└── package.json             # Scripts raiz
```

## 2. Packages Compartilhados

Todos os packages estão no namespace `@meupersonal/*`.

| Package | Descrição | Dependências Principais |
|---------|-----------|-------------------------|
| `@meupersonal/config` | Configurações base para garantir consistência entre projetos. | `typescript` |
| `@meupersonal/core` | Tipos TypeScript, interfaces de domínio e funções utilitárias puras. | Nenhuma (pure JS/TS) |
| `@meupersonal/supabase` | Cliente Supabase singleton e definições de permissões CASL. | `@supabase/supabase-js`, `@casl/ability` |

## 3. Como Importar e Usar

### No App Mobile (`apps/mobile`)

O `package.json` do mobile já tem as dependências linkadas via workspace.

**Exemplo: Usando tipos compartilhados**
```typescript
import { type UserProfile } from '@meupersonal/core';

const user: UserProfile = { ... };
```

**Exemplo: Usando o cliente Supabase**
```typescript
import { supabase } from '@meupersonal/supabase';

const { data } = await supabase.from('profiles').select('*');
```

**Exemplo: Verificando permissões (CASL)**
```typescript
import { defineAbilitiesFor } from '@meupersonal/supabase';

const ability = defineAbilitiesFor('personal');
if (ability.can('create', 'Workout')) {
  // Lógica permitida
}
```

## 4. Scripts Disponíveis (Turborepo)

Execute estes comandos na raiz do projeto:

| Comando | O que faz |
|---------|-----------|
| `pnpm dev` | Inicia todos os apps em modo de desenvolvimento. |
| `pnpm build` | Executa o build de todos os apps e packages. |
| `pnpm lint` | Roda verificação de lint em todo o workspace. |
| `pnpm clean` | Remove pastas `node_modules`, `.turbo` e `dist` de todos os projetos. |

### Comandos Filtrados

Para rodar um comando apenas em um projeto específico, use a flag `--filter`:

```bash
# Rodar apenas o mobile
pnpm --filter @meupersonal/mobile dev

# Rodar apenas o build da web
pnpm --filter @meupersonal/web build
```

## 5. Adicionando Novos Packages

1. Crie uma pasta em `packages/<nome-do-package>`
2. Inicie um `package.json` com o nome `@meupersonal/<nome-do-package>`
3. Adicione a dependência no app que vai usar:
   ```bash
   pnpm add @meupersonal/<nome-do-package> --filter @meupersonal/mobile
   ```

## 6. Troubleshooting

### Problema: "Module not found" após criar arquivo em package
**Solução:** O TypeScript pode não ter pego a mudança imediatamente. Tente reiniciar o servidor TS no VS Code (`Ctrl+Shift+P` > `TypeScript: Restart TS Server`).

### Problema: Cache do Turbo impedindo atualizações
**Solução:** Rode o script de limpeza e reinstale as dependências:
```bash
pnpm clean
pnpm install
```

### Problema: Dependências fantasmas
**Solução:** O `pnpm` é estrito. Se você usa uma lib no `mobile` que é dependência do `core`, você deve instalá-la no `mobile` também se for importá-la diretamente.
