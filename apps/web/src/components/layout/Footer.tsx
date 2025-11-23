export function Footer() {
  return (
    <footer className="py-12 border-t border-white/10 bg-background">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MeuPersonal. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
