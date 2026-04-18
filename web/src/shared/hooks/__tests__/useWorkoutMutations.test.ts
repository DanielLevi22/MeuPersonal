import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Supabase mock ---
const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => ({ select: mockSelect })),
}));
const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));

vi.mock("@meupersonal/supabase", () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  },
}));

const { useCreateWorkout, useUpdateWorkout, useDeleteWorkout, useDeleteWorkoutItem } = await import(
  "../useWorkoutMutations"
);

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

const authedUser = { id: "personal-123" };

beforeEach(() => {
  mockGetUser.mockResolvedValue({ data: { user: authedUser } });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
describe("useCreateWorkout", () => {
  it("inserts into workouts table with correct fields", async () => {
    const created = { id: "workout-1", title: "Treino A" };
    mockSingle.mockResolvedValueOnce({ data: created, error: null });

    const { result } = renderHook(() => useCreateWorkout(), { wrapper });

    result.current.mutate({
      title: "Treino A",
      training_plan_id: "plan-1",
      difficulty: "intermediate",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("workouts");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Treino A",
        specialist_id: authedUser.id,
        training_plan_id: "plan-1",
        difficulty: "intermediate",
      }),
    );
    expect(result.current.data).toEqual(created);
  });

  it("throws when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const { result } = renderHook(() => useCreateWorkout(), { wrapper });
    result.current.mutate({ title: "Treino X" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Usuário não autenticado");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("throws when supabase returns an error", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "RLS violation" } });

    const { result } = renderHook(() => useCreateWorkout(), { wrapper });
    result.current.mutate({ title: "Treino Y" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "RLS violation" });
  });
});

// ---------------------------------------------------------------------------
describe("useUpdateWorkout", () => {
  it("updates workouts table with correct fields", async () => {
    const updated = { id: "workout-2", title: "Treino B Atualizado" };
    mockSingle.mockResolvedValueOnce({ data: updated, error: null });

    const eqMock = vi.fn(() => ({ select: mockSelect }));
    mockUpdate.mockReturnValueOnce({ eq: eqMock });

    const { result } = renderHook(() => useUpdateWorkout(), { wrapper });

    result.current.mutate({
      id: "workout-2",
      title: "Treino B Atualizado",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("workouts");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Treino B Atualizado" }),
    );
    expect(eqMock).toHaveBeenCalledWith("id", "workout-2");
    expect(result.current.data).toEqual(updated);
  });

  it("throws when supabase returns an error", async () => {
    const eqMock = vi.fn(() => ({ select: mockSelect }));
    mockUpdate.mockReturnValueOnce({ eq: eqMock });
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "not found" } });

    const { result } = renderHook(() => useUpdateWorkout(), { wrapper });
    result.current.mutate({ id: "bad-id", title: "X" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "not found" });
  });
});

// ---------------------------------------------------------------------------
describe("useDeleteWorkout", () => {
  it("deletes from workouts table by id", async () => {
    mockDeleteEq.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useDeleteWorkout(), { wrapper });
    result.current.mutate("workout-3");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("workouts");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "workout-3");
  });

  it("throws when supabase returns an error", async () => {
    mockDeleteEq.mockResolvedValueOnce({ data: null, error: { message: "cannot delete" } });

    const { result } = renderHook(() => useDeleteWorkout(), { wrapper });
    result.current.mutate("workout-3");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "cannot delete" });
  });
});

// ---------------------------------------------------------------------------
describe("useDeleteWorkoutItem", () => {
  it("deletes from workout_exercises table by id", async () => {
    mockDeleteEq.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useDeleteWorkoutItem(), { wrapper });
    result.current.mutate("item-99");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("workout_exercises");
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "item-99");
  });

  it("throws when supabase returns an error", async () => {
    mockDeleteEq.mockResolvedValueOnce({ data: null, error: { message: "item not found" } });

    const { result } = renderHook(() => useDeleteWorkoutItem(), { wrapper });
    result.current.mutate("item-bad");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "item not found" });
  });
});
