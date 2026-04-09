import { act, renderHook } from '@testing-library/react-native';
import { useWorkoutTimer } from '../src/modules/workout/hooks/useWorkoutTimer';

// Mock Expo Speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

// Mock Expo Haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

describe('useWorkoutTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWorkoutTimer());

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it('should start timer correctly', () => {
    const { result } = renderHook(() => useWorkoutTimer());

    act(() => {
      result.current.startTimer(60);
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.timeLeft).toBe(60);
    expect(result.current.totalTime).toBe(60);
  });

  it('should countdown correctly', () => {
    const { result } = renderHook(() => useWorkoutTimer());

    act(() => {
      result.current.startTimer(60);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe(59);
  });

  it('should stop timer', () => {
    const { result } = renderHook(() => useWorkoutTimer());

    act(() => {
      result.current.startTimer(60);
    });

    act(() => {
      result.current.stopTimer();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.timeLeft).toBe(0);
  });
});
