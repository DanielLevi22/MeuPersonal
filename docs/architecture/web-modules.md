# Modular Architecture - MeuPersonal Web

## 📁 Estrutura de Módulos

O app web utiliza a mesma arquitetura modular do mobile para consistência no monorepo.

```
src/
├── app/                        # Next.js App Router
│   ├── (admin)/               # Admin routes
│   ├── (auth)/                # Auth routes
│   └── ...
│
├── modules/                    # Feature-based modules
│   ├── auth/                   # Autenticação
│   │   ├── components/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── types/
│   │   └── index.ts
│   │
│   └── admin/                  # Admin Panel
│       ├── components/
│       ├── pages/
│       ├── store/
│       ├── utils/
│       └── index.ts
│
├── shared/                     # Código compartilhado
│   ├── components/             # Componentes UI genéricos
│   ├── hooks/                  # Hooks reutilizáveis
│   ├── utils/                  # Utilitários
│   └── types/                  # Tipos compartilhados
│
├── components/                 # Legacy (migrar para shared/)
└── lib/                        # Configurações e utils
```

## 🎯 Diferenças do Mobile

### Next.js Específico
- **App Router**: Rotas em `app/` (não mudam)
- **Server Components**: Módulos podem ter componentes server/client
- **API Routes**: Podem ficar em `app/api/` ou `modules/*/api/`

### Módulos Web
- `auth/` - Autenticação (login, register, session)
- `admin/` - Admin panel completo
- Futuros: `dashboard/`, `analytics/`, etc.

## 📦 Path Aliases

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/modules/*": ["./src/modules/*"],
    "@/shared/*": ["./src/shared/*"],
    "@/auth": ["./src/modules/auth"],
    "@/admin": ["./src/modules/admin"]
  }
}
```

## 🚀 Uso

```typescript
// Em páginas Next.js
import { LoginForm } from '@/auth';
import { AdminDashboard } from '@/admin';
import { Button } from '@/shared/components/Button';

export default function Page() {
  return <LoginForm />;
}
```

## 📝 Convenções

### Server vs Client Components
```typescript
// modules/auth/components/LoginForm.tsx
'use client'; // Marcar explicitamente

export function LoginForm() {
  // Client component
}

// modules/admin/components/UserTable.tsx
// Server component por padrão (sem 'use client')
export function UserTable() {
  // Server component
}
```

### API Routes
```
modules/admin/
├── api/
│   ├── users/
│   │   └── route.ts
│   └── analytics/
│       └── route.ts
└── ...
```

## 🔄 Migração Planejada

### Fase 1: Estrutura Base ✅
- [x] Criar diretórios modules/ e shared/
- [x] Configurar path aliases

### Fase 2: Auth Module
- [ ] Mover componentes de auth
- [ ] Criar auth store (Zustand)
- [ ] Atualizar imports

### Fase 3: Admin Module
- [ ] Organizar componentes admin
- [ ] Criar páginas admin
- [ ] Implementar store admin

### Fase 4: Shared Components
- [ ] Mover componentes genéricos
- [ ] Criar design system
- [ ] Documentar componentes

## 🎨 Benefícios

1. **Consistência**: Mesma estrutura mobile e web
2. **Compartilhamento**: Fácil compartilhar lógica entre apps
3. **Organização**: Código organizado por feature
4. **Escalabilidade**: Adicionar features sem conflitos

## 📚 Próximos Passos

1. Migrar componentes de auth para `modules/auth/`
2. Organizar admin panel em `modules/admin/`
3. Mover componentes genéricos para `shared/`
4. Atualizar todos os imports
5. Documentar cada módulo
