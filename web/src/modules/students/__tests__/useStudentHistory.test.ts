import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();

vi.mock("@meupersonal/supabase", () => ({
  supabase: {
    auth: { getSession: mockGetSession },
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { useStudentHistory } = await import("../hooks/useStudentHistory");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

const mockEvents = [
  {
    id: "ws-1",
    type: "workout_session",
    title: "Treino A",
    subtitle: "Treino concluído",
    date: "2026-04-10T10:00:00Z",
    status: "completed",
  },
  {
    id: "pa-1",
    type: "physical_assessment",
    title: "Avaliação física",
    subtitle: "75 kg",
    date: "2026-04-05T09:00:00Z",
  },
];

describe("useStudentHistory", () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "token-abc" } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when studentId is null", () => {
    const { result } = renderHook(() => useStudentHistory(null), { wrapper });
    expect(result.current.isFetching).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls GET /api/students/:id/history and returns events", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: mockEvents }),
    });

    const { result } = renderHook(() => useStudentHistory("student-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/students/student-1/history",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token-abc" }),
      }),
    );

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].type).toBe("workout_session");
  });

  it("throws when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });

    const { result } = renderHook(() => useStudentHistory("student-1"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Usuário não autenticado");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws when api returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Aluno não encontrado" }),
    });

    const { result } = renderHook(() => useStudentHistory("unknown"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Aluno não encontrado");
  });
});
