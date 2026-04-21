import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();

vi.mock("@elevapro/supabase", () => ({
  supabase: {
    auth: { getSession: mockGetSession },
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { useUpdateStudent } = await import("../hooks/useUpdateStudent");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe("useUpdateStudent", () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "token-abc" } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls PATCH /api/students/:id with correct payload", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useUpdateStudent(), { wrapper });

    result.current.mutate({
      studentId: "student-123",
      full_name: "Maria Silva",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/students/student-123",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer token-abc",
        }),
        body: expect.stringContaining("Maria Silva"),
      }),
    );
  });

  it("includes measurements in the request body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useUpdateStudent(), { wrapper });

    result.current.mutate({
      studentId: "student-123",
      full_name: "Pedro",
      measurements: { neck: 38, waist: 80, chest: 95 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.measurements).toEqual(expect.objectContaining({ neck: 38, waist: 80 }));
  });

  it("throws when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });

    const { result } = renderHook(() => useUpdateStudent(), { wrapper });

    result.current.mutate({ studentId: "student-123", full_name: "Ana" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Usuário não autenticado");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws when api returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Aluno não encontrado" }),
    });

    const { result } = renderHook(() => useUpdateStudent(), { wrapper });

    result.current.mutate({ studentId: "unknown-id", full_name: "João" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Aluno não encontrado");
  });

  it("throws with fallback message when api error has no message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useUpdateStudent(), { wrapper });

    result.current.mutate({ studentId: "student-123", full_name: "Lucas" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Não foi possível atualizar o aluno");
  });
});
