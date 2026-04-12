export type DietStrategyType =
  | "standard"
  | "carb_cycling"
  | "ketogenic"
  | "intermittent_fasting"
  | "manual";

export interface MacroSplit {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export interface MealTemplate {
  name: string;
  time: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  description?: string;
}

export interface DayTemplate {
  dayOfWeek: number;
  label: string;
  macros: MacroSplit;
  meals: MealTemplate[];
  description: string;
}

export interface StrategyResult {
  averageMacros: MacroSplit;
  weeklySchedule: DayTemplate[];
  description: string;
}

export const DIET_STRATEGIES: Record<
  DietStrategyType,
  {
    label: string;
    description: string;
    icon: string;
  }
> = {
  standard: {
    label: "Padrão Balanceada",
    description: "Equilíbrio constante de macros todos os dias. Ideal para iniciantes.",
    icon: "nutrition",
  },
  carb_cycling: {
    label: "Ciclo de Carboidratos",
    description: "Alterna dias de alto e baixo carbo para maximizar ganho de massa.",
    icon: "refresh-circle",
  },
  ketogenic: {
    label: "Cetogênica",
    description: "Baixo carbo e alta gordura para forçar o corpo a usar gordura como energia.",
    icon: "flame",
  },
  intermittent_fasting: {
    label: "Jejum Intermitente",
    description: "Janela de alimentação de 8h. Ideal para controle de insulina.",
    icon: "time",
  },
  manual: {
    label: "Personalizado",
    description: "Crie sua própria estrutura do zero sem sugestões automáticas.",
    icon: "create",
  },
};

export function calculateDietStrategy(
  strategy: DietStrategyType,
  baseCalories: number,
): StrategyResult {
  const weeklySchedule: DayTemplate[] = [];
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  const baseMeals: MealTemplate[] = [
    { name: "Café da Manhã", time: "08:00", type: "breakfast" },
    { name: "Almoço", time: "13:00", type: "lunch" },
    { name: "Lanche da Tarde", time: "16:00", type: "snack" },
    { name: "Jantar", time: "20:00", type: "dinner" },
  ];

  const fastingMeals: MealTemplate[] = [
    { name: "Quebra-Jejum (Almoço)", time: "12:00", type: "lunch" },
    { name: "Lanche da Tarde", time: "15:00", type: "snack" },
    { name: "Jantar (Pós-treino)", time: "19:00", type: "dinner" },
    { name: "Ceia", time: "21:30", type: "snack" },
  ];

  for (let day = 0; day < 7; day++) {
    let dailyMacros: { calories: number; protein: number; carbs: number; fat: number };
    let dailyMeals = [...baseMeals];
    let dayLabel = "Dia Padrão";
    let dayDesc = "Manutenção";

    switch (strategy) {
      case "carb_cycling":
        if ([1, 3, 5].includes(day)) {
          dayLabel = "Alto Carboidrato";
          dayDesc = "Treino Pesado";
          dailyMacros = {
            calories: Math.round(baseCalories * 1.15),
            protein: 25,
            carbs: 50,
            fat: 25,
          };
        } else if ([2, 4, 6].includes(day)) {
          dayLabel = "Baixo Carboidrato";
          dayDesc = "Descanso/Cardio";
          dailyMacros = {
            calories: Math.round(baseCalories * 0.85),
            protein: 30,
            carbs: 20,
            fat: 50,
          };
        } else {
          dayLabel = "Manutenção";
          dayDesc = "Equilíbrio";
          dailyMacros = { calories: baseCalories, protein: 30, carbs: 40, fat: 30 };
        }
        break;

      case "ketogenic":
        dayLabel = "Keto";
        dayDesc = "Cetose";
        dailyMacros = { calories: baseCalories, protein: 25, carbs: 5, fat: 70 };
        break;

      case "intermittent_fasting":
        dayLabel = "Janela 8h";
        dayDesc = "12:00 - 20:00";
        dailyMeals = [...fastingMeals];
        dailyMacros = { calories: baseCalories, protein: 30, carbs: 40, fat: 30 };
        break;

      case "manual":
        dayLabel = "Manual";
        dayDesc = "Livre";
        dailyMeals = [];
        dailyMacros = { calories: baseCalories, protein: 30, carbs: 40, fat: 30 };
        break;

      default:
        dailyMacros = { calories: baseCalories, protein: 30, carbs: 40, fat: 30 };
        break;
    }

    const proteinGrams = Math.round((dailyMacros.calories * (dailyMacros.protein / 100)) / 4);
    const carbsGrams = Math.round((dailyMacros.calories * (dailyMacros.carbs / 100)) / 4);
    const fatGrams = Math.round((dailyMacros.calories * (dailyMacros.fat / 100)) / 9);

    const dailyTemplate: DayTemplate = {
      dayOfWeek: day,
      label: dayLabel,
      description: dayDesc,
      meals: dailyMeals,
      macros: {
        calories: dailyMacros.calories,
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams,
      },
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
      fat: Math.round(totalFat / 7),
    },
  };
}
