import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";

describe("DeleteConfirmModal", () => {
  it("does not render when closed", () => {
    render(<DeleteConfirmModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByText("Deletar item")).not.toBeInTheDocument();
  });

  it("renders with default title when open", () => {
    render(<DeleteConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText("Deletar item")).toBeInTheDocument();
  });

  it("renders custom title", () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Remover exercício"
      />,
    );
    expect(screen.getByText("Remover exercício")).toBeInTheDocument();
  });

  it("displays itemName in confirmation message", () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        itemName="Supino Reto"
      />,
    );
    expect(screen.getByText(/"Supino Reto"/)).toBeInTheDocument();
  });

  it("falls back to deprecated workoutTitle prop", () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        workoutTitle="Treino A"
      />,
    );
    expect(screen.getByText(/"Treino A"/)).toBeInTheDocument();
  });

  it("itemName takes priority over workoutTitle", () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        itemName="Exercício Novo"
        workoutTitle="Treino Antigo"
      />,
    );
    expect(screen.getByText(/"Exercício Novo"/)).toBeInTheDocument();
    expect(screen.queryByText(/"Treino Antigo"/)).not.toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    render(<DeleteConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole("button", { name: "Deletar" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const onClose = vi.fn();
    render(<DeleteConfirmModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const onClose = vi.fn();
    const { container } = render(
      <DeleteConfirmModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />,
    );
    // backdrop is the absolute div before the modal card
    const backdrop = container.querySelector(".absolute.inset-0");
    expect(backdrop).not.toBeNull();
    if (backdrop) {
      await userEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("disables buttons and shows loading text when isLoading=true", () => {
    render(
      <DeleteConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={true} />,
    );
    expect(screen.getByRole("button", { name: "Deletando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("does not disable buttons when isLoading=false", () => {
    render(
      <DeleteConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByRole("button", { name: "Deletar" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).not.toBeDisabled();
  });
});
