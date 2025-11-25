import { act, renderHook } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkoutTimer } from '../src/hooks/useWorkoutTimer';

// Mock Expo Speech
vi.mock('expo-speech', () => ({
  speak: vi.fn(),
  stop: vi.fn(),
}));

// Mock Expo Haptics
vi.mock('expo-haptics', () => ({
  notificationAsync: vi.fn(),
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

describe('useWorkoutTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
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
      vi.advanceTimersByTime(1000);
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
