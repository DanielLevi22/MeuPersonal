import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();

vi.mock("@elevapro/supabase", () => ({
  supabase: { auth: { getSession: mockGetSession } },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { useCreateAssessment } = await import("../hooks/useCreateAssessment");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

const baseInput = {
  studentId: "student-1",
  student_id: "student-1",
  specialist_id: "specialist-1",
  weight: 75,
  height: 175,
  notes: null,
  neck: null,
  shoulder: null,
  chest: null,
  waist: null,
  abdomen: null,
  hips: null,
  arm_right_relaxed: null,
  arm_left_relaxed: null,
  arm_right_contracted: null,
  arm_left_contracted: null,
  forearm_right: null,
  forearm_left: null,
  thigh_proximal_right: null,
  thigh_proximal_left: null,
  thigh_medial_right: null,
  thigh_medial_left: null,
  calf_right: null,
  calf_left: null,
  skinfold_chest: null,
  skinfold_abdominal: null,
  skinfold_thigh: null,
  skinfold_triceps: null,
  skinfold_suprailiac: null,
  skinfold_subscapular: null,
  skinfold_midaxillary: null,
};

describe("useCreateAssessment", () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "token-abc" } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST /api/students/:id/assessments with correct payload", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assessment: { id: "a-1", ...baseInput } }),
    });

    const { result } = renderHook(() => useCreateAssessment(), { wrapper });
    result.current.mutate(baseInput);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/students/student-1/assessments",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token-abc" }),
      }),
    );
  });

  it("throws when unauthenticated", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    const { result } = renderHook(() => useCreateAssessment(), { wrapper });
    result.current.mutate(baseInput);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Usuário não autenticado");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws when api returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Aluno não encontrado" }),
    });
    const { result } = renderHook(() => useCreateAssessment(), { wrapper });
    result.current.mutate(baseInput);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Aluno não encontrado");
  });
});
