# Módulo AI - Arquitetura Centralizada

## Visão Geral

O módulo `src/modules/ai` centraliza toda a lógica de Inteligência Artificial do app, servindo como o "cérebro" do Co-Piloto.

## Estrutura

```
src/modules/ai/
├── services/
│   ├── GeminiService.ts      # Core: comunicação com API Gemini
│   └── CoPilotService.ts     # High-level: lógica do Co-Piloto
├── types/                    # (futuro) Tipos compartilhados
├── components/               # (futuro) Componentes de chat
├── tools/                    # (futuro) Tool Calling (navegação, etc)
└── index.ts                  # Exports centralizados
```

## GeminiService

**Responsabilidade**: Comunicação direta com a API do Google Gemini.

**Features**:
- Gerenciamento centralizado da API Key
- Suporte a Tool Calling (function declarations)
- Parsing robusto de JSON
- Error handling

**Exemplo**:
```typescript
import { GeminiService } from '@/modules/ai';

const result = await GeminiService.generateContent<MyType>(
  "Prompt aqui",
  { responseMimeType: 'application/json', temperature: 0.7 }
);

if (result.data) {
  // Usar result.data
}

if (result.functionCall) {
  // AI chamou uma função (Tool Calling)
}
```

## CoPilotService

**Responsabilidade**: Lógica de alto nível do Co-Piloto (persona, contexto, prompts).

**Métodos**:
- `negotiateWorkout()`: Gera treinos personalizados com explicação
- `answerQuestion()`: (futuro) Responde dúvidas sobre o app

**Exemplo**:
```typescript
import { CoPilotService } from '@/modules/ai';

const response = await CoPilotService.negotiateWorkout(
  'ABC',
  'Hipertrofia',
  'Intermediário',
  availableExercises,
  'Aluno tem dor no joelho'
);

if (response) {
  console.log(response.explanation); // Explicação da I.A.
  console.log(response.plan);        // Array de treinos
}
```

## Migração de Código Legado

### Antes (WorkoutAIService direto)
```typescript
import { WorkoutAIService } from '../services/WorkoutAIService';
const result = await WorkoutAIService.generateWorkoutStructure(...);
```

### Agora (via CoPilotService)
```typescript
// WorkoutAIService ainda funciona (wrapper)
import { WorkoutAIService } from '../services/WorkoutAIService';
const result = await WorkoutAIService.generateWorkoutStructure(...);

// OU use diretamente o CoPilotService
import { CoPilotService } from '@/modules/ai';
const result = await CoPilotService.negotiateWorkout(...);
```

## Próximos Passos (Tool Calling)

1. **Navegação**: AI pode navegar o usuário (`router.push()`)
2. **Ações**: AI pode executar ações (criar treino, marcar refeição)
3. **Contexto Global**: AI acessa dados de todos os módulos

**Exemplo futuro**:
```typescript
// Usuário: "Como faço para ver meu treino de hoje?"
// AI detecta intenção → Chama tool "navigate" → router.push('/workouts/today')
```

## Benefícios

✅ **Centralizado**: Uma fonte de verdade para toda I.A.  
✅ **Reutilizável**: Mesma lógica para treino, nutrição, chat  
✅ **Escalável**: Fácil adicionar novos recursos (voz, vídeo)  
✅ **Testável**: Mocks mais simples, testes isolados  
✅ **Manutenível**: Mudanças na API Gemini = 1 arquivo só
