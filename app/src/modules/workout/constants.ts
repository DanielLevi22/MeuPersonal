// Workout Module Constants
// Centralized constants to avoid magic numbers throughout the codebase

export const DEFAULT_REST_TIME = 60; // seconds
export const DEFAULT_TIMER_UPDATE_INTERVAL = 1000; // milliseconds
export const ANIMATION_DELAY_PER_ITEM = 100; // milliseconds
export const MIN_CALORIES_PER_HOUR = 3.5; // MET value for moderate exercise
export const DEFAULT_BODY_WEIGHT = 70; // kg - used for calorie estimation

import type { ImageSourcePropType } from 'react-native';

export const MUSCLE_IMAGES: Record<string, ImageSourcePropType> = {
  Peito: require('../../../assets/workouts/chest.jpg'),
  Costas: require('../../../assets/workouts/back.jpg'),
  Pernas: require('../../../assets/workouts/legs.jpg'),
  Braços: require('../../../assets/workouts/arms.jpg'),
  Ombros: require('../../../assets/workouts/shoulders.jpg'),
  Abdominais: require('../../../assets/workouts/abs.jpg'),
  Geral: require('../../../assets/workouts/back.jpg'),
};
