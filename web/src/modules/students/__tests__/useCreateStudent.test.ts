import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Supabase
const mockRpc = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@meupersonal/supabase", () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  },
}));

// Import after mock
const { useCreateStudent } = await import("../hooks/useCreateStudent");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe("useCreateStudent", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "prof-123" } } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls create_student_with_auth rpc with correct params", async () => {
    mockRpc.mockResolvedValueOnce({
      data: { success: true, student_id: "student-456" },
      error: null,
    });

    const { result } = renderHook(() => useCreateStudent(), { wrapper });

    result.current.mutate({
      fullName: "João Silva",
      email: "joao@example.com",
      password: "senha123",
      phone: "(11) 99999-9999",
      weight: "75",
      height: "175",
      notes: "Objetivo: hipertrofia",
      experience_level: "Iniciante",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRpc).toHaveBeenCalledWith("create_student_with_auth", {
      p_professional_id: "prof-123",
      p_full_name: "João Silva",
      p_email: "joao@example.com",
      p_password: "senha123",
      p_phone: "(11) 99999-9999",
      p_weight: 75,
      p_height: 175,
      p_notes: "Objetivo: hipertrofia",
      p_experience_level: "Iniciante",
    });
  });

  it("throws when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const { result } = renderHook(() => useCreateStudent(), { wrapper });

    result.current.mutate({
      fullName: "João",
      email: "joao@example.com",
      password: "senha123",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("throws when rpc returns an error", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Email already registered" },
    });

    const { result } = renderHook(() => useCreateStudent(), { wrapper });

    result.current.mutate({
      fullName: "Maria",
      email: "maria@example.com",
      password: "senha456",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("throws when rpc returns success=false", async () => {
    mockRpc.mockResolvedValueOnce({
      data: { success: false, error: "User already exists" },
      error: null,
    });

    const { result } = renderHook(() => useCreateStudent(), { wrapper });

    result.current.mutate({
      fullName: "Pedro",
      email: "pedro@example.com",
      password: "senha789",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
