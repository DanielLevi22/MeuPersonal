import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockGetStreak = vi.fn();
const mockGetAchievements = vi.fn();
const mockFetchActiveDietPlan = vi.fn();
const mockFetchWorkouts = vi.fn();
const mockUseAuthUser = vi.fn();

vi.mock("@elevapro/shared", () => ({
  createGamificationService: () => ({
    getStreak: mockGetStreak,
    getAchievements: mockGetAchievements,
  }),
  createNutritionService: () => ({ fetchActiveDietPlan: mockFetchActiveDietPlan }),
  createWorkoutsService: () => ({ fetchWorkouts: mockFetchWorkouts }),
}));

vi.mock("@elevapro/supabase", () => ({ supabase: {} }));

vi.mock("@/shared/hooks/useAuthUser", () => ({
  useAuthUser: () => mockUseAuthUser(),
}));

const {
  useStudentStreak,
  useStudentAchievements,
  useStudentActiveDietPlan,
  useStudentWorkoutPlans,
  useCurrentStudentId,
} = await import("../hooks/useStudentDashboardData");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
describe("useCurrentStudentId", () => {
  it("returns null when user data is not yet loaded", () => {
    mockUseAuthUser.mockReturnValue({ data: null });

    const { result } = renderHook(() => useCurrentStudentId(), { wrapper });
    expect(result.current).toBeNull();
  });

  it("returns the authenticated user id", () => {
    mockUseAuthUser.mockReturnValue({ data: { id: "student-abc", fullName: "Test" } });

    const { result } = renderHook(() => useCurrentStudentId(), { wrapper });
    expect(result.current).toBe("student-abc");
  });
});

// ---------------------------------------------------------------------------
describe("useStudentStreak", () => {
  it("does not fetch when studentId is null", () => {
    const { result } = renderHook(() => useStudentStreak(null), { wrapper });
    expect(result.current.isFetching).toBe(false);
    expect(mockGetStreak).not.toHaveBeenCalled();
  });

  it("fetches streak and returns data", async () => {
    const mockStreak = { current: 5, longest: 12 };
    mockGetStreak.mockResolvedValueOnce(mockStreak);

    const { result } = renderHook(() => useStudentStreak("student-1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetStreak).toHaveBeenCalledWith("student-1");
    expect(result.current.data).toEqual(mockStreak);
  });

  it("throws on service error", async () => {
    mockGetStreak.mockRejectedValueOnce(new Error("Streak error"));

    const { result } = renderHook(() => useStudentStreak("student-1"), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Streak error");
  });
});

// ---------------------------------------------------------------------------
describe("useStudentAchievements", () => {
  it("does not fetch when studentId is null", () => {
    const { result } = renderHook(() => useStudentAchievements(null), { wrapper });
    expect(result.current.isFetching).toBe(false);
    expect(mockGetAchievements).not.toHaveBeenCalled();
  });

  it("fetches achievements and returns data", async () => {
    const mockAchievements = [{ id: "a-1", title: "Primeira semana" }];
    mockGetAchievements.mockResolvedValueOnce(mockAchievements);

    const { result } = renderHook(() => useStudentAchievements("student-1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetAchievements).toHaveBeenCalledWith("student-1");
    expect(result.current.data).toEqual(mockAchievements);
  });
});

// ---------------------------------------------------------------------------
describe("useStudentActiveDietPlan", () => {
  it("does not fetch when studentId is null", () => {
    const { result } = renderHook(() => useStudentActiveDietPlan(null), { wrapper });
    expect(result.current.isFetching).toBe(false);
    expect(mockFetchActiveDietPlan).not.toHaveBeenCalled();
  });

  it("returns null when no active diet plan", async () => {
    mockFetchActiveDietPlan.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useStudentActiveDietPlan("student-1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("returns active diet plan data", async () => {
    const mockPlan = { id: "diet-1", name: "Plano Hipertrofia" };
    mockFetchActiveDietPlan.mockResolvedValueOnce(mockPlan);

    const { result } = renderHook(() => useStudentActiveDietPlan("student-1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPlan);
  });
});

// ---------------------------------------------------------------------------
describe("useStudentWorkoutPlans", () => {
  it("does not fetch when studentId is null", () => {
    const { result } = renderHook(() => useStudentWorkoutPlans(null), { wrapper });
    expect(result.current.isFetching).toBe(false);
    expect(mockFetchWorkouts).not.toHaveBeenCalled();
  });

  it("fetches workouts and returns data", async () => {
    const mockWorkouts = [
      { id: "w-1", title: "Treino A" },
      { id: "w-2", title: "Treino B" },
    ];
    mockFetchWorkouts.mockResolvedValueOnce(mockWorkouts);

    const { result } = renderHook(() => useStudentWorkoutPlans("student-1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetchWorkouts).toHaveBeenCalledWith("student-1");
    expect(result.current.data).toHaveLength(2);
  });

  it("throws on service error", async () => {
    mockFetchWorkouts.mockRejectedValueOnce(new Error("Workouts error"));

    const { result } = renderHook(() => useStudentWorkoutPlans("student-1"), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Workouts error");
  });
});
