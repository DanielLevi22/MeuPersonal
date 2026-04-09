export const DEFAULT_MEAL_TYPES = [
  { type: 'breakfast', label: 'Café da Manhã', order: 1, defaultTime: '07:00' },
  { type: 'morning_snack', label: 'Lanche da Manhã', order: 2, defaultTime: '10:00' },
  { type: 'lunch', label: 'Almoço', order: 3, defaultTime: '12:00' },
  { type: 'afternoon_snack', label: 'Lanche da Tarde', order: 4, defaultTime: '15:00' },
  { type: 'dinner', label: 'Janta', order: 5, defaultTime: '19:00' },
  { type: 'evening_snack', label: 'Ceia', order: 6, defaultTime: '22:00' },
] as const;

export type MealType = typeof DEFAULT_MEAL_TYPES[number]['type'];
