# 📋 Arquivos para Atualizar - Database Restructuring

## Resumo de Referências Encontradas

### `from('students')` - 12 ocorrências
**Substituir por:** `from('profiles').eq('account_type', 'managed_student')`

1. `apps/web/src/shared/hooks/useStudents.ts` (3x - linhas 53, 124, 268)
2. `apps/mobile/src/modules/workout/store/workoutStore.ts` (2x - linhas 210, 361)
3. `apps/mobile/src/modules/nutrition/store/nutritionStore.ts` (2x - linhas 378, 598)
4. `apps/mobile/src/modules/nutrition/screens/CreateDietScreen.tsx` (1x - linha 67)
5. `apps/mobile/src/modules/students/store/studentStore.ts` (2x - linhas 229, 374)
6. `apps/mobile/src/modules/auth/store/authStore.ts` (2x - linhas 286, 312)

### `from('client_professional_relationships')` - 7 ocorrências
**Substituir por:** `from('coachings')`

1. `apps/web/src/shared/hooks/useStudents.ts` (3x - linhas 161, 296, 328)
2. `apps/web/src/modules/chat/store/chatStore.ts` (1x - linha 34)
3. `apps/mobile/src/modules/chat/store/chatStore.ts` (1x - linha 40)
4. `apps/mobile/src/modules/auth/store/authStore.ts` (2x - linhas 200, 327)

### `from('chat_messages')` - 6 ocorrências
**Substituir por:** `from('messages')`

1. `apps/web/src/modules/chat/store/chatStore.ts` (3x - linhas 126, 150, 178)
2. `apps/mobile/src/modules/chat/store/chatStore.ts` (3x - linhas 130, 154, 183)

---

## Ordem de Atualização

### Fase 1: Stores (Crítico)
1. ✅ `packages/supabase/src/types.ts` - CONCLUÍDO
2. [ ] `apps/mobile/src/modules/auth/store/authStore.ts`
3. [ ] `apps/mobile/src/modules/students/store/studentStore.ts`
4. [ ] `apps/mobile/src/modules/workout/store/workoutStore.ts`
5. [ ] `apps/mobile/src/modules/nutrition/store/nutritionStore.ts`
6. [ ] `apps/mobile/src/modules/chat/store/chatStore.ts`
7. [ ] `apps/web/src/modules/chat/store/chatStore.ts`

### Fase 2: Hooks
8. [ ] `apps/web/src/shared/hooks/useStudents.ts`

### Fase 3: Screens
9. [ ] `apps/mobile/src/modules/nutrition/screens/CreateDietScreen.tsx`

---

## Notas Importantes

- **students → profiles**: Precisa adicionar filtro `.eq('account_type', 'managed_student')` ou `.in('account_type', ['managed_student', 'autonomous_student'])`
- **Colunas renomeadas**: 
  - `relationship_status` → `status`
  - `service_category` → `service_type`
- **Interfaces renomeadas**:
  - `ClientProfessionalRelationship` → `Coaching`
  - `ChatMessage` → `Message`
  - `Student` → `User` (com filtro de account_type)
