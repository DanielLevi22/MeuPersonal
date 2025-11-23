import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="text-2xl font-display font-bold text-foreground tracking-tight">
          Meu<span className="text-primary">Personal</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Link href="#features" className="hover:text-primary transition-colors">Funcionalidades</Link>
          <Link href="#testimonials" className="hover:text-primary transition-colors">Depoimentos</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Planos</Link>
          <ThemeToggle />
        </nav>
        <button className="bg-primary hover:bg-primary-hover text-black px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 hover:shadow-[0_0_20px_-5px_rgba(204,255,0,0.5)]">
          Baixar App
        </button>
      </div>
    </header>
  );
}
