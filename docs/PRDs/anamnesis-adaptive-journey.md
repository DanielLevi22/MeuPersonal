# PRD: anamnesis-adaptive-journey

**Data de criação:** 2026-05-08
**Status:** approved
**Branch:** feature/anamnesis-adaptive-journey
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Jornada de anamnese adaptativa para alunos autônomos (member) na web: seleção de persona (beginner/returning/intermediate/advanced) → perguntas one-by-one com medidor de precisão → unlock cards celebratórios → redirecionamento para o AI coach.

### Por quê?
O fluxo multi-seção genérico não engaja o membro autônomo. Um formulário gigante mata a conversão. A jornada adaptativa por nível reduz a fricção, aumenta a taxa de conclusão e entrega contexto rico ao AI coach para gerar um plano realmente personalizado desde a primeira sessão.

### Como saberemos que está pronto?
- [x] Membro consegue selecionar persona e responder perguntas uma a uma sem recarregar página
- [x] Precisão do plano aumenta visivelmente conforme respostas (barra animada + delta "+X%")
- [x] Unlock cards aparecem nos pontos corretos (após height, gym_type, injuries, commitment)
- [x] Respostas são salvas em `student_anamnesis.responses` no Supabase a cada avanço
- [x] Ao concluir, usuário é direcionado para `/dashboard/student/coach`
- [x] Página não exibe erros de TypeScript nem violações de Biome

---

## Contexto

O AI coach (`StudentCoachOrchestrator`) já estava implementado com express mode que depende de anamnese ≥80% completa. Faltava o fluxo de coleta de dados que alimenta esse coach. O formulário genérico (`StudentAnamnesisFormPage`) existe para o fluxo do especialista, mas o membro autônomo precisa de experiência gamificada e progressiva.

## Escopo

### Incluído
- `anamnesisAdaptive.ts` — 4 tracks de perguntas com pesos e whyWeAsk
- `StudentAnamnesisJourneyPage` — UI completa com persona, questões, unlock cards, completion
- `useSavePersonaTrack` — persiste track em `profiles.persona_track`
- `useAnamnesisForm` — upsert incremental em `student_anamnesis`
- Rota `/dashboard/student/anamnesis` usa a nova jornada

### Fora do escopo (explicitamente)
- Edição de anamnese pelo especialista (fluxo separado)
- Migração para criar coluna `persona_track` (erro silenciado para compatibilidade)
- Versão mobile da jornada adaptativa
- Analytics de taxa de conclusão por persona

---

## Fluxo de dados

```
[Membro acessa /dashboard/student/anamnesis]
  → [StudentAnamnesisJourneyPage]
  → [PersonaScreen] → handleSelectTrack
  → [useSavePersonaTrack] → profiles.persona_track (silenciado se coluna não existe)
  → [QuestionField one-by-one] → handleNext
  → [useAnamnesisForm.mutateAsync] → student_anamnesis (upsert por student_id)
  → [UnlockScreen] se afterQuestionId match
  → [CompletionScreen] quando isLastStep
  → router.push("/dashboard/student/coach")
```

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `student_anamnesis` | UPSERT | `onConflict: "student_id"`, salva `responses` (JSONB) + `completed_at` |
| `profiles` | UPDATE | `persona_track` — coluna pode não existir; erro ignorado |

## Impacto em outros módulos

- `students/data/anamnesisAdaptive.ts` — novo arquivo de dados compartilhado
- `student-dashboard/index.ts` — exporta `StudentAnamnesisJourneyPage`
- AI Coach (`StudentCoachOrchestrator`) — consome `student_anamnesis.responses` via `studentCoachContextLoader`

---

## Decisões técnicas

- **Perguntas acumuladas por track**: beginner=16, returning=21, intermediate=26, advanced=32. Cada track superior inclui o anterior para não repetir perguntas.
- **Precisão = 30 + (answeredWeight/totalWeight)*64**: 30% é o baseline de plano genérico; 94% é o máximo teórico com todas as perguntas respondidas.
- **Unlock cards por `afterQuestionId`**: evita lógica de índice frágil; IDs de pergunta são estáveis.
- **`completed_at` só no último passo**: saves intermediários não marcam conclusão para preservar estado de "em andamento".

---

## Checklist de done

> Só muda o Status para `done` quando TODOS estão marcados.

- [x] Código funciona e passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/anamnesis-adaptive-journey.md` criado ou atualizado
- [ ] `docs/STATUS.md` atualizado
