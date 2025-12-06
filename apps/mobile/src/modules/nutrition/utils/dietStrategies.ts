
export type DietStrategyType = 'standard' | 'carb_cycling' | 'ketogenic' | 'intermittent_fasting';

export interface MacroSplit {
  protein: number; // Percentage (0-100) or grams depending on context, we'll use % for targets
  carbs: number;
  fat: number;
  calories: number; // Total Daily Target
}

export interface MealTemplate {
  name: string;
  time: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description?: string; // e.g. "High Carb Meal"
}

export interface DayTemplate {
  dayOfWeek: number; // 0-6
  label: string; // e.g., "High Carb Day"
  macros: MacroSplit; // Specific macros for this day
  meals: MealTemplate[];
  description: string; // "Dia de Treino Pesado: Foco em repor glicogênio"
}

export interface StrategyResult {
  averageMacros: MacroSplit; // For simple display
  weeklySchedule: DayTemplate[];
  description: string;
}

export const DIET_STRATEGIES: Record<DietStrategyType, { 
  label: string; 
  description: string; 
  icon: string 
}> = {
  standard: {
    label: 'Padrão Balanceada',
    description: 'Equilíbrio constante de macros todos os dias. Ideal para iniciantes.',
    icon: 'nutrition'
  },
  carb_cycling: {
    label: 'Ciclo de Carboidratos',
    description: 'Alterra dias de alto e baixo carbo para maximizar ganho de massa e perda de gordura.',
    icon: 'refresh-circle'
  },
  ketogenic: {
    label: 'Cetogênica',
    description: 'Baixo carbo e alta gordura para forçar o corpo a usar gordura como fonte de energia.',
    icon: 'flame'
  },
  intermittent_fasting: {
    label: 'Jejum Intermitente 16/8',
    description: 'Janela de alimentação de 8h. Pula o café da manhã para otimizar hormônios.',
    icon: 'time'
  }
};

export function calculateDietStrategy(
  strategy: DietStrategyType, 
  baseCalories: number
): StrategyResult {
  
  const weeklySchedule: DayTemplate[] = [];
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  // Standard Meal Schedule (Base)
  const baseMeals: MealTemplate[] = [
    { name: 'Café da Manhã', time: '08:00', type: 'breakfast' },
    { name: 'Lanche da Manhã', time: '10:30', type: 'snack' },
    { name: 'Almoço', time: '13:00', type: 'lunch' },
    { name: 'Lanche da Tarde', time: '16:00', type: 'snack' },
    { name: 'Jantar', time: '19:30', type: 'dinner' },
    { name: 'Ceia', time: '22:00', type: 'snack' },
  ];

  // Intermittent Fasting Schedule (Skip breakfast, start late)
  const fastingMeals: MealTemplate[] = [
    { name: 'Quebra-Jejum (Almoço)', time: '12:00', type: 'lunch' },
    { name: 'Lanche da Tarde', time: '15:00', type: 'snack' },
    { name: 'Pré-Treino', time: '17:30', type: 'snack' },
    { name: 'Jantar (Pós-treino)', time: '20:00', type: 'dinner' },
  ];

  for (let day = 0; day < 7; day++) { // 0 = Sun
    let dailyMacros: MacroSplit;
    let dailyMeals = [...baseMeals];
    let dayLabel = 'Dia Padrão';
    let dayDesc = 'Manutenção';

    switch (strategy) {
      case 'carb_cycling':
        // High Carb: Mon (1), Wed (3), Fri (5)
        // Low Carb: Tue (2), Thu (4), Sat (6)
        // Maintenance: Sun (0)
        if ([1, 3, 5].includes(day)) {
          dayLabel = 'Alto Carboidrato';
          dayDesc = 'Treino Pesado: +Energia';
          dailyMacros = {
            calories: Math.round(baseCalories * 1.15),
            protein: 25, // %
            carbs: 50,
            fat: 25
          };
        } else if ([2, 4, 6].includes(day)) {
          dayLabel = 'Baixo Carboidrato';
          dayDesc = 'Descanso/Cardio: +Queima';
          dailyMacros = {
            calories: Math.round(baseCalories * 0.85),
            protein: 30,
            carbs: 20,
            fat: 50
          };
        } else {
          dayLabel = 'Manutenção';
          dayDesc = 'Equilíbrio';
          dailyMacros = {
            calories: baseCalories,
            protein: 30,
            carbs: 40,
            fat: 30
          };
        }
        break;

      case 'ketogenic':
        dayLabel = 'Keto';
        dayDesc = 'Cetose Constante';
        dailyMacros = {
          calories: baseCalories,
          protein: 25,
          carbs: 5,
          fat: 70
        };
        break;

      case 'intermittent_fasting':
        dayLabel = 'Janela 8h';
        dayDesc = '12:00 - 20:00';
        dailyMeals = [...fastingMeals];
        dailyMacros = {
          calories: baseCalories,
          protein: 30,
          carbs: 40,
          fat: 30
        };
        break;

      case 'standard':
      default:
        dayLabel = 'Balanceado';
        dayDesc = 'Rotina';
        dailyMacros = {
          calories: baseCalories,
          protein: 30,
          carbs: 40,
          fat: 30
        };
        break;
    }

    // Convert percentages to grams for the average calculation IF needed, 
    // but here we just store targets. 
    // Important: The UI 'CreateDietScreen' uses GRAMS for inputs.
    // So we should probably convert these percentages to approximate grams based on the calorie target.
    // 1g Protein = 4kcal, 1g Carb = 4kcal, 1g Fat = 9kcal
    
    // We update the dailyMacros object to have Grams as well, or we just calculate it here for the aggregation
    // Let's attach grams to the dailyMacros for use in the UI preview
    const proteinGrams = Math.round((dailyMacros.calories * (dailyMacros.protein / 100)) / 4);
    const carbsGrams = Math.round((dailyMacros.calories * (dailyMacros.carbs / 100)) / 4);
    const fatGrams = Math.round((dailyMacros.calories * (dailyMacros.fat / 100)) / 9);

    // Overwrite with gram values if the system expects grams in targets (which it does based on previous file analysis)
    // Actually, CreateDietScreen inputs are G. 
    // We will return G in the daily template.
    
    const dailyTemplate: DayTemplate = {
      dayOfWeek: day,
      label: dayLabel,
      description: dayDesc,
      meals: dailyMeals,
      macros: {
        calories: dailyMacros.calories,
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams
      }
    };

    weeklySchedule.push(dailyTemplate);

    totalCalories += dailyMacros.calories;
    totalProtein += proteinGrams;
    totalCarbs += carbsGrams;
    totalFat += fatGrams;
  }

  return {
    description: DIET_STRATEGIES[strategy].description,
    weeklySchedule,
    averageMacros: {
      calories: Math.round(totalCalories / 7),
      protein: Math.round(totalProtein / 7),
      carbs: Math.round(totalCarbs / 7),
      fat: Math.round(totalFat / 7)
    }
  };
}
