/**
 * Nutrition Utilities
 * Cálculos de TMB, TDEE, macros e funções auxiliares
 */

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type Gender = 'M' | 'F';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'cutting' | 'maintenance' | 'bulking';

/**
 * Calcula TMB (Taxa Metabólica Basal) usando fórmula Mifflin-St Jeor
 * Mais precisa que Harris-Benedict
 */
export function calculateTMB(
  weight: number, // kg
  height: number, // cm
  age: number,
  gender: Gender
): number {
  if (gender === 'M') {
    // Homens: (10 × peso) + (6.25 × altura) - (5 × idade) + 5
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    // Mulheres: (10 × peso) + (6.25 × altura) - (5 × idade) - 161
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

/**
 * Fatores de atividade para cálculo de TDEE
 */
const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,     // Pouco ou nenhum exercício
  light: 1.375,       // Exercício leve 1-3 dias/semana
  moderate: 1.55,     // Exercício moderado 3-5 dias/semana
  active: 1.725,      // Exercício intenso 6-7 dias/semana
  very_active: 1.9    // Exercício muito intenso, trabalho físico
};

/**
 * Calcula TDEE (Total Daily Energy Expenditure)
 * TDEE = TMB × Fator de Atividade
 */
export function calculateTDEE(tmb: number, activityLevel: ActivityLevel): number {
  return Math.round(tmb * ACTIVITY_FACTORS[activityLevel]);
}

/**
 * Calcula calorias alvo baseado no objetivo
 */
export function calculateTargetCalories(tdee: number, goal: Goal): number {
  switch (goal) {
    case 'cutting':
      return Math.round(tdee * 0.8); // -20% para perda de peso
    case 'bulking':
      return Math.round(tdee * 1.1); // +10% para ganho de massa
    case 'maintenance':
    default:
      return tdee;
  }
}

/**
 * Distribui macros baseado no objetivo e calorias
 * Retorna gramas de proteína, carboidrato e gordura
 */
export function calculateMacrosFromCalories(
  calories: number,
  weight: number, // kg - para cálculo de proteína
  goal: Goal
): Macros {
  let proteinGrams: number;
  let fatGrams: number;
  let carbsGrams: number;

  switch (goal) {
    case 'cutting':
      // Cutting: Alta proteína, moderada gordura, baixo carb
      proteinGrams = weight * 2.2; // 2.2g/kg
      fatGrams = weight * 0.8; // 0.8g/kg
      
      // Calorias restantes vão para carbs
      const remainingCalories = calories - (proteinGrams * 4 + fatGrams * 9);
      carbsGrams = Math.max(0, remainingCalories / 4);
      break;

    case 'bulking':
      // Bulking: Alta proteína, alto carb, moderada gordura
      proteinGrams = weight * 2.0; // 2.0g/kg
      fatGrams = weight * 1.0; // 1.0g/kg
      
      const bulkingRemainingCalories = calories - (proteinGrams * 4 + fatGrams * 9);
      carbsGrams = Math.max(0, bulkingRemainingCalories / 4);
      break;

    case 'maintenance':
    default:
      // Maintenance: Proteína moderada, carb moderado, gordura moderada
      proteinGrams = weight * 1.8; // 1.8g/kg
      fatGrams = weight * 0.9; // 0.9g/kg
      
      const maintenanceRemainingCalories = calories - (proteinGrams * 4 + fatGrams * 9);
      carbsGrams = Math.max(0, maintenanceRemainingCalories / 4);
      break;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(proteinGrams),
    carbs: Math.round(carbsGrams),
    fat: Math.round(fatGrams)
  };
}

/**
 * Calcula macros totais de uma lista de alimentos
 */
export interface FoodItem {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number; // multiplicador baseado na porção
}

export function calculateTotalMacros(items: FoodItem[]): Macros {
  return items.reduce(
    (total, item) => ({
      calories: total.calories + item.calories * item.quantity,
      protein: total.protein + item.protein * item.quantity,
      carbs: total.carbs + item.carbs * item.quantity,
      fat: total.fat + item.fat * item.quantity
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Converte unidades de medida para gramas
 */
export function convertToGrams(quantity: number, unit: string, servingSize: number): number {
  const unitMap: Record<string, number> = {
    'g': 1,
    'kg': 1000,
    'ml': 1, // Assumindo densidade ~1 para líquidos
    'l': 1000,
    'unidade': servingSize,
    'colher': 15, // colher de sopa
    'xícara': 240
  };

  return quantity * (unitMap[unit.toLowerCase()] || 1);
}

/**
 * Calcula macros de um alimento baseado na quantidade
 */
export function calculateFoodMacros(
  food: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    serving_size: number;
  },
  quantity: number,
  unit: string
): Macros {
  const grams = convertToGrams(quantity, unit, food.serving_size);
  const multiplier = grams / food.serving_size;

  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10
  };
}

/**
 * Formata macros para exibição
 */
export function formatMacros(macros: Macros): string {
  return `${macros.calories}kcal | ${macros.protein}p | ${macros.carbs}c | ${macros.fat}g`;
}

/**
 * Calcula percentual de progresso de um macro
 */
export function calculateMacroProgress(consumed: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((consumed / target) * 100));
}

/**
 * Verifica se está dentro da margem de tolerância (para substituições)
 */
export function isWithinTolerance(
  value: number,
  target: number,
  tolerancePercent: number = 10
): boolean {
  const diff = Math.abs(value - target);
  const tolerance = target * (tolerancePercent / 100);
  return diff <= tolerance;
}

/**
 * Encontra alimentos similares baseado em macros
 */
export function areFoodsSimilar(
  food1: Macros,
  food2: Macros,
  tolerance: number = 10
): boolean {
  return (
    isWithinTolerance(food1.protein, food2.protein, tolerance) &&
    isWithinTolerance(food1.carbs, food2.carbs, tolerance) &&
    isWithinTolerance(food1.fat, food2.fat, tolerance)
  );
}
