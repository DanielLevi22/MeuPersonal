# Avaliação: TanStack Query (React Query)

## 📊 Resumo Executivo

**Recomendação**: ✅ **IMPLEMENTAR**

TanStack Query deve ser implementado no projeto para melhorar o gerenciamento de requisições, cache e estado de loading/error.

---

## 🎯 Por que Implementar?

### Problemas Atuais

1. **Código Repetitivo**: Cada componente que faz fetch precisa gerenciar `useState` para `data`, `isLoading`, `error`
2. **Sem Cache**: Dados são refetchados desnecessariamente
3. **Sem Sincronização**: Múltiplos componentes podem ter dados desatualizados
4. **Gerenciamento Manual**: Invalidação de cache e refetch precisam ser feitos manualmente

### Benefícios do TanStack Query

1. **Menos Código**: Reduz boilerplate significativamente
2. **Cache Automático**: Cache inteligente com invalidação automática
3. **Sincronização**: Dados sincronizados entre componentes
4. **Otimizações**: Refetch automático, background updates, retry logic
5. **DevTools**: Ferramentas de debug excelentes

---

## 📦 Instalação

```bash
npm install @tanstack/react-query
```

---

## 🏗️ Configuração

### 1. Criar Query Client

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (antigo cacheTime)
      retry: 1,
      refetchOnWindowFocus: false, // React Native não precisa
    },
  },
});
```

### 2. Provider no Layout Raiz

```typescript
// src/app/_layout.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... resto do app */}
    </QueryClientProvider>
  );
}
```

---

## 🔄 Migração de Código Existente

### Antes (Código Atual)

```typescript
// ❌ Código atual com useState/useEffect
export function WorkoutsScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('workouts')
          .select('*');
        if (error) throw error;
        setWorkouts(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWorkouts();
  }, []);

  if (isLoading) return <Loading />;
  if (error) return <Error />;

  return (
    <View>
      {workouts.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </View>
  );
}
```

### Depois (Com TanStack Query)

```typescript
// ✅ Código com TanStack Query
// src/hooks/useWorkouts.ts
export function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });
}

// src/app/(tabs)/workouts.tsx
export function WorkoutsScreen() {
  const { data: workouts, isLoading, error } = useWorkouts();

  if (isLoading) return <Loading />;
  if (error) return <Error />;

  return (
    <View>
      {workouts?.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </View>
  );
}
```

---

## 🎨 Padrões Recomendados

### Custom Hooks para Queries

Crie hooks customizados para cada tipo de query:

```typescript
// src/hooks/useWorkouts.ts
export function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

// src/hooks/useWorkout.ts
export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_items(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id, // Só executa se id existir
  });
}

// src/hooks/useExercises.ts
export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
}
```

### Mutations

```typescript
// src/hooks/useCreateWorkout.ts
export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: CreateWorkoutInput) => {
      const { data, error } = await supabase
        .from('workouts')
        .insert(workout)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalida e refetch da lista de workouts
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Uso no componente
export function CreateWorkoutScreen() {
  const createWorkout = useCreateWorkout();
  const router = useRouter();

  const handleSubmit = async (data: CreateWorkoutInput) => {
    try {
      await createWorkout.mutateAsync(data);
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o treino');
    }
  };

  return (
    <View>
      {/* Form */}
      <Button
        onPress={handleSubmit}
        isLoading={createWorkout.isPending}
        label="Criar Treino"
      />
    </View>
  );
}
```

### Atualizações Otimistas

```typescript
// src/hooks/useUpdateWorkout.ts
export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Workout> }) => {
      const { data: updated, error } = await supabase
        .from('workouts')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onMutate: async ({ id, data }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['workout', id] });

      // Snapshot do valor anterior
      const previousWorkout = queryClient.getQueryData(['workout', id]);

      // Atualização otimista
      queryClient.setQueryData(['workout', id], (old: Workout) => ({
        ...old,
        ...data,
      }));

      return { previousWorkout };
    },
    onError: (err, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousWorkout) {
        queryClient.setQueryData(['workout', variables.id], context.previousWorkout);
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch para garantir sincronização
      queryClient.invalidateQueries({ queryKey: ['workout', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
```

---

## 🔄 Integração com Zustand

TanStack Query e Zustand se complementam:

- **Zustand**: Estado global da aplicação (auth, theme, UI state)
- **TanStack Query**: Estado do servidor (cache de dados, sincronização)

```typescript
// ✅ CORRETO - Separar responsabilidades
// Zustand para estado global
const { user, setUser } = useAuthStore();

// TanStack Query para dados do servidor
const { data: workouts } = useWorkouts();
```

---

## 📊 Comparação: Com vs Sem TanStack Query

| Aspecto | Sem TanStack Query | Com TanStack Query |
|---------|-------------------|-------------------|
| **Linhas de código** | ~30-40 por componente | ~5-10 por componente |
| **Cache** | Manual | Automático |
| **Loading state** | Manual | Automático |
| **Error handling** | Manual | Automático |
| **Refetch** | Manual | Automático |
| **Sincronização** | Difícil | Automática |
| **Otimizações** | Nenhuma | Muitas |

---

## 🚀 Plano de Implementação

### Fase 1: Setup (1-2 horas)
- [ ] Instalar `@tanstack/react-query`
- [ ] Criar `query-client.ts`
- [ ] Adicionar `QueryClientProvider` no `_layout.tsx`

### Fase 2: Migração Gradual (2-3 dias)
- [ ] Criar hooks para queries principais (`useWorkouts`, `useExercises`, etc.)
- [ ] Migrar componentes um por um
- [ ] Adicionar mutations para create/update/delete

### Fase 3: Otimizações (1 dia)
- [ ] Implementar atualizações otimistas onde fizer sentido
- [ ] Ajustar `staleTime` e `gcTime` conforme necessário
- [ ] Adicionar prefetch onde apropriado

---

## ⚠️ Considerações

### Tamanho do Bundle

TanStack Query adiciona ~13KB gzipped. Para um app mobile, isso é aceitável considerando os benefícios.

### Curva de Aprendizado

A equipe precisa aprender os conceitos básicos:
- `useQuery` para leitura
- `useMutation` para escrita
- `queryKey` para identificação
- `invalidateQueries` para refetch

### Compatibilidade

TanStack Query funciona perfeitamente com:
- ✅ Supabase
- ✅ Zustand
- ✅ React Native
- ✅ Expo

---

## 📚 Recursos

- [Documentação Oficial](https://tanstack.com/query/latest)
- [React Query Essentials](https://tanstack.com/query/latest/docs/react/overview)
- [Best Practices](https://tkdodo.eu/blog/practical-react-query)

---

## ✅ Conclusão

**TanStack Query deve ser implementado** porque:

1. Reduz significativamente o código boilerplate
2. Melhora a experiência do usuário com cache e sincronização
3. Facilita manutenção e debugging
4. É padrão da indústria para gerenciamento de estado do servidor
5. Tem excelente suporte para React Native

**Prioridade**: Alta
**Esforço**: Médio (2-3 dias)
**Impacto**: Alto

---

**Data da Avaliação**: 2025-01-XX

