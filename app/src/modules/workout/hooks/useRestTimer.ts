import { useCallback, useEffect, useReducer } from 'react';
import { DEFAULT_TIMER_UPDATE_INTERVAL } from '../constants';

interface RestTimerState {
  isResting: boolean;
  timer: number;
  isActive: boolean;
  currentRestItemId: string | null;
}

type RestTimerAction =
  | { type: 'START_REST'; payload: { duration: number; itemId: string } }
  | { type: 'TICK' }
  | { type: 'SKIP_REST' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' };

const initialState: RestTimerState = {
  isResting: false,
  timer: 0,
  isActive: false,
  currentRestItemId: null,
};

function restTimerReducer(state: RestTimerState, action: RestTimerAction): RestTimerState {
  switch (action.type) {
    case 'START_REST':
      return {
        isResting: true,
        timer: action.payload.duration,
        isActive: true,
        currentRestItemId: action.payload.itemId,
      };
    case 'TICK':
      return {
        ...state,
        timer: Math.max(0, state.timer - 1),
      };
    case 'SKIP_REST':
      return {
        ...state,
        isResting: false,
        isActive: false,
        timer: 0,
        currentRestItemId: null,
      };
    case 'PAUSE':
      return {
        ...state,
        isActive: false,
      };
    case 'RESUME':
      return {
        ...state,
        isActive: true,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

/**
 * Custom hook to manage workout rest timer between sets
 * Encapsulates all rest timer-related state and logic using useReducer
 *
 * @param onTimerComplete - Callback when timer reaches zero
 * @returns Rest timer state and control functions
 */
export function useRestTimer(onTimerComplete?: (itemId: string) => void) {
  const [state, dispatch] = useReducer(restTimerReducer, initialState);

  // Timer countdown effect
  useEffect(() => {
    if (!state.isActive || state.timer <= 0) return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, DEFAULT_TIMER_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [state.isActive, state.timer]);

  // Handle timer completion
  useEffect(() => {
    if (state.timer === 0 && state.isResting && state.currentRestItemId) {
      dispatch({ type: 'SKIP_REST' });
      if (onTimerComplete) {
        onTimerComplete(state.currentRestItemId);
      }
    }
  }, [state.timer, state.isResting, state.currentRestItemId, onTimerComplete]);

  const startRest = useCallback((duration: number, itemId: string) => {
    dispatch({ type: 'START_REST', payload: { duration, itemId } });
  }, []);

  const skipRest = useCallback(() => {
    dispatch({ type: 'SKIP_REST' });
  }, []);

  const pauseTimer = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, []);

  const resumeTimer = useCallback(() => {
    dispatch({ type: 'RESUME' });
  }, []);

  const resetTimer = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    isResting: state.isResting,
    timer: state.timer,
    isActive: state.isActive,
    currentRestItemId: state.currentRestItemId,
    startRest,
    skipRest,
    pauseTimer,
    resumeTimer,
    resetTimer,
  };
}
