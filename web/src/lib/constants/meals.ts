export const DEFAULT_MEAL_TYPES = [
  { type: "breakfast", label: "Café da Manhã", order: 1, defaultTime: "08:00" },
  { type: "snack", label: "Lanche da Manhã", order: 2, defaultTime: "10:00" },
  { type: "lunch", label: "Almoço", order: 3, defaultTime: "12:00" },
  { type: "snack", label: "Lanche da Tarde", order: 4, defaultTime: "16:00" },
  { type: "dinner", label: "Jantar", order: 5, defaultTime: "20:00" },
  { type: "snack", label: "Ceia", order: 6, defaultTime: "22:00" },
] as const;

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "custom";
