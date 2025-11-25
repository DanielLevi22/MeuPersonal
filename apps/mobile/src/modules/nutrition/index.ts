// Nutrition Module - Public API
// This module handles nutrition plans, meals, and dietary tracking

// Store
export { useNutritionStore } from './store/nutritionStore';
export type { DailyLog } from './store/nutritionStore';

// Components
export { DailyNutrition } from './components/DailyNutrition';
export { DayOptionsModal } from './components/DayOptionsModal';
export { EditFoodModal } from './components/EditFoodModal';
export { FoodSearchModal } from './components/FoodSearchModal';
export { MacroProgressBar } from './components/MacroProgressBar';
export { MealCard } from './components/MealCard';
export { TimePickerModal } from './components/TimePickerModal';

// Utils
export * from './utils/nutrition';

// Types (re-export from @meupersonal/core)
export type { DietMeal, DietMealItem, DietPlan, Food } from '@meupersonal/core';

