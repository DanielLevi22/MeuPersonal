import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.fn();

vi.mock("@elevapro/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const { useStudentAnamnesis } = await import("../hooks/useStudentAnamnesis");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

const mockAnamnesis = {
  id: "anamnesis-1",
  student_id: "student-1",
  responses: {
    full_name: { questionId: "full_name", value: "João Silva" },
    age: { questionId: "age", value: 25 },
    main_goal: { questionId: "main_goal", value: "Hipertrofia" },
  },
  completed_at: "2026-04-01T10:00:00Z",
  created_at: "2026-04-01T10:00:00Z",
  updated_at: "2026-04-01T10:00:00Z",
};

function buildChain(finalValue: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(finalValue),
  };
  return chain;
}

describe("useStudentAnamnesis", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when studentId is null", () => {
    const { result } = renderHook(() => useStudentAnamnesis(null), { wrapper });
    expect(result.current.isFetching).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns null when no anamnesis found", async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }));

    const { result } = renderHook(() => useStudentAnamnesis("student-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("returns anamnesis data on success", async () => {
    mockFrom.mockReturnValue(buildChain({ data: mockAnamnesis, error: null }));

    const { result } = renderHook(() => useStudentAnamnesis("student-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("anamnesis-1");
    expect(result.current.data?.student_id).toBe("student-1");
    expect(result.current.data?.completed_at).toBe("2026-04-01T10:00:00Z");
  });

  it("throws on Supabase error", async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: { message: "DB error" } }));

    const { result } = renderHook(() => useStudentAnamnesis("student-1"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("DB error");
  });

  it("queries correct table and student_id", async () => {
    const chain = buildChain({ data: mockAnamnesis, error: null });
    mockFrom.mockReturnValue(chain);

    renderHook(() => useStudentAnamnesis("student-42"), { wrapper });

    await waitFor(() => expect(chain.maybeSingle).toHaveBeenCalled());
    expect(mockFrom).toHaveBeenCalledWith("student_anamnesis");
    expect(chain.eq).toHaveBeenCalledWith("student_id", "student-42");
  });
});
