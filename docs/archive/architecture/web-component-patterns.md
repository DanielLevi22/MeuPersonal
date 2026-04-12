# Web Component Patterns

Guia de referência para construção de componentes no `web/`. Leia antes de criar qualquer novo componente.

---

## Stack de UI

| Lib | Propósito |
|---|---|
| `tailwind-variants` (tv) | Variantes tipadas com merge automático |
| `tailwind-merge` + `clsx` | Merge seguro de classes (via `cn()`) |
| `@radix-ui/react-slot` | Padrão `asChild` (polimorfismo seguro) |

---

## Hierarquia de componentes (3 camadas)

```
Primitive   → web/src/components/ui/         → Button, Input, Dialog, FormField
Composed    → web/src/components/             → SearchInput, ConfirmDialog
Feature     → web/src/modules/<m>/components/ → CreateStudentModal, WorkoutCard
```

- **Primitive**: sem lógica de negócio, sem imports de módulos, 100% reutilizável
- **Composed**: combina primitivos para casos de uso comuns
- **Feature**: usa primitivos + hooks do módulo

---

## Padrão de variantes com `tailwind-variants`

```tsx
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
  base: "inline-flex items-center rounded-lg font-semibold transition-colors",
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      ghost: "bg-transparent hover:bg-white/10",
      destructive: "bg-red-600 text-white hover:bg-red-700",
    },
    size: {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}
```

**Regras:**
- Sempre exportar `VariantProps<typeof tv_instance>` junto com o componente
- `className` sempre aceito para override pontual via `cn()`
- Nunca usar `style={{}}` inline

---

## Padrão `asChild` (polimorfismo)

Permite que o componente seja renderizado como outro elemento sem perder estilos/comportamento.

```tsx
import { Slot } from "@radix-ui/react-slot";

interface ButtonProps {
  asChild?: boolean;
}

function Button({ asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp {...props} />;
}

// Uso: Button renderizado como <a>
<Button asChild>
  <Link href="/dashboard">Dashboard</Link>
</Button>
```

**Atenção:** `Slot` usa `React.Children.only` — não passe múltiplos children quando usar `asChild`.

---

## Composição: FormField

`FormField` gerencia label + children + mensagem de erro/hint sem saber qual input está dentro.

```tsx
<FormField label="Email" htmlFor="email" error={errors.email} hint="Usado para login">
  <Input id="email" type="email" error={!!errors.email} {...register("email")} />
</FormField>
```

```tsx
// FormField.tsx — não conhece Input, aceita qualquer children
function FormField({ label, htmlFor, error, hint, optional, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor}>{label} {optional && <span>(opcional)</span>}</label>
      {children}
      {(error ?? hint) && <p className={error ? "text-red-400" : "text-muted"}>{error ?? hint}</p>}
    </div>
  );
}
```

---

## Padrão Dialog

`Dialog` é um primitive puro: controla visibilidade, título, backdrop click, Escape key.

```tsx
<Dialog open={isOpen} onClose={handleClose} title="Novo Aluno" maxWidth="md">
  <form onSubmit={handleSubmit}>
    {/* conteúdo */}
  </form>
</Dialog>
```

Props aceitas: `open`, `onClose`, `title`, `description?`, `maxWidth?`, `className?`, `children`.

---

## TDD checklist para novos componentes

Antes de implementar qualquer primitive ou composed:

1. **Escrever o arquivo de teste** em `__tests__/ComponentName.test.tsx`
2. Cobrir: render básico, props, interações, estados (loading, error, disabled)
3. Implementar o componente
4. Rodar `npx vitest run src/components/ui/__tests__`
5. `npx biome check` no arquivo
6. `npx tsc --noEmit`

Para hooks de módulo:
1. Teste em `src/modules/<m>/__tests__/useHook.test.ts`
2. Mockar Supabase via `vi.mock("@meupersonal/supabase")`
3. Usar `renderHook` + `waitFor` do `@testing-library/react`

---

## Convenções de arquivo

| Tipo | Localização | Sufixo |
|---|---|---|
| Primitive | `web/src/components/ui/` | `.tsx` |
| Primitive test | `web/src/components/ui/__tests__/` | `.test.tsx` |
| Feature component | `web/src/modules/<m>/components/` | `.tsx` |
| Feature hook | `web/src/modules/<m>/hooks/` | `.ts` |
| Hook test | `web/src/modules/<m>/__tests__/` | `.test.ts` |

---

## O que NÃO fazer

- `style={{}}` ou classes hardcoded de cor: use tokens do design system
- Componentes com mais de 150 linhas: dividir em primitivos + feature
- `alert()` / `confirm()`: usar estado de erro no formulário ou Dialog de confirmação
- Importar um módulo dentro de outro módulo: usar props/callbacks
- Criar primitive específico de feature: primitivos são 100% genéricos
