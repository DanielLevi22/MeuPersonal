# PRD: mobile-ai-nutrition-scan

**Data de criação:** 2026-04-28
**Status:** approved
**Branch:** feature/mobile-ai-nutrition-scan
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Dois endpoints BFF (`/api/ai/student/scan-food` e `/api/ai/student/nutribot`) que substituem as chamadas diretas ao Gemini no mobile, migrando food scan e NutriBot para Claude via servidor.

### Por quê?
`FoodRecognitionService` e `NutriBotService` chamam a API Gemini diretamente do mobile, expondo `EXPO_PUBLIC_GEMINI_API_KEY` no bundle. Viola a regra arquitetural "nunca chamar IA do mobile" e impede controle de custo, rate limiting e enriquecimento de contexto no servidor.

### Como saberemos que está pronto?
- [ ] `POST /api/ai/student/scan-food` recebe imagem base64, retorna `FoodAnalysisResult` via Claude Sonnet 4.6 Vision
- [ ] `POST /api/ai/student/nutribot` recebe mensagem + histórico, carrega plano do aluno do banco, retorna resposta via Claude Haiku 4.5
- [ ] `FoodRecognitionService` no mobile chama o BFF — sem referência ao Gemini
- [ ] `NutriBotService` no mobile chama o BFF — sem referência ao Gemini
- [ ] `tsc --noEmit` e `biome check` limpos

---

## Escopo

### Incluído
- `POST /api/ai/student/scan-food`: auth por Bearer token, imagem base64 → Claude Sonnet 4.6 Vision → JSON com `name, calories, protein, carbs, fat, confidence`
- `POST /api/ai/student/nutribot`: auth por Bearer token, `message + history` → Haiku 4.5 com contexto do plano carregado do banco → `{ reply: string }`
- Atualizar `FoodRecognitionService.analyzeFoodImage()` para chamar o BFF
- Atualizar `NutriBotService.sendMessage()` para chamar o BFF (sem passar plano pelo mobile)

### Fora do escopo
- Streaming na resposta do NutriBot (REST simples é suficiente para chat de receitas)
- Histórico persistido no banco para o NutriBot (sessão em memória no mobile)
- Salvar automaticamente alimento escaneado na dieta (botão já existe na UI, mas a lógica de inserção é outra feature)
- Migrar outros usos do GeminiService (AssistantService, ShoppingListService, VoiceCommandService, aiBodyScan)

---

## Fluxo de dados

**Food Scan:**
```
Aluno tira foto (ScanFoodScreen)
  → FoodRecognitionService.analyzeFoodImage(uri)
  → POST /api/ai/student/scan-food { imageBase64, mimeType }
  → verifica Bearer token (Supabase auth)
  → Claude Sonnet 4.6 + Vision
  ← { name, calories, protein, carbs, fat, confidence }
```

**NutriBot:**
```
Aluno envia mensagem (UI do NutriBot)
  → NutriBotService.sendMessage(history, message, studentId)
  → POST /api/ai/student/nutribot { message, history, studentId }
  → verifica Bearer token
  → carrega diet_plans + diet_meals + diet_meal_items do banco
  → Claude Haiku 4.5 com contexto do plano
  ← { reply: string }
```

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `diet_plans` | SELECT | Contexto do plano para o NutriBot |
| `diet_meals` | SELECT | Refeições do plano |
| `diet_meal_items` | SELECT + join foods | Alimentos de cada refeição |

## Impacto em outros módulos

- `app/modules/nutrition/services/FoodRecognitionService` — assinatura mantida, internals substituídos
- `app/modules/nutrition/services/NutriBotService` — assinatura simplificada: não recebe mais `currentPlan/meals/mealItems`, recebe `studentId`
- `GeminiService` — não alterado; outros consumidores (AssistantService, etc.) não são tocados

---

## Decisões técnicas

**Sonnet 4.6 para food scan:** Vision nativa, mesmo modelo já em uso no Checkin Analyzer. Elimina dependência do Gemini para este caso.

**Haiku 4.5 para NutriBot:** Chat de receitas e substituições é tarefa estruturada simples — Haiku é suficiente e ~10x mais barato que Sonnet.

**BFF carrega plano do banco:** Remove a necessidade de passar o plano inteiro pelo payload mobile. Mais seguro, contexto sempre fresco.

**Sem streaming no NutriBot:** O NutriBotService atual já simula streaming palavra a palavra no cliente. Manter REST simples no BFF evita complexidade desnecessária.

---

## Checklist de done

- [ ] Código funciona e passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/mobile-ai-nutrition-scan.md` criado
- [ ] `docs/STATUS.md` atualizado
