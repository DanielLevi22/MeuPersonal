// Nutrition Module - Public API
// This module handles nutrition plans, meals, and dietary tracking

// Store
export { useNutritionStore } from '../store/nutritionStore';
export type { DailyLog } from '../store/nutritionStore';

// Components
export {
    DailyNutrition,
    DayOptionsModal,
    FoodSearchModal,
    MacroProgressBar,
    MealCard
} from '../components';

// Screens
// Screens
export { default as CreateDietScreen } from '../screens/CreateDietScreen';
export { default as DietDetailsScreen } from '../screens/DietDetailsScreen';
export { default as NutritionScreen } from '../screens/NutritionScreen';
export { StudentNutritionScreen } from '../screens/StudentNutritionScreen';

// Routes
export { NutritionNavigator } from './routes';

// Utils
export * from '../utils/nutrition';

// Types (re-export from @meupersonal/core)
export type { DietMeal, DietMealItem, DietPlan, Food } from '@meupersonal/core';

