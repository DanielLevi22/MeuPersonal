# Auth Module

Módulo responsável por autenticação e gerenciamento de sessão de usuários.

## Estrutura

```
auth/
├── store/
│   └── authStore.ts      # Zustand store para estado de autenticação
├── types/                # Tipos TypeScript (futuro)
├── utils/                # Utilitários de auth (futuro)
└── index.ts              # API pública do módulo
```

## Uso

```typescript
import { useAuthStore } from '@/auth';

const { user, signIn, signOut } = useAuthStore();
```

## Funcionalidades

- ✅ Login/Logout
- ✅ Gerenciamento de sessão
- ✅ Estado do usuário
- ✅ Verificação de role
- ✅ Reset de estado

## Dependências

- `@meupersonal/supabase` - Cliente Supabase
- `zustand` - State management
