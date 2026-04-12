# REGRAS OBRIGATÓRIAS PARA I.A. (MEUPERSONAL)

Este arquivo define as regras **inegociáveis** para desenvolvimento neste projeto. A I.A. deve ler e seguir estas diretrizes em **todas** as iterações.

## 1. Disciplina Arquitetural
*   **NUNCA** crie arquivos fora das pastas de módulos (`src/modules/*`) ou componentes compartilhados (`src/components/*`) sem permissão explícita.
*   **API Pública**: Ao importar de um módulo, use **SEMPRE** o `index.ts` da raiz do módulo.
    *   ✅ `import { StudentList } from '@/modules/students';`
    *   ❌ `import { StudentList } from '@/modules/students/screens/StudentList';`
*   **Novas Rotas**: Toda nova rota deve ser tipada e centralizada. **NUNCA** use `router.push('string-solta')`.

## 2. Foco e Contexto
*   **Não invente**: Se o usuário pediu "A", faça "A". Não refatore "B" ou "C" a menos que quebrem o build.
*   **Confirmação**: Antes de criar arquivos novos ou instalar libs, **pergunte** no Chat (exceto se estiver explícito no Plano de Implementação aprovado).
*   **Limpeza**: Ao final de uma task, verifique se não deixou arquivos temporários ou sujeira de debug.

## 3. Padrões de Código (Quality Gates)
*   **Estilização**: Use **apenas** Tailwind classes (`className`). Nada de `StyleSheet.create` (exceto para animações complexas do Reanimated).
*   **Cores**: Use tokens semânticos (`bg-primary`, `text-zinc-500`) em vez de hexcodes hardcoded (`#FF6B35`).
*   **Tipagem**: **PROIBIDO** usar `any`. Se não souber o tipo, crie uma interface `IWarning` ou use `unknown` até descobrir.
*   **Ícones**: Use `Ionicons` ou `MaterialCommunityIcons` via `@expo/vector-icons`.

## 4. Fluxo de Trabalho (Obrigatório)
1.  **Ler Contexto**: Checar `docs/ARCHITECTURE_MASTERPLAN.md` e `docs/AI_MANDATORY_RULES.md`.
2.  **Planejar**: Criar/Atualizar `implementation_plan.md` e pedir "De acordo?".
3.  **Executar**: Implementar seguindo o plano.
4.  **Verificar**: Rodar `npm run type-check` (ou similar) antes de avisar que acabou.

---

**Se você (I.A.) estiver prestes a violar uma dessas regras, PARE e justifique para o usuário.**
