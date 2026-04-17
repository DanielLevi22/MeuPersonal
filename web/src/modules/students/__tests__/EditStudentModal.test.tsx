import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockMutateAsync = vi.fn();
const mockUseStudentDetails = vi.fn();

vi.mock("../hooks/useUpdateStudent", () => ({
  useUpdateStudent: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("../hooks/useStudentDetails", () => ({
  useStudentDetails: (id: string | null) => mockUseStudentDetails(id),
}));

const { EditStudentModal } = await import("../components/EditStudentModal");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return React.createElement(QueryClientProvider, { client }, children);
}

const studentDetails = {
  profile: {
    id: "student-1",
    full_name: "João Silva",
    email: "joao@example.com",
    phone: "(11) 99999-9999",
    weight: 75,
    height: 175,
    notes: "Objetivo: hipertrofia",
  },
  measurements: {
    neck: 38,
    shoulder: null,
    chest: 95,
    waist: 80,
    abdomen: null,
    hips: null,
    arm_right_relaxed: null,
    arm_left_relaxed: null,
    arm_right_contracted: null,
    arm_left_contracted: null,
    thigh_proximal: null,
    thigh_distal: null,
    calf: null,
  },
};

describe("EditStudentModal", () => {
  beforeEach(() => {
    mockUseStudentDetails.mockReturnValue({
      data: studentDetails,
      isLoading: false,
    });
    mockMutateAsync.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when studentId is null", () => {
    render(<EditStudentModal studentId={null} onClose={vi.fn()} />, { wrapper });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders with student data pre-filled", () => {
    render(<EditStudentModal studentId="student-1" onClose={vi.fn()} />, { wrapper });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByDisplayValue("João Silva")).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    mockUseStudentDetails.mockReturnValue({ data: undefined, isLoading: true });
    render(<EditStudentModal studentId="student-1" onClose={vi.fn()} />, { wrapper });
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("switches to medidas tab and shows measurement fields", async () => {
    render(<EditStudentModal studentId="student-1" onClose={vi.fn()} />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: "Medidas" }));

    await waitFor(() => expect(screen.getByDisplayValue("38")).toBeInTheDocument());
    expect(screen.getByDisplayValue("95")).toBeInTheDocument();
  });

  it("submits with updated name", async () => {
    render(<EditStudentModal studentId="student-1" onClose={vi.fn()} />, { wrapper });

    const nameInput = screen.getByDisplayValue("João Silva");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "João Santos");
    await userEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: "student-1",
          full_name: "João Santos",
        }),
      ),
    );
  });

  it("calls onClose after successful save", async () => {
    const onClose = vi.fn();
    render(<EditStudentModal studentId="student-1" onClose={onClose} />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it("shows error message on failure", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("Erro ao salvar"));
    render(<EditStudentModal studentId="student-1" onClose={vi.fn()} />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Erro ao salvar"));
  });

  it("calls onClose when cancel is clicked", async () => {
    const onClose = vi.fn();
    render(<EditStudentModal studentId="student-1" onClose={onClose} />, { wrapper });
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
