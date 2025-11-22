# Como Adicionar Date Pickers na Tela de Criação de Plano de Dieta

Este guia mostra como adicionar seletores de data visuais (calendário) na tela de criação de plano de dieta.

## ✅ Pré-requisitos

- Biblioteca já instalada: `@react-native-community/datetimepicker`
- Migration SQL pronta: `drizzle/migration-diet-plan-status.sql`
- Store atualizado com lifecycle methods

## 📝 Passos para Implementação

### PASSO 1: Adicionar Imports

No arquivo `src/app/nutrition/create.tsx`, **linha ~16**, adicione `Platform` no import do react-native e o import do DateTimePicker:

```typescript
import {
  Alert,
  Platform,  // <-- ADICIONAR
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';  // <-- ADICIONAR
```

### PASSO 2: Adicionar States

**Linha ~37**, após `activityLevel`, adicione os estados das datas:

```typescript
  // Date states
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
```

### PASSO 3: Atualizar createDietPlan

**Linha ~110**, adicione `end_date` na chamada:

```typescript
      await createDietPlan({
        student_id: selectedStudent.id,
        personal_id: user!.id,
        name: dietName,
        description: `Plano ${goal} - ${activityLevel}`,
        start_date: startDate.toISOString().split('T')[0],  // <-- MUDAR de new Date()
        end_date: endDate.toISOString().split('T')[0],      // <-- ADICIONAR
        target_calories: macros.calories,
        target_protein: macros.protein,
        target_carbs: macros.carbs,
        target_fat: macros.fat,
      });
```

### PASSO 4: Adicionar UI dos Date Pickers

**Linha ~213**, APÓS `</View>` do "Nome do Plano", adicione:

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141B2D',
    borderWidth: 2,
    borderColor: '#1E2A42',
    borderRadius: 12,
    padding: 16,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#8B92A8',
    marginTop: 4,
  },
```

## 🎯 Resultado Final

Após seguir todos os passos:
- ✅ Botões com ícone de calendário para selecionar datas
- ✅ Data formatada em português (DD/MM/AAAA)
- ✅ Picker nativo do Android/iOS
- ✅ Validação: data fim deve ser após data início
- ✅ Contador de duração em dias

## 📋 Próximo Passo

Não esqueça de executar a migration no Supabase:
- Arquivo: `drizzle/migration-diet-plan-status.sql`
- Abra o SQL Editor no Supabase e execute o script
