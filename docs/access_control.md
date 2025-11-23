# Sistema de Controle de Acesso (CASL) - MeuPersonal

Este documento detalha a implementação técnica do controle de acesso utilizando a biblioteca **CASL**.

## 1. Implementação Atual

O controle de acesso é centralizado no package `@meupersonal/supabase`.

**Arquivo:** `packages/supabase/src/abilities.ts`

### Código Real

```typescript
import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';
import type { UserRole } from './types';

// Define actions
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

// Define subjects (resources)
export type Subject =
  | 'Student'
  | 'Workout'
  | 'Diet'
  | 'Exercise'
  | 'Profile'
  | 'Analytics'
  | 'all';

export type AppAbility = MongoAbility<[Action, Subject]>;

export function defineAbilitiesFor(role: UserRole): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  switch (role) {
    case 'personal':
      can('manage', 'Student');
      can('manage', 'Workout');
      can('manage', 'Exercise');
      can('read', 'Analytics');
      can('read', 'Profile');
      can('update', 'Profile');
      cannot('manage', 'Diet');
      can('read', 'Diet');
      break;

    case 'nutritionist':
      can('manage', 'Student');
      can('manage', 'Diet');
      can('read', 'Analytics');
      can('read', 'Profile');
      can('update', 'Profile');
      cannot('manage', 'Workout');
      can('read', 'Workout');
      break;

    case 'student':
      can('read', 'Workout');
      can('read', 'Diet');
      can('read', 'Exercise');
      can('read', 'Profile');
      can('update', 'Profile'); // Próprio perfil
      cannot('create', 'all');
      cannot('delete', 'all');
      cannot('read', 'Analytics');
      break;
  }

  return build();
}
```

## 2. Matriz de Permissões

| Recurso (Subject) | Personal (`personal`) | Nutricionista (`nutritionist`) | Aluno (`student`) |
|-------------------|-----------------------|--------------------------------|-------------------|
| **Student**       | ✅ Manage             | ✅ Manage                      | ❌ -              |
| **Workout**       | ✅ Manage             | 👁️ Read                       | 👁️ Read          |
| **Diet**          | 👁️ Read               | ✅ Manage                      | 👁️ Read          |
| **Exercise**      | ✅ Manage             | ❌ -                           | 👁️ Read          |
| **Profile**       | 👁️ Read / ✏️ Update   | 👁️ Read / ✏️ Update            | 👁️ Read / ✏️ Update |
| **Analytics**     | 👁️ Read               | 👁️ Read                       | ❌ -              |

**Legenda:**
- `Manage`: Criar, Ler, Atualizar, Deletar
- `Read`: Apenas visualizar
- `Update`: Apenas editar (geralmente restrito ao próprio ID)

## 3. Como Usar no Código

### 3.1. Verificando Permissões

```typescript
import { defineAbilitiesFor } from '@meupersonal/supabase';

// 1. Obter o role do usuário (do hook de auth ou store)
const userRole = 'personal'; 

// 2. Gerar ability
const ability = defineAbilitiesFor(userRole);

// 3. Verificar
if (ability.can('create', 'Workout')) {
  console.log('Pode criar treino!');
} else {
  console.log('Acesso negado.');
}
```

### 3.2. Integração com UI (React)

Recomendamos criar um componente `Can` ou usar lógica condicional simples:

```tsx
// Exemplo de renderização condicional
const ability = defineAbilitiesFor(user.role);

return (
  <View>
    <Text>Detalhes do Aluno</Text>
    
    {/* Só mostra botão se puder gerenciar dieta */}
    {ability.can('manage', 'Diet') && (
      <Button onPress={createDiet}>Criar Dieta</Button>
    )}

    {/* Só mostra botão se puder gerenciar treino */}
    {ability.can('manage', 'Workout') && (
      <Button onPress={createWorkout}>Criar Treino</Button>
    )}
  </View>
);
```

## 4. Segurança em Camadas

O CASL fornece segurança no **Frontend (UX)**, mas a segurança real dos dados é garantida pelo **Row Level Security (RLS)** no Supabase (Backend).

- **CASL**: Esconde botões, protege rotas, melhora UX.
- **RLS**: Impede que requisições maliciosas acessem ou modifiquem dados no banco.

**Sempre mantenha as regras do CASL e RLS sincronizadas.**
