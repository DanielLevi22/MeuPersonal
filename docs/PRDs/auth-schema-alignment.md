# PRD: auth-schema-alignment

**Data de criação:** 2026-04-17
**Status:** approved
**Branch:** feature/auth-schema-alignment
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Atualizar todo o código do módulo Auth (tipos, services, stores, abilities) para refletir o novo schema aprovado em `feature/schema-architecture`. Isso inclui renomear account types, remover campos inexistentes no banco e corrigir nomes de tabelas/colunas.

### Por quê?
O código atual usa `professional`, `managed_student`, `autonomous_student`, `pending/rejected/suspended`, `professional_services`, `is_super_admin` — todos renomeados ou removidos no novo schema. Sem essa correção, qualquer query ao banco falha em runtime.

### Como saberemos que está pronto?
- [x] `AccountType` usa `specialist | student | member` (não mais `professional | managed_student | autonomous_student`)
- [x] `AccountStatus` usa `active | inactive | invited` (não mais `pending | rejected | suspended`)
- [x] `Profile` sem `is_super_admin`, `birth_date`, `gender`
- [x] `specialist_services` substituiu `professional_services` em todos os arquivos
- [x] `service_type` substituiu `service_category` em todos os arquivos
- [x] `getUserContextJWT` funciona com o novo schema
- [x] `defineAbilitiesFor` cobre `specialist`, `student`, `member`
- [x] `tsc --noEmit` limpo em `app/` e `web/`
- [x] `biome check` limpo

---

## Escopo

### Incluído
- `shared/src/types/auth.types.ts`
- `shared/src/services/auth.service.ts`
- `app/src/packages/supabase/types.ts`
- `app/src/packages/supabase/abilities.ts`
- `app/src/packages/supabase/getUserContextJWT.ts`
- `app/src/modules/auth/store/authStore.ts`
- `web/src/packages/supabase/types.ts`
- `web/src/packages/supabase/abilities.ts`
- `web/src/packages/supabase/getUserContextJWT.ts`
- `web/src/modules/auth/store/authStore.ts`

### Fora do escopo
- Outros módulos que referenciam `professional` (workouts, nutrition, students) — cada um tem seu próprio PR
- RLS e triggers do banco — já aplicados via migration
- Telas de UI de auth (login, cadastro) — não mudam nesta entrega
- Fluxo do `member` — roadmap futuro, só tipos por agora

---

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `profiles` | SELECT | Sem `is_super_admin`, `subscription_tier` |
| `specialist_services` | SELECT | Antes `professional_services` — `service_type` (não `service_category`) |

---

## Checklist de done

- [ ] Código funciona e passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/STATUS.md` atualizado
