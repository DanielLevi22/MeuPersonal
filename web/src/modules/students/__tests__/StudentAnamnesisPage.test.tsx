import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "student-1" }),
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

const mockUseStudents = vi.fn();
const mockUseStudentAnamnesis = vi.fn();

vi.mock("@/shared/hooks/useStudents", () => ({
  useStudents: () => mockUseStudents(),
}));

vi.mock("../hooks/useStudentAnamnesis", () => ({
  useStudentAnamnesis: (id: string) => mockUseStudentAnamnesis(id),
}));

const { default: StudentAnamnesisPage } = await import("../pages/StudentAnamnesisPage");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return React.createElement(QueryClientProvider, { client }, children);
}

const mockStudent = { id: "student-1", full_name: "João Silva", email: "joao@test.com" };

const mockAnamnesis = {
  id: "anamnesis-1",
  student_id: "student-1",
  responses: {
    full_name: { questionId: "full_name", value: "João Silva" },
    age: { questionId: "age", value: 25 },
    main_goal: { questionId: "main_goal", value: "Hipertrofia" },
    trained_sport_specific: { questionId: "trained_sport_specific", value: false },
    // conditional question — should not show
    sport_specific_name: { questionId: "sport_specific_name", value: "Futebol" },
  },
  completed_at: "2026-04-01T10:00:00Z",
  created_at: "2026-04-01T10:00:00Z",
  updated_at: "2026-04-01T10:00:00Z",
};

describe("StudentAnamnesisPage", () => {
  beforeEach(() => {
    mockUseStudents.mockReturnValue({ data: [mockStudent] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton when fetching", () => {
    mockUseStudentAnamnesis.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<StudentAnamnesisPage />, { wrapper });
    expect(screen.getByText("Anamnese")).toBeInTheDocument();
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no anamnesis", () => {
    mockUseStudentAnamnesis.mockReturnValue({ data: null, isLoading: false, isError: false });
    render(<StudentAnamnesisPage />, { wrapper });
    expect(screen.getByText("Anamnese não preenchida")).toBeInTheDocument();
    expect(screen.getByText(/não respondeu o questionário/)).toBeInTheDocument();
  });

  it("shows error state on fetch failure", () => {
    mockUseStudentAnamnesis.mockReturnValue({ data: null, isLoading: false, isError: true });
    render(<StudentAnamnesisPage />, { wrapper });
    expect(screen.getByText(/Erro ao carregar anamnese/)).toBeInTheDocument();
  });

  it("renders answered responses from anamnesis", () => {
    mockUseStudentAnamnesis.mockReturnValue({
      data: mockAnamnesis,
      isLoading: false,
      isError: false,
    });
    render(<StudentAnamnesisPage />, { wrapper });

    // "João Silva" appears in both header and response value — use getAllByText
    expect(screen.getAllByText("João Silva").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("Hipertrofia")).toBeInTheDocument();
  });

  it("renders boolean answers as Sim/Não", () => {
    mockUseStudentAnamnesis.mockReturnValue({
      data: mockAnamnesis,
      isLoading: false,
      isError: false,
    });
    render(<StudentAnamnesisPage />, { wrapper });
    expect(screen.getByText("Não")).toBeInTheDocument();
  });

  it("hides conditional questions when condition not met", () => {
    mockUseStudentAnamnesis.mockReturnValue({
      data: mockAnamnesis,
      isLoading: false,
      isError: false,
    });
    render(<StudentAnamnesisPage />, { wrapper });
    // "Se sim, qual?" should not be visible since trained_sport_specific is false
    expect(screen.queryByText("Se sim, qual?")).not.toBeInTheDocument();
  });

  it("shows completed date badge when anamnesis is complete", () => {
    mockUseStudentAnamnesis.mockReturnValue({
      data: mockAnamnesis,
      isLoading: false,
      isError: false,
    });
    render(<StudentAnamnesisPage />, { wrapper });
    expect(screen.getByText(/Concluída em/)).toBeInTheDocument();
  });

  it("displays student name in header", () => {
    mockUseStudentAnamnesis.mockReturnValue({
      data: mockAnamnesis,
      isLoading: false,
      isError: false,
    });
    render(<StudentAnamnesisPage />, { wrapper });
    expect(screen.getAllByText("João Silva").length).toBeGreaterThanOrEqual(1);
  });

  it("shows section titles", () => {
    mockUseStudentAnamnesis.mockReturnValue({
      data: mockAnamnesis,
      isLoading: false,
      isError: false,
    });
    render(<StudentAnamnesisPage />, { wrapper });
    expect(screen.getByText("Dados Pessoais")).toBeInTheDocument();
    expect(screen.getByText("Objetivos")).toBeInTheDocument();
  });
});
