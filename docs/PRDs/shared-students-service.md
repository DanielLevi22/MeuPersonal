# PRD: shared-students-service

**Data de criação:** 2026-04-17
**Status:** done
**Branch:** feature/shared-students-service
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Criar `shared/src/services/students.service.ts` com todas as queries de alunos como funções puras async que recebem `SupabaseClient` — eliminando o código duplicado entre `app/` e `web/`.

### Por quê?
Hoje a mesma lógica de query existe em `app/studentStore.ts` e `web/useStudents.ts`. Qualquer mudança de schema exige mexer nos dois. O serviço centralizado elimina essa duplicação e serve de camada única para mobile (via Zustand) e web (via Server Components direto ou TanStack Query em Client Components).

### Como saberemos que está pronto?
- [ ] `shared/src/services/students.service.ts` com `createStudentsService(supabase)` exportando: `fetchStudents`, `fetchStudentDetails`, `generateLinkCode`, `linkStudent`, `removeStudent`, `fetchStudentHistory`
- [ ] `shared/src/types/students.types.ts` com todos os tipos derivados do schema
- [ ] `shared/src/index.ts` exporta o service e os tipos
- [ ] `web/src/shared/hooks/useStudents.ts` e hooks de detalhe migrados para usar o service
- [ ] `app/src/modules/students/store/studentStore.ts` migrado para usar o service
- [ ] Sem duplicação de queries entre app/ e web/
- [ ] `tsc --noEmit` e `biome check` limpos
- [ ] Testes existentes passando

---

## Contexto

O schema foi alinhado na feature anterior (`students-schema-alignment`). Agora que as tabelas e tipos estão corretos, faz sentido centralizar a lógica de acesso a dados antes de construir mais features em cima.

## Escopo

### Incluído
- `shared/src/services/students.service.ts`
- `shared/src/types/students.types.ts`
- `shared/src/index.ts` (exportar novos módulos)
- Migração dos consumers existentes: `app/studentStore.ts` e `web/useStudents.ts` + hooks de detalhe/histórico

### Fora do escopo
- Migração de Server Components do Next.js para usar o service diretamente (próxima feature)
- Criação de Server Actions
- Qualquer nova feature de UI

---

## Fluxo de dados

```
[app/ Zustand store]     → createStudentsService(supabase).fetchStudents(...)
[web/ TanStack hook]     → createStudentsService(supabase).fetchStudents(...)
[web/ Server Component]  → createStudentsService(supabase).fetchStudents(...)  ← futuro
                           → student_specialists JOIN profiles
                           ← Student[]
```

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `student_specialists` | SELECT | join com profiles |
| `profiles` | SELECT | dados do aluno |
| `student_link_codes` | INSERT / SELECT / DELETE | geração e validação de código |
| `physical_assessments` | SELECT | histórico de avaliações |

## Impacto em outros módulos

- `app/src/modules/students/store/studentStore.ts` — passa a chamar o service
- `web/src/shared/hooks/useStudents.ts` — passa a chamar o service
- `web/src/modules/students/hooks/` — hooks de detalhe/histórico usam o service

---

## Decisões técnicas

**Por que `createStudentsService(supabase)` e não import direto?**
O cliente Supabase é diferente no mobile (JS client) e no web server-side (service role ou cookie-based). Injetar o client permite usar o mesmo service nos dois contextos sem acoplamento.

---

## Checklist de done

- [x] Código funciona e passou em lint + typecheck + testes
- [x] PR mergeado em `development`
- [x] `docs/features/shared-students-service.md` criado ou atualizado
- [x] `docs/STATUS.md` atualizado
