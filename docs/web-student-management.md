# Web — Student Management Feature Tracker

Documento de acompanhamento das features de gestão de alunos no web dashboard,
replicando o que existe no mobile. Atualizado a cada entrega.

---

## Status geral

| Feature | Status | Branch | PR |
|---|---|---|---|
| Deletar aluno | ✅ Done | fix/mobile-duplicate-students | - |
| Editar aluno (dados básicos) | 🔲 Pending | - | - |
| Detalhes do aluno (dados reais) | 🔲 Pending | - | - |
| Histórico do aluno (timeline) | 🔲 Pending | - | - |
| Avaliação física | 🔲 Pending | - | - |
| Anamnese — visualização | 🔲 Pending | - | - |
| Cancelar convite expirado | 🔲 Pending | - | - |
| Chat IA (prescrição) | 🔲 Pending | - | - |

---

## Prioridades

### P0 — Crítico (sem isso o personal não consegue trabalhar)
- [x] Deletar aluno
- [ ] Editar aluno (dados + medidas básicas)
- [ ] Página de detalhes com dados reais (tirar hardcoded)

### P1 — Importante (completa o fluxo de gestão)
- [ ] Histórico do aluno (timeline de atividades)
- [ ] Avaliação física (criar + visualizar)
- [ ] Anamnese — visualização de respostas

### P2 — Complementar
- [ ] Cancelar convite expirado
- [ ] Chat IA para prescrição
- [ ] Busca com debounce + ordenação
- [ ] Paginação / load more

---

## Detalhamento por feature

---

### ✅ Deletar aluno
**Objetivo**: Personal consegue remover um aluno da sua lista via web.

**Fluxo**:
1. Na lista (`/dashboard/students`), card do aluno tem menu de opções
2. Ao clicar em "Remover", abre modal de confirmação
3. Confirmação chama DELETE na API
4. Query de students é invalidada → lista atualiza

**API**: `DELETE /api/students/:id`
- Verifica que o caller é `professional`
- Verifica que o aluno pertence ao profissional (coaching ativo)
- Remove coachings do profissional com esse aluno
- Se aluno não tiver mais nenhum coaching → deleta auth user + profile

**Arquivos criados/modificados**:
- `web/src/app/api/students/[id]/route.ts` — DELETE handler
- `web/src/modules/students/hooks/useDeleteStudent.ts` — mutation hook
- `web/src/modules/students/components/StudentCard.tsx` — card com menu
- `web/src/modules/students/components/DeleteStudentModal.tsx` — confirmação
- `web/src/modules/students/pages/StudentsPage.tsx` — usa novo card

---

### 🔲 Editar aluno
**Objetivo**: Personal edita dados pessoais e medidas do aluno.

**Fluxo**:
1. Na página de detalhes (`/dashboard/students/[id]`), botão "Editar Perfil" ativo
2. Abre modal com 2 abas: Dados Pessoais | Medidas
3. Dados pré-preenchidos com valores atuais
4. Salvar chama PATCH na API
5. Query do aluno é invalidada → detalhes atualizam

**Campos — Aba "Dados"**:
- Nome, telefone, peso, altura, nível de experiência, observações

**Campos — Aba "Medidas"** (circunferências):
- Pescoço, ombro, peito, cintura, abdômen, quadril
- Braço D/E (relaxado e contraído), coxa proximal/distal, panturrilha

**API**: `PATCH /api/students/:id`

---

### 🔲 Detalhes com dados reais
**Objetivo**: Remover todos os hardcoded da `StudentDetailsPage`.

**O que está hardcoded atualmente**:
- Status (hardcoded "Ativo")
- Plano Atual (hardcoded "Hipertrofia")
- Próximo Treino (hardcoded)
- Última Presença (hardcoded)
- Botões "Editar Perfil" e "Nova Avaliação" inativos

**O que deve vir do banco**:
- Status real do aluno
- Último plano ativo
- Data da última sessão de treino
- Data da última avaliação

---

### 🔲 Histórico do aluno
**Objetivo**: Timeline de atividades do aluno (treinos, dietas, avaliações).

**Referência mobile**: `StudentHistoryScreen.tsx`

**Dados a exibir**:
- Treinos realizados (data, nome da ficha, status)
- Dietas criadas/atualizadas
- Avaliações físicas registradas
- Ordenado por data decrescente

---

### 🔲 Avaliação física
**Objetivo**: Criar e visualizar avaliações físicas do aluno.

**Referência mobile**: `StudentAssessmentScreen.tsx`

**Campos da avaliação**:
- Peso, altura, % gordura, massa muscular, IMC
- Circunferências: 13 campos
- Dobras cutâneas: 7 campos
- Data, observações

**Fluxo**:
1. Botão "Nova Avaliação" na página de detalhes → modal de criação
2. Lista de avaliações anteriores com evolução

---

### 🔲 Anamnese — visualização
**Objetivo**: Ver respostas do questionário de saúde do aluno.

**Referência mobile**: `StudentAnamnesisScreen.tsx`

**Exibe**:
- Respostas organizadas por seções
- Booleanos como "Sim/Não"
- Arrays como listas
- "Não respondido" para campos vazios

---

## Arquitetura de referência

```
web/src/
  app/
    api/
      students/
        route.ts          ← POST (criar)
        [id]/
          route.ts        ← GET, PATCH, DELETE
  modules/students/
    components/
      CreateStudentModal.tsx   ✅ exists
      StudentCard.tsx          🔲 new
      DeleteStudentModal.tsx   🔲 new
      EditStudentModal.tsx     🔲 new
      AssessmentModal.tsx      🔲 new
      AnamnesisView.tsx        🔲 new
    hooks/
      useCreateStudent.ts      ✅ exists
      useDeleteStudent.ts      🔲 new
      useUpdateStudent.ts      🔲 new
      useStudentDetails.ts     🔲 new
    pages/
      StudentsPage.tsx         ✅ exists (refactor)
      StudentDetailsPage.tsx   ✅ exists (refactor)
  shared/hooks/
    useStudents.ts             ✅ exists
```
