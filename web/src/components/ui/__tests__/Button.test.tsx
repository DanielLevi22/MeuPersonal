import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../Button";

describe("Button", () => {
  it("renders with label", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Clique</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Bloqueado</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Bloqueado
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies primary variant styles by default", () => {
    render(<Button>Primário</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/bg-primary/);
  });

  it("applies ghost variant styles", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/bg-transparent/);
  });

  it("applies destructive variant styles", () => {
    render(<Button variant="destructive">Excluir</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/bg-red/);
  });

  it("applies sm size styles", () => {
    render(<Button size="sm">Pequeno</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/text-sm/);
  });

  it("applies lg size styles", () => {
    render(<Button size="lg">Grande</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/text-base/);
  });

  it("shows loading state", () => {
    render(<Button isLoading>Carregando</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("renders as child element with asChild", () => {
    render(
      <Button asChild>
        <a href="/rota">Link</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Link" })).toBeInTheDocument();
  });
});
