# Feature: shared-students-service

**Status:** done  
**Mergeado em:** 2026-04-17  
**Branch:** `feature/shared-students-service`

---

## O que foi feito

Centralização das queries de students e auth em serviços compartilhados (`shared/`), eliminando código duplicado entre `app/` e `web/`.

---

## Arquivos criados

| Arquivo | Descrição |
|---------|-----------|
| `shared/src/services/students.service.ts` | `createStudentsService(supabase)` — todas as queries de alunos |
| `shared/src/types/students.types.ts` | Tipos canônicos: `Student`, `PhysicalAssessment`, `FetchStudentsParams`, etc. |

---

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `shared/src/services/auth.service.ts` | Adicionado `signUp`, `signInWithStatusCheck` |
| `shared/src/index.ts` | Exporta novos serviço e tipos |
| `app/src/modules/students/store/studentStore.ts` | Usa `createStudentsService` — removidas ~200 linhas de queries inline |
| `app/src/modules/auth/store/authStore.ts` | `signIn`, `signOut`, `signUp` delegam ao `createAuthService` |
| `web/src/modules/auth/store/authStore.ts` | `initialize`, `signOut`, `signIn` usam `createAuthService` |
| `web/src/shared/hooks/useStudents.ts` | `useStudents` usa `createStudentsService`; re-exporta `Student` de shared |
| `web/src/shared/hooks/useAuthUser.ts` | Usa `authService.getProfileWithServices`; corrigido bug de schema antigo (`professional_services` → `specialist_services`) |
| `CLAUDE.md` | Seção de data fetching Next.js reescrita com regras de Server Component vs TanStack Query |

---

## API do students service

```ts
const service = createStudentsService(supabase);

service.fetchStudents(specialistId, params?)     // → { students, total }
service.fetchStudentDetails(studentId)           // → PhysicalAssessment | null
service.fetchStudentHistory(studentId)           // → PhysicalAssessment[]
service.generateLinkCode(studentId)              // → string (código 6 chars)
service.linkStudent(specialistId, code)          // → { success, error? }
service.removeStudent(specialistId, studentId, serviceType, endedBy) // → void
service.addPhysicalAssessment(studentId, specialistId, data)         // → void
service.createStudent(data)                      // → { success, studentId? }
```

## API do auth service (adições)

```ts
const service = createAuthService(supabase);

service.signUp(email, password, accountType, metadata?)  // → { success, error? }
service.signInWithStatusCheck(email, password)           // → { success, error? } — verifica account_status
```

---

## Padrão de consumo

```ts
// Mobile — Zustand store
const service = createStudentsService(supabase); // supabase do app/lib/supabase

// Web Server Component
const supabase = await createServerSupabaseClient();
const service = createStudentsService(supabase);
const students = await service.fetchStudents(specialistId);

// Web Client Component (TanStack Query)
const { data } = useQuery({
  queryKey: ['students', userId],
  queryFn: () => studentsService.fetchStudents(userId, { limit: 200 }).then(r => r.students),
});
```

---

## Dívida técnica removida

- Item 1 da lista de dívidas: `packages/core` e `packages/supabase` parcialmente resolvido — queries centralizadas em `shared/`
- Item 5: referências a tabelas antigas (`coachings`, `professional_services`) removidas de todos os arquivos migrados
