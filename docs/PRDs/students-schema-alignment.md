# PRD: students-schema-alignment

**Data de criação:** 2026-04-17
**Status:** approved
**Branch:** feature/students-schema-alignment
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

> Nenhuma linha de código é escrita sem estas 3 perguntas respondidas.

### O quê?
Atualizar todo o código do módulo Students para o novo schema: `coachings` → `student_specialists`, remover tabelas inexistentes (`students`, `relationship_transfers`), corrigir nomes de colunas e alinhar tipos com a nova estrutura.

### Por quê?
O código atual usa `coachings/professional_id/client_id/invite_code em profiles` — todos removidos ou renomeados. Sem isso, todas as queries do módulo falham em runtime.

### Como saberemos que está pronto?
- [ ] `Student` type derivado de `student_specialists` join `profiles`
- [ ] `fetchStudents` consulta `student_specialists` com `specialist_id`
- [ ] `generateLinkCode` usa `student_link_codes` (não `profiles.invite_code`)
- [ ] `linkStudent` valida via `student_link_codes`
- [ ] `removeStudent` faz soft delete (`status = 'inactive'`) — não deleta dados
- [ ] API route `POST /api/students` usa `specialist_services` e `student_specialists`
- [ ] API route `PATCH/DELETE /api/students/[id]` usa `student_specialists`
- [ ] `physical_assessments` usa `specialist_id` (não `personal_id`)
- [ ] `tsc --noEmit` e `biome check` limpos
- [ ] Testes existentes passando

---

## Escopo

### Incluído
- `app/src/modules/students/store/studentStore.ts`
- `web/src/shared/hooks/useStudents.ts`
- `web/src/modules/students/hooks/` (create, delete, details, history)
- `web/src/app/api/students/route.ts` e `[id]/route.ts`
- `web/src/app/api/students/[id]/history/route.ts` e `assessments/route.ts`

### Fora do escopo
- Transferência de alunos (`relationship_transfers`) — não existe no novo schema
- Anamnese — módulo Assessment (PR separado)
- Telas de UI — só ajuste de tipos, sem redesign

## Mudanças de schema

| Antes | Depois |
|-------|--------|
| `coachings` | `student_specialists` |
| `coachings.professional_id` | `student_specialists.specialist_id` |
| `coachings.client_id` | `student_specialists.student_id` |
| `profiles.invite_code` | `student_link_codes.code` |
| `professional_services.service_category` | `specialist_services.service_type` |
| `professional_services.user_id` | `specialist_services.specialist_id` |
| `physical_assessments.personal_id` | `physical_assessments.specialist_id` |

---

## Checklist de done

- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/STATUS.md` atualizado
