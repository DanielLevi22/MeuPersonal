# Modular Architecture - MeuPersonal Mobile

## 📁 Estrutura de Módulos

O projeto utiliza uma arquitetura modular baseada em features para melhor organização e escalabilidade.

```
src/
├── modules/                    # Feature-based modules
│   ├── auth/                   # Autenticação
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   └── index.ts
│   │
│   ├── students/               # Gerenciamento de Alunos
│   │   ├── components/
│   │   │   └── StudentEditModal.tsx
│   │   ├── store/
│   │   │   └── studentStore.ts
│   │   └── index.ts
│   │
│   ├── workout/                # Treinos
│   │   ├── components/
│   │   │   ├── RestTimer.tsx
│   │   │   ├── StudentAssignmentModal.tsx
│   │   │   └── ExerciseConfigModal.tsx
│   │   ├── hooks/
│   │   │   └── useWorkoutTimer.ts
│   │   ├── store/
│   │   │   ├── workoutStore.ts
│   │   │   └── workoutLogStore.ts
│   │   └── index.ts
│   │
│   └── nutrition/              # Nutrição
│       ├── components/
│       │   ├── DailyNutrition.tsx
│       │   ├── FoodSearchModal.tsx
│       │   ├── MealCard.tsx
│       │   ├── MacroProgressBar.tsx
│       │   ├── EditFoodModal.tsx
│       │   ├── TimePickerModal.tsx
│       │   └── DayOptionsModal.tsx
│       ├── store/
│       │   └── nutritionStore.ts
│       ├── utils/
│       │   └── nutrition.ts
│       └── index.ts
│
└── shared/                     # Código compartilhado
    ├── components/             # Componentes genéricos
    ├── hooks/                  # Hooks genéricos
    ├── utils/                  # Utilitários genéricos
    └── types/                  # Tipos compartilhados
```

## 🎯 Princípios

### 1. Separação por Feature
Cada módulo é responsável por uma feature específica do app.

### 2. API Pública
Cada módulo expõe apenas o necessário através de `index.ts`:

```typescript
// modules/nutrition/index.ts
export { useNutritionStore } from './store/nutritionStore';
export { MealCard } from './components/MealCard';
export type { DietPlan } from '@meupersonal/core';
```

### 3. Imports Limpos
Use path aliases para imports limpos:

```typescript
// ✅ CORRETO
import { useAuthStore } from '@/auth';
import { useNutritionStore } from '@/nutrition';
import { Button } from '@/shared/components/Button';

// ❌ ERRADO
import { useAuthStore } from '../../modules/auth/store/authStore';
```

## 📦 Path Aliases

Configurados em `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/modules/*": ["./src/modules/*"],
    "@/shared/*": ["./src/shared/*"],
    "@/auth": ["./src/modules/auth"],
    "@/workout": ["./src/modules/workout"],
    "@/students": ["./src/modules/students"],
    "@/nutrition": ["./src/modules/nutrition"]
  }
}
```

## 🔒 Regras de Comunicação

### ✅ Permitido
- Módulo → Shared
- Módulo → Packages (@meupersonal/*)
- Screen → Módulo
- Componente Shared → Packages

### ❌ Proibido
- Módulo → Módulo (importação direta)
- Shared → Módulo

### Comunicação Entre Módulos
Use stores globais ou props:

```typescript
// Módulo A precisa de dados do Módulo B
// ✅ CORRETO: Via store global
const { user } = useAuthStore(); // Auth é exceção (global)

// ✅ CORRETO: Via props
<ComponenteA userId={user.id} />
```

## 📝 Convenções

### Estrutura de Módulo
```
module-name/
├── components/     # Componentes específicos do módulo
├── screens/        # Telas (se necessário)
├── store/          # Zustand stores
├── hooks/          # Custom hooks
├── utils/          # Utilitários
├── types/          # Tipos TypeScript
├── index.ts        # API pública
└── README.md       # Documentação do módulo
```

### Naming
- Módulos: lowercase (auth, workout, nutrition)
- Componentes: PascalCase (MealCard, RestTimer)
- Hooks: camelCase com prefixo use (useWorkoutTimer)
- Stores: camelCase com sufixo Store (nutritionStore)

## 🚀 Benefícios

1. **Organização Clara**: Fácil encontrar código relacionado
2. **Escalabilidade**: Adicionar features sem afetar existentes
3. **Manutenibilidade**: Mudanças isoladas por módulo
4. **Testabilidade**: Testar módulos independentemente
5. **Reutilização**: Código compartilhado em `shared/`
6. **Onboarding**: Novos devs entendem estrutura rapidamente

## 📚 Exemplos de Uso

### Criar Novo Módulo
```bash
# 1. Criar estrutura
mkdir -p src/modules/novo-modulo/{components,store,hooks,utils,types}

# 2. Criar index.ts
# 3. Adicionar path alias no tsconfig.json
# 4. Implementar funcionalidades
```

### Usar Módulo Existente
```typescript
// Em qualquer screen ou componente
import { useNutritionStore, MealCard } from '@/nutrition';
import { useWorkoutTimer } from '@/workout';
import { useAuthStore } from '@/auth';

function MyScreen() {
  const { meals } = useNutritionStore();
  const { user } = useAuthStore();
  
  return <MealCard meal={meals[0]} />;
}
```

## 🔄 Migração Completa

✅ **Auth Module**: 1 store, 24 arquivos atualizados  
✅ **Students Module**: 1 store + 1 component, 9 arquivos atualizados  
✅ **Workout Module**: 2 stores + 1 hook + 3 components, 15+ arquivos atualizados  
✅ **Nutrition Module**: 1 store + 7 components + utils, 10+ arquivos atualizados  

**Total**: 4 módulos, 60+ arquivos migrados com sucesso
