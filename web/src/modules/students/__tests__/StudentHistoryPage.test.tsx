import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "student-1" }),
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

const mockUseStudents = vi.fn();
const mockUseStudentHistory = vi.fn();

vi.mock("@/shared/hooks/useStudents", () => ({
  useStudents: () => mockUseStudents(),
}));

vi.mock("../hooks/useStudentHistory", () => ({
  useStudentHistory: (id: string) => mockUseStudentHistory(id),
}));

const { default: StudentHistoryPage } = await import("../pages/StudentHistoryPage");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return React.createElement(QueryClientProvider, { client }, children);
}

const mockStudent = { id: "student-1", full_name: "João Silva", email: "joao@test.com" };

const mockEvents = [
  {
    id: "ws-1",
    type: "workout_session" as const,
    title: "Treino A",
    subtitle: "Treino concluído",
    date: "2026-04-10T10:00:00Z",
    status: "completed" as const,
  },
  {
    id: "pa-1",
    type: "physical_assessment" as const,
    title: "Avaliação física",
    subtitle: "75 kg",
    date: "2026-04-05T09:00:00Z",
  },
  {
    id: "dp-1",
    type: "diet_plan" as const,
    title: "Plano Hipertrofia",
    subtitle: "Plano de dieta ativo",
    date: "2026-04-01T08:00:00Z",
  },
];

describe("StudentHistoryPage", () => {
  beforeEach(() => {
    mockUseStudents.mockReturnValue({ data: [mockStudent] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton when fetching", () => {
    mockUseStudentHistory.mockReturnValue({ data: [], isLoading: true, isError: false });
    render(<StudentHistoryPage />, { wrapper });
    expect(screen.getByText("Histórico")).toBeInTheDocument();
    // Loading skeleton elements should be present
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no events", () => {
    mockUseStudentHistory.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<StudentHistoryPage />, { wrapper });
    expect(screen.getByText("Sem histórico")).toBeInTheDocument();
    expect(screen.getByText(/Nenhuma atividade registrada/)).toBeInTheDocument();
  });

  it("shows error state when fetch fails", () => {
    mockUseStudentHistory.mockReturnValue({ data: [], isLoading: false, isError: true });
    render(<StudentHistoryPage />, { wrapper });
    expect(screen.getByText(/Erro ao carregar histórico/)).toBeInTheDocument();
  });

  it("renders all event types in the timeline", () => {
    mockUseStudentHistory.mockReturnValue({ data: mockEvents, isLoading: false, isError: false });
    render(<StudentHistoryPage />, { wrapper });

    expect(screen.getByText("Treino A")).toBeInTheDocument();
    expect(screen.getByText("Treino concluído")).toBeInTheDocument();
    expect(screen.getByText("Avaliação física")).toBeInTheDocument();
    expect(screen.getByText("75 kg")).toBeInTheDocument();
    expect(screen.getByText("Plano Hipertrofia")).toBeInTheDocument();
  });

  it("shows completed badge for completed workout sessions", () => {
    mockUseStudentHistory.mockReturnValue({ data: mockEvents, isLoading: false, isError: false });
    render(<StudentHistoryPage />, { wrapper });
    expect(screen.getByText("Concluído")).toBeInTheDocument();
  });

  it("displays student name in header", () => {
    mockUseStudentHistory.mockReturnValue({ data: mockEvents, isLoading: false, isError: false });
    render(<StudentHistoryPage />, { wrapper });
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });
});
