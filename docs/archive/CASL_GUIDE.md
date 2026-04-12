# Guia Prático do CASL - MeuPersonal

Este guia é focado no **desenvolvedor**. Aqui você aprende como usar o sistema de permissões no dia a dia.

## 1. O Básico

O CASL responde a uma pergunta simples: **"Este usuário pode fazer X com Y?"**

- **Ação (X):** `create`, `read`, `update`, `delete`, `manage` (tudo)
- **Assunto (Y):** `Student`, `Workout`, `Diet`, `Exercise`, `Profile`, `Analytics`

## 2. Como Verificar Permissões

### No React (Componentes)

Use a função `defineAbilitiesFor` com o role do usuário atual.

```tsx
import { defineAbilitiesFor } from '@meupersonal/supabase';
import { useAuth } from '@/hooks/useAuth'; // Seu hook de auth

export function WorkoutList() {
  const { user } = useAuth();
  const ability = defineAbilitiesFor(user.role);

  return (
    <View>
      <Text>Lista de Treinos</Text>

      {/* Botão só aparece se puder CRIAR treino */}
      {ability.can('create', 'Workout') && (
        <Button onPress={handleAddWorkout}>Novo Treino</Button>
      )}

      {/* Botão só aparece se puder DELETAR treino */}
      {ability.can('delete', 'Workout') && (
        <Button onPress={handleDelete}>Excluir</Button>
      )}
    </View>
  );
}
```

### Em Funções / Hooks

```typescript
function deleteWorkout(workoutId: string, userRole: string) {
  const ability = defineAbilitiesFor(userRole);

  if (ability.cannot('delete', 'Workout')) {
    throw new Error('Você não tem permissão para excluir treinos.');
  }

  // ... prosseguir com a exclusão
}
```

## 3. Adicionando Novas Permissões

Todas as regras ficam em: `packages/supabase/src/abilities.ts`

**Passo a passo:**

1. Abra `packages/supabase/src/abilities.ts`
2. Adicione o novo Subject se necessário (ex: 'Financial')
   ```typescript
   export type Subject = 'Student' | 'Workout' | ... | 'Financial';
   ```
3. Adicione a regra no `switch` do role:
   ```typescript
   case 'personal':
     can('read', 'Financial'); // Nova regra
     break;
   ```

## 4. Troubleshooting Comum

### "Property 'can' does not exist..."
Certifique-se de importar `defineAbilitiesFor` de `@meupersonal/supabase`.

### "A permissão não está funcionando"
1. Verifique se o `role` passado para `defineAbilitiesFor` está correto (imprima no console).
2. Lembre-se que `manage` engloba tudo. Se você tem `manage`, você tem `create`, `read`, etc.
3. Verifique se não há uma regra `cannot` bloqueando. O `cannot` sempre vence o `can`.

### "O usuário vê o botão mas dá erro ao clicar"
Você protegeu o frontend com CASL, mas o **RLS (Row Level Security)** do Supabase bloqueou no backend. Isso é o comportamento correto! O CASL melhora a UX, o RLS garante a segurança.

## 5. Referência Rápida de Roles

| Role | Foco Principal |
|------|----------------|
| `personal` | Treinos e Alunos |
| `nutritionist` | Dietas e Alunos |
| `student` | Consumo de conteúdo (Read-only na maioria) |

---
**Dúvidas?** Consulte `docs/access_control.md` para detalhes da implementação.
