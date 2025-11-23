3. [Estrutura de Componentes](#estrutura-de-componentes)
4. [React Hooks e Boas Práticas](#react-hooks-e-boas-práticas)
5. [Gerenciamento de Estado](#gerenciamento-de-estado)
6. [Requisições e Cache](#requisições-e-cache)
7. [Nomenclatura](#nomenclatura)
8. [Organização de Arquivos](#organização-de-arquivos)
9. [Performance](#performance)
10. [Acessibilidade](#acessibilidade)

---

## 🎨 Estilização com Tailwind (NativeWind)

### ✅ **SEMPRE USE TAILWIND**

**NÃO use StyleSheet ou estilos inline com objetos JavaScript.**

```tsx
// ❌ ERRADO
<View style={{ backgroundColor: '#141B2D', padding: 16, borderRadius: 16 }}>
  <Text style={{ color: '#FFFFFF', fontSize: 18 }}>Texto</Text>
</View>

// ✅ CORRETO
<View className="bg-surface p-4 rounded-2xl">
  <Text className="text-foreground text-lg">Texto</Text>
</View>
```

### Cores do Design System

Use sempre as cores definidas no `tailwind.config.js`:

```tsx
// ✅ CORRETO - Usando tokens do design system
<View className="bg-background">
  <Text className="text-foreground">Texto principal</Text>
  <Text className="text-muted">Texto secundário</Text>
  <View className="bg-primary">Botão primário</View>
  <View className="bg-secondary">Botão secundário</View>
  <View className="bg-accent">Sucesso</View>
  <View className="bg-error">Erro</View>
  <View className="border border-border">Borda</View>
</View>

// ❌ ERRADO - Cores hardcoded
<View className="bg-[#141B2D]">
  <Text className="text-[#FFFFFF]">Texto</Text>
</View>
```

### Utilitário `cn()` para Classes Condicionais

Use a função `cn()` (de `@/lib/utils`) para combinar classes condicionais:

```tsx
import { cn } from '@/lib/utils';

// ✅ CORRETO
<View className={cn(
  'bg-surface p-4 rounded-xl',
  isActive && 'bg-primary',
  disabled && 'opacity-50'
)}>
  <Text className={cn(
    'text-foreground font-bold',
    isLarge && 'text-xl',
    isSmall && 'text-sm'
  )}>
    Texto
  </Text>
</View>
```

### Componentes Reutilizáveis

Componentes da UI devem usar Tailwind e aceitar `className` para customização:

```tsx
// ✅ CORRETO
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <View className={cn(
      'bg-surface border-2 border-border rounded-2xl p-4',
      className
    )}>
      {children}
    </View>
  );
}
```

### Responsividade

Para diferentes tamanhos de tela, use as breakpoints do Tailwind:

```tsx
// ✅ CORRETO
<View className="flex-col md:flex-row">
  <Text className="text-sm md:text-base lg:text-lg">Texto responsivo</Text>
</View>
```

---

## 📘 TypeScript

### Tipagem Forte

**SEMPRE** defina tipos para props, estados e funções:

```tsx
// ✅ CORRETO
interface ExerciseCardProps {
  exercise: Exercise;
  onPress: (id: string) => void;
  isSelected?: boolean;
}

export function ExerciseCard({ exercise, onPress, isSelected = false }: ExerciseCardProps) {
  // ...
}

// ❌ ERRADO
export function ExerciseCard({ exercise, onPress, isSelected }: any) {
  // ...
}
```

### Interfaces vs Types

- Use `interface` para objetos e props de componentes
- Use `type` para uniões, interseções e tipos derivados

```tsx
// ✅ CORRETO
interface User {
  id: string;
  name: string;
}

type UserRole = 'personal' | 'student';
type UserWithRole = User & { role: UserRole };

// ❌ ERRADO
type User = {
  id: string;
  name: string;
}
```

### Evite `any`

Sempre que possível, evite `any`. Use `unknown` ou tipos específicos:

```tsx
// ✅ CORRETO
function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}

// ❌ ERRADO
function handleError(error: any) {
  console.error(error.message);
}
```

---

## 🧩 Estrutura de Componentes

### Componentes Funcionais

Sempre use componentes funcionais com hooks:

```tsx
// ✅ CORRETO
export function WorkoutCard({ workout }: WorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <View className="bg-surface p-4 rounded-xl">
      {/* ... */}
    </View>
  );
}

// ❌ ERRADO
export class WorkoutCard extends React.Component {
  // ...
}
```

### Ordem de Declarações

Mantenha esta ordem dentro dos componentes:

1. Hooks (useState, useEffect, etc.)
2. Funções auxiliares
3. Handlers de eventos
4. Renderização

```tsx
// ✅ CORRETO
export function Component() {
  // 1. Hooks
  const [state, setState] = useState();
  const { data } = useQuery();
  
  // 2. Funções auxiliares
  const formatDate = (date: Date) => { /* ... */ };
  
  // 3. Handlers
  const handlePress = () => { /* ... */ };
  
  // 4. Renderização
  return <View>...</View>;
}
```

### Componentes Pequenos e Focados

Mantenha componentes pequenos e com responsabilidade única:

```tsx
// ✅ CORRETO - Componente focado
export function ExerciseItem({ exercise }: ExerciseItemProps) {
  return (
    <View className="bg-surface p-4 rounded-xl">
      <Text className="text-foreground font-bold">{exercise.name}</Text>
      <Text className="text-muted">{exercise.muscle_group}</Text>
    </View>
  );
}

// ❌ ERRADO - Componente fazendo muitas coisas
export function ExerciseList() {
  // Lógica de fetch, filtros, renderização, etc.
}
```

---

## ⚛️ React Hooks e Boas Práticas

### useEffect - Dependências Corretas

**SEMPRE** inclua todas as dependências no array de dependências do `useEffect`:

```tsx
// ✅ CORRETO
useEffect(() => {
  if (user?.id) {
    fetchProfile(user.id);
  }
}, [user?.id]); // Dependência correta

// ❌ ERRADO - Falta dependência
useEffect(() => {
  if (user?.id) {
    fetchProfile(user.id);
  }
}, []); // ESLint vai avisar sobre dependência faltando
```

### Cleanup em useEffect

Sempre faça cleanup de subscriptions, timers ou listeners:

```tsx
// ✅ CORRETO
useEffect(() => {
  const subscription = supabase
    .channel('workouts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts' }, handleChange)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);

// ✅ CORRETO - Timer
useEffect(() => {
  const timer = setInterval(() => {
    // fazer algo
  }, 1000);

  return () => {
    clearInterval(timer);
  };
}, []);
```

### useCallback para Funções Estáveis

Use `useCallback` para funções que são passadas como props ou usadas em dependências:

```tsx
// ✅ CORRETO
const handlePress = useCallback((id: string) => {
  router.push(`/workouts/${id}`);
}, [router]);

// Passar para componente filho
<WorkoutCard workout={workout} onPress={handlePress} />

// ❌ ERRADO - Nova função a cada render
const handlePress = (id: string) => {
  router.push(`/workouts/${id}`);
};
```

### useMemo para Cálculos Pesados

Use `useMemo` apenas para cálculos realmente pesados:

```tsx
// ✅ CORRETO - Cálculo pesado
const sortedWorkouts = useMemo(() => {
  return workouts
    .sort((a, b) => a.title.localeCompare(b.title))
    .filter(w => w.isActive);
}, [workouts]);

// ❌ ERRADO - Cálculo simples não precisa
const workoutCount = useMemo(() => workouts.length, [workouts]);
// Melhor: const workoutCount = workouts.length;
```

### useState - Inicialização Lazy

Para valores iniciais que são calculados, use função de inicialização:

```tsx
// ✅ CORRETO - Inicialização lazy
const [data, setData] = useState(() => {
  const stored = localStorage.getItem('data');
  return stored ? JSON.parse(stored) : [];
});

// ❌ ERRADO - Executa a cada render
const [data, setData] = useState(JSON.parse(localStorage.getItem('data') || '[]'));
```

### Múltiplos useState vs useReducer

Use `useReducer` quando tiver lógica de estado complexa ou múltiplos estados relacionados:

```tsx
// ✅ CORRETO - useReducer para estado complexo
type FormState = {
  title: string;
  description: string;
  exercises: Exercise[];
  errors: Record<string, string>;
};

type FormAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'ADD_EXERCISE'; payload: Exercise }
  | { type: 'REMOVE_EXERCISE'; payload: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] };
    // ...
  }
}

export function WorkoutForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  // ...
}

// ❌ ERRADO - Muitos useState relacionados
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
const [exercises, setExercises] = useState<Exercise[]>([]);
const [errors, setErrors] = useState<Record<string, string>>({});
```

### Custom Hooks

Extraia lógica reutilizável para custom hooks:

```tsx
// ✅ CORRETO - Custom hook
export function useWorkout(id: string) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchWorkout() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setWorkout(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchWorkout();
    }
  }, [id]);

  return { workout, isLoading, error };
}

// Uso no componente
export function WorkoutDetailScreen({ id }: { id: string }) {
  const { workout, isLoading, error } = useWorkout(id);
  // ...
}
```

### Renderização Condicional

Use early returns para melhor legibilidade:

```tsx
// ✅ CORRETO - Early returns
export function WorkoutScreen({ workoutId }: { workoutId: string }) {
  const { workout, isLoading, error } = useWorkout(workoutId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!workout) {
    return <NotFound />;
  }

  return <WorkoutDetail workout={workout} />;
}

// ❌ ERRADO - Aninhamento excessivo
export function WorkoutScreen({ workoutId }: { workoutId: string }) {
  const { workout, isLoading, error } = useWorkout(workoutId);

  return (
    <View>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        error ? (
          <ErrorMessage error={error} />
        ) : (
          workout ? (
            <WorkoutDetail workout={workout} />
          ) : (
            <NotFound />
          )
        )
      )}
    </View>
  );
}
```

### Keys em Listas

Sempre use keys únicas e estáveis em listas:

```tsx
// ✅ CORRETO - ID único
{workouts.map(workout => (
  <WorkoutCard key={workout.id} workout={workout} />
))}

// ✅ CORRETO - Index apenas se não houver ID e lista não muda
{items.map((item, index) => (
  <ItemCard key={index} item={item} />
))}

// ❌ ERRADO - Sem key
{workouts.map(workout => (
  <WorkoutCard workout={workout} />
))}
```

### Event Handlers

Nomeie handlers com prefixo `handle`:

```tsx
// ✅ CORRETO
const handleSubmit = async () => {
  // ...
};

const handleDelete = (id: string) => {
  // ...
};

const handleExercisePress = (exercise: Exercise) => {
  // ...
};

// ❌ ERRADO
const submit = async () => { /* ... */ };
const deleteWorkout = (id: string) => { /* ... */ };
const onPress = () => { /* ... */ };
```

### Evitar Re-renders Desnecessários

Use `React.memo` para componentes que recebem props que não mudam frequentemente:

```tsx
// ✅ CORRETO
export const WorkoutCard = React.memo(function WorkoutCard({ 
  workout,
  onPress 
}: WorkoutCardProps) {
  return (
    <TouchableOpacity onPress={() => onPress(workout.id)}>
      <Text>{workout.title}</Text>
    </TouchableOpacity>
  );
});

// ❌ ERRADO - Re-renderiza mesmo se props não mudarem
export function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  // ...
}
```

### Props Drilling vs Context

Use Context apenas quando necessário (tema, autenticação, etc.). Para props que passam por 1-2 níveis, prefira props:

```tsx
// ✅ CORRETO - Props para poucos níveis
<WorkoutList workouts={workouts} onSelect={handleSelect} />

// ✅ CORRETO - Context para dados globais
const { user } = useAuthStore(); // Zustand já é um Context

// ❌ ERRADO - Context desnecessário
const WorkoutContext = createContext();
// Para passar workout por 1 nível - use props!
```

### Hooks Rules

Sempre siga as regras dos hooks:

1. **Só chame hooks no nível superior** - não dentro de loops, condições ou funções aninhadas
2. **Só chame hooks de componentes React ou custom hooks**

```tsx
// ✅ CORRETO
export function Component() {
  const [state, setState] = useState();
  const { data } = useQuery();
  
  if (condition) {
    // Não faça isso:
    // const [other, setOther] = useState(); ❌
  }
  
  return <View />;
}

// ✅ CORRETO - Custom hook
function useCustomHook() {
  const [state, setState] = useState();
  return { state, setState };
}
```

### Async em useEffect

Sempre trate erros em funções async dentro de useEffect:

```tsx
// ✅ CORRETO
useEffect(() => {
  async function fetchData() {
    try {
      const data = await fetchWorkouts();
      setWorkouts(data);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      setError(error as Error);
    }
  }

  fetchData();
}, []);

// ❌ ERRADO - Erro não tratado
useEffect(() => {
  async function fetchData() {
    const data = await fetchWorkouts(); // Pode lançar erro
    setWorkouts(data);
  }
  fetchData();
}, []);
```

### Component Composition

Prefira composição sobre props complexas:

```tsx
// ✅ CORRETO - Composição
export function Card({ children, header, footer }: CardProps) {
  return (
    <View className="bg-surface rounded-xl p-4">
      {header && <View className="mb-4">{header}</View>}
      {children}
      {footer && <View className="mt-4">{footer}</View>}
    </View>
  );
}

// Uso
<Card
  header={<Text className="text-xl font-bold">Título</Text>}
  footer={<Button label="Salvar" />}
>
  <Text>Conteúdo do card</Text>
</Card>

// ❌ ERRADO - Props complexas
<Card
  headerText="Título"
  headerStyle={{ fontSize: 20 }}
  footerButtonLabel="Salvar"
  footerButtonVariant="primary"
  content="Conteúdo do card"
/>
```

### Children Pattern

Use `children` para flexibilidade:

```tsx
// ✅ CORRETO
interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, children }: ModalProps) {
  if (!visible) return null;
  
  return (
    <View className="absolute inset-0 bg-black/80">
      <View className="bg-surface rounded-t-3xl p-6">
        {children}
      </View>
    </View>
  );
}

// Uso flexível
<Modal visible={show} onClose={handleClose}>
  <Text>Título</Text>
  <Button label="Confirmar" />
</Modal>
```

### Render Props (quando necessário)

Use render props para lógica compartilhada:

```tsx
// ✅ CORRETO - Render prop para lógica compartilhada
interface DataFetcherProps<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  children: (data: { data: T | undefined; isLoading: boolean; error: Error | null }) => React.ReactNode;
}

export function DataFetcher<T>({ queryKey, queryFn, children }: DataFetcherProps<T>) {
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
  });

  return <>{children({ data, isLoading, error: error as Error | null })}</>;
}

// Uso
<DataFetcher
  queryKey={['workouts']}
  queryFn={fetchWorkouts}
>
  {({ data, isLoading, error }) => {
    if (isLoading) return <Loading />;
    if (error) return <Error />;
    return <WorkoutList workouts={data} />;
  }}
</DataFetcher>
```

### Error Boundaries (React Native)

Em React Native, use try-catch em vez de Error Boundaries (não suportado nativamente):

```tsx
// ✅ CORRETO - Try-catch em componentes
export function WorkoutScreen() {
  const [error, setError] = useState<Error | null>(null);

  const handleAction = async () => {
    try {
      await riskyOperation();
    } catch (err) {
      setError(err as Error);
      // Log para Sentry/PostHog
      console.error('Error in WorkoutScreen:', err);
    }
  };

  if (error) {
    return <ErrorScreen error={error} onRetry={() => setError(null)} />;
  }

  return <View>{/* ... */}</View>;
}
```

### Controlled vs Uncontrolled Components

Use controlled components quando possível:

```tsx
// ✅ CORRETO - Controlled
export function WorkoutForm() {
  const [title, setTitle] = useState('');
  
  return (
    <TextInput
      value={title}
      onChangeText={setTitle}
      placeholder="Título do treino"
    />
  );
}

// ✅ CORRETO - Uncontrolled quando necessário (refs)
export function SearchInput() {
  const inputRef = useRef<TextInput>(null);
  
  const focusInput = () => {
    inputRef.current?.focus();
  };
  
  return <TextInput ref={inputRef} />;
}
```

### Deriving State

Evite estado derivado - calcule quando necessário:

```tsx
// ✅ CORRETO - Estado derivado calculado
export function WorkoutList({ workouts }: { workouts: Workout[] }) {
  const activeWorkouts = workouts.filter(w => w.isActive);
  const workoutCount = workouts.length;
  
  return (
    <View>
      <Text>{workoutCount} treinos</Text>
      {activeWorkouts.map(w => <WorkoutCard key={w.id} workout={w} />)}
    </View>
  );
}

// ❌ ERRADO - Estado derivado desnecessário
export function WorkoutList({ workouts }: { workouts: Workout[] }) {
  const [activeWorkouts, setActiveWorkouts] = useState<Workout[]>([]);
  
  useEffect(() => {
    setActiveWorkouts(workouts.filter(w => w.isActive));
  }, [workouts]);
  
  // ...
}
```

### Lifting State Up

Levante estado quando múltiplos componentes precisam:

```tsx
// ✅ CORRETO - Estado compartilhado no pai
export function WorkoutEditor() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  return (
    <View>
      <ExerciseList exercises={exercises} onAdd={setExercises} />
      <ExerciseSummary exercises={exercises} />
    </View>
  );
}

// ❌ ERRADO - Estado duplicado
export function ExerciseList() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  // ...
}

export function ExerciseSummary() {
  const [exercises, setExercises] = useState<Exercise[]>([]); // Duplicado!
  // ...
}
```

---

## 🗄️ Gerenciamento de Estado

### Zustand para Estado Global

Use Zustand para estado global (autenticação, perfil, etc.):

```tsx
// ✅ CORRETO
interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// No componente
const { user, setUser } = useAuthStore();
```

### Estado Local vs Global

- **Estado Local**: Use `useState` para estado específico do componente
- **Estado Global**: Use Zustand para estado compartilhado entre múltiplos componentes

```tsx
// ✅ CORRETO
export function WorkoutForm() {
  // Estado local - apenas este componente precisa
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Estado global - múltiplos componentes precisam
  const { user } = useAuthStore();
  
  // ...
}
```

---

## 🌐 Requisições e Cache

### TanStack Query (Recomendado)

Use TanStack Query para requisições HTTP e cache:

```tsx
// ✅ CORRETO
export function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*');
      if (error) throw error;
      return data;
    },
  });
}

// No componente
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

### Mutations com TanStack Query

```tsx
// ✅ CORRETO
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
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
```

### Fallback: useEffect + useState

Se não usar TanStack Query, use este padrão:

```tsx
// ✅ CORRETO (sem TanStack Query)
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
  
  // ...
}
```

---

## 📝 Nomenclatura

### Arquivos e Componentes

- **Componentes**: PascalCase (`WorkoutCard.tsx`, `ExerciseList.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useWorkouts.ts`, `useAuth.ts`)
- **Utils**: camelCase (`formatDate.ts`, `validateEmail.ts`)
- **Types**: PascalCase (`Workout.ts`, `User.ts`)

### Variáveis e Funções

- **Variáveis**: camelCase (`workoutTitle`, `selectedExercises`)
- **Funções**: camelCase (`handleSubmit`, `fetchWorkouts`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_WORKOUTS`, `API_BASE_URL`)

### Props

Use nomes descritivos e consistentes:

```tsx
// ✅ CORRETO
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

// ❌ ERRADO
interface ButtonProps {
  text: string;
  click: () => void;
  type?: string;
  loading?: boolean;
}
```

---

## 📁 Organização de Arquivos

### Estrutura de Pastas

```
src/
├── app/              # Rotas (Expo Router)
├── components/       # Componentes reutilizáveis
│   ├── ui/          # Componentes base (Button, Input, Card)
│   └── ...          # Outros componentes
├── hooks/            # Custom hooks
├── lib/              # Configurações e utilitários
├── store/            # Stores do Zustand
├── types/            # Definições de tipos TypeScript
└── utils/            # Funções auxiliares
```

### Imports

Organize imports nesta ordem:

1. Bibliotecas externas
2. Bibliotecas do Expo/React Native
3. Imports internos (começando com `@/`)
4. Imports relativos

```tsx
// ✅ CORRETO
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

import { WorkoutCard } from './WorkoutCard';
```

---

## ⚡ Performance

### Memoização

Use `React.memo` para componentes pesados:

```tsx
// ✅ CORRETO
export const ExerciseCard = React.memo(function ExerciseCard({ 
  exercise 
}: ExerciseCardProps) {
  return (
    <View className="bg-surface p-4">
      <Text>{exercise.name}</Text>
    </View>
  );
});
```

### useMemo e useCallback

Use quando necessário para evitar recálculos desnecessários:

```tsx
// ✅ CORRETO
export function WorkoutList({ workouts }: WorkoutListProps) {
  const sortedWorkouts = useMemo(
    () => workouts.sort((a, b) => a.title.localeCompare(b.title)),
    [workouts]
  );
  
  const handlePress = useCallback((id: string) => {
    // ...
  }, []);
  
  return (
    <View>
      {sortedWorkouts.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} onPress={handlePress} />
      ))}
    </View>
  );
}
```

### FlatList para Listas Longas

Sempre use `FlatList` para listas com muitos itens:

```tsx
// ✅ CORRETO
<FlatList
  data={workouts}
  renderItem={({ item }) => <WorkoutCard workout={item} />}
  keyExtractor={(item) => item.id}
  contentContainerStyle="p-4"
/>

// ❌ ERRADO
<View>
  {workouts.map(workout => (
    <WorkoutCard key={workout.id} workout={workout} />
  ))}
</View>
```

---

## ♿ Acessibilidade

### Labels e Hints

Sempre adicione `accessibilityLabel` e `accessibilityHint` quando necessário:

```tsx
// ✅ CORRETO
<TouchableOpacity
  onPress={handleDelete}
  accessibilityLabel="Deletar treino"
  accessibilityHint="Remove permanentemente este treino"
  accessibilityRole="button"
>
  <Ionicons name="trash" size={24} color="#FF3B3B" />
</TouchableOpacity>
```

### Textos Acessíveis

Use `Text` do React Native para textos (não `View` com texto):

```tsx
// ✅ CORRETO
<Text className="text-foreground text-lg">Título do Treino</Text>

// ❌ ERRADO
<View className="text-foreground text-lg">Título do Treino</View>
```

---

## 📚 Recursos Adicionais

- [NativeWind Documentation](https://www.nativewind.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Native Best Practices](https://reactnative.dev/docs/performance)

---

## ✅ Checklist de Revisão

Antes de fazer commit, verifique:

### Estilização
- [ ] Todos os estilos usam Tailwind (sem StyleSheet)
- [ ] Cores usam tokens do design system
- [ ] Classes condicionais usam `cn()`

### TypeScript
- [ ] Todas as props têm tipos TypeScript definidos
- [ ] Não há uso de `any` desnecessário
- [ ] Interfaces são usadas para objetos/props

### React
- [ ] `useEffect` tem dependências corretas
- [ ] Cleanup é feito quando necessário (subscriptions, timers)
- [ ] Funções passadas como props usam `useCallback`
- [ ] Cálculos pesados usam `useMemo` (apenas quando necessário)
- [ ] Componentes pesados usam `React.memo`
- [ ] Erros async são tratados em `useEffect`
- [ ] Keys únicas em listas

### Estrutura
- [ ] Componentes seguem a estrutura recomendada
- [ ] Componentes são pequenos e focados
- [ ] Custom hooks extraem lógica reutilizável

### Estado
- [ ] Estado local vs global está bem definido
- [ ] Zustand para estado global
- [ ] TanStack Query para dados do servidor (quando implementado)

### Performance
- [ ] `FlatList` para listas longas
- [ ] Memoização quando necessário
- [ ] Evita re-renders desnecessários

### Acessibilidade
- [ ] `accessibilityLabel` e `accessibilityHint` quando necessário
- [ ] Textos usam componente `Text`

### Nomenclatura
- [ ] Nomenclatura segue os padrões
- [ ] Handlers usam prefixo `handle`
- [ ] Hooks customizados usam prefixo `use`

### Organização
- [ ] Imports estão organizados
- [ ] Arquivos seguem estrutura de pastas

---

**Última atualização**: 2025-01-XX

