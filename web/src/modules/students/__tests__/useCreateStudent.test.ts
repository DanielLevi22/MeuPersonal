import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Supabase
const mockGetSession = vi.fn();

vi.mock("@elevapro/supabase", () => ({
  supabase: {
    auth: { getSession: mockGetSession },
  },
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import after mock
const { useCreateStudent } = await import("../hooks/useCreateStudent");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe("useCreateStudent", () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "token-abc" } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST /api/students with correct params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, student_id: "student-456" }),
    });

    const { result } = renderHook(() => useCreateStudent(), { wrapper });

    result.current.mutate({
      fullName: "João Silva",
      email: "joao@example.com",
      password: "senha123",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/students",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer token-abc",
        }),
        body: expect.stringContaining("João Silva"),
      }),
    );

    expect(result.current.data).toEqual({ success: true, student_id: "student-456" });
  });

  it("throws when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });

    const { result } = renderHook(() => useCreateStudent(), { wrapper });

    result.current.mutate({
      fullName: "João",
      email: "joao@example.com",
      password: "senha123",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws when api returns an error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email já cadastrado" }),
    });

    const { result } = renderHook(() => useCreateStudent(), { wrapper });

    result.current.mutate({
      fullName: "Maria",
      email: "maria@example.com",
      password: "senha456",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Email já cadastrado");
  });

  it("throws with fallback message when api error has no message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useCreateStudent(), { wrapper });

    result.current.mutate({
      fullName: "Pedro",
      email: "pedro@example.com",
      password: "senha789",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Não foi possível criar o aluno");
  });
});
