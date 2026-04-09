# Visão Estratégica: AI Pilot (Assistente Ativo)

**Local:** `docs/ai_pilot_vision.md`
**Conceito:** A I.A. não é um "piteiro" que dá sugestões aleatórias. Ela é uma **ferramenta de produtividade** integrada ao fluxo de trabalho do profissional. Ela age *durante* a criação, não depois.

---

## 🧭 Filosofia: "O Co-piloto de Criação"

Imagine que o Personal está pilotando um avião (o planejamento do aluno). A I.A. é o co-piloto que verifica os instrumentos e sugere rotas, mas o Personal está com a mão no manche.

A I.A. entra em ação **QUANDO** o profissional vai executar uma tarefa complexa (criar treino, montar dieta), acelerando o processo em 80%.

---

## 🛠️ Aplicação Prática nos Fluxos

## 📱 Funcionalidades Existentes (Baseline 2026)

Antes de falarmos sobre o "futuro", é importante mapear o que o Personal já tem em mãos hoje no app. A I.A. vai atuar diretamente sobre essas bases.

### 🏋️ Módulo de Treino (Workout)
*   **Periodização & Fases:** Criação de macrociclos (Força, Hipertrofia) e mesociclos (Fases de treinamento) com datas e status.
*   **Gestão de Treinos:**
    *   Criação de treinos (A, B, C...) vinculados a fases.
    *   Banco de exercícios e criação de exercícios personalizados.
    *   Gerador de estrutura de treinos (Split Generator).
*   **Execução (App do Aluno):**
    *   Registro de cargas e repetições.
    *   Timer de descanso.
    *   Histórico de sessões e análise de progressão (cargas anteriores).
    *   Registro de Cardio (Livre ou prescrito).

### 🥗 Módulo de Nutrição (Nutrition)
*   **Planejamento Dietético:**
    *   Criação de Planos Alimentares (Cíclicos ou Lineares).
    *   Estratégias nutricionais pré-definidas.
    *   Gestão de Refeições com horário e meta calórica.
*   **Banco de Alimentos:**
    *   Busca avançada de alimentos.
    *   Cadastro de alimentos customizados.
*   **Acompanhamento (App do Aluno):**
    *   Check-in de refeições (Realizado vs Planejado).
    *   Upload de fotos das refeições.
    *   Lista de Compras automática.

### 👁️ Módulo de Visão (Vision)
*   **Body Scan:** Captura guiada de fotos (Frente, Costas, Lados).
*   **Análise Postural:** (Em desenvolvimento) Detecção de pontos chave e desvios.

---

## 🗺️ Oportunidades de Integração (O Mapa do Co-Piloto)

Baseado no que já construímos, aqui estão os pontos exatos onde o "Co-Piloto" assume os controles auxiliares:

### 1. Na Criação de Estratégia (Macro)
*   **Onde hoje:** O Personal cria uma Periodização e define Fases manualmente.
*   **Integração I.A.:** *The Strategy Wizard*.
    *   **Input:** "Aluno Iniciante, foco em Perda de Peso, 3 dias/semana".
    *   **Ação:** A I.A. sugere a estrutura completa da Periodização: "Fase 1: Adaptação (4 sem) -> Fase 2: Força Resistência (4 sem)".
    *   **Hook Técnico:** Interceptar o `createPeriodization` ou criar um "Assistant" que preenche o form.

### 2. No Desenho do Treino (Micro)
*   **Onde hoje:** O Personal usa o `Split Generator` para criar "Treino A/B" vazios e depois preenche exercício por exercício.
*   **Integração I.A.:** *Smart Workout filler*.
    *   **Input:** "Treino A (Peitoral/Tríceps), Fase de Hipertrofia".
    *   **Ação:** A I.A. não só cria o Treino A, mas já insere 4-5 exercícios "clássicos" com séries e repetições adequadas para a fase.
    *   **Diferencial:** Se o aluno tem "Dor no Ombro" (detectado na Avaliação), a I.A. evita "Desenvolvimento com Barra" e sugere "Elevação Lateral".
    *   **Hook Técnico:** Evoluir o `generateWorkoutsForPhase` no `workoutStore` para chamar a I.A. antes de inserir no banco.

### 3. No Planejamento Nutricional
*   **Onde hoje:** O Personal cria um Plano, calcula TDEE e distribui macros manualmente.
*   **Integração I.A.:** *Auto-Macros & Meal Suggestions*.
    *   **Input:** Peso, Altura, Idade, Objetivo do Aluno.
    *   **Ação:**
        1.  Calcula TDEE e sugere divisão de macros (ex: High Carb para Hipertrofia).
        2.  Ao criar uma refeição "Café da Manhã (500kcal)", oferece um botão "Gerar Sugestões". A I.A. busca 3 opções no nosso banco de alimentos que batem essas calorias.
    *   **Hook Técnico:** Integrar no `createDietPlan` para pré-preencher dados e no `addMeal` para sugerir itens.

### 4. No Monitoramento (Course Correction)
*   **Onde hoje:** O Personal olha logs isolados de treino e dieta.
*   **Integração I.A.:** *Weekly Insight*.
    *   **Analise:** "Aluno completou 100% dos treinos mas errou a dieta em 4 dias (calorias baixas)".
    *   **Sugestão:** "Talvez a dieta esteja muito restritiva. Sugiro aumentar 200kcal ou adicionar uma 'Refeição Livre'."
    *   **Feature:** Um card de "Resumo da Semana" no Dashboard do Personal.

---

## 🚀 Novos Fluxos com AI Pilot (Roadmap)


### 1. 🏋️‍♀️ Criação de Treino (Workout Editor)

**Cenário:** O Personal abre a tela de "Novo Treino" para o aluno João.
**Integração AI Pilot:**
*   **Botão "Gerar Base Inteligente":**
    *   Ao clicar, a I.A. lê a **Avaliação Física** (ex: escoliose detectada) e o **Objetivo** (hipertrofia).
    *   Ela *preenche* a tela com uma estrutura recomendada (ex: Série de paravertebrais para a escoliose + treino de força).
    *   *O Personal apenas ajusta/troca o que não gostar.*
*   **Autocomplete de Cargas:**
    *   Ao adicionar "Supino", a I.A. sugere: *"João fez 60kg no último, sugiro 62kg"* (pré-preenche o campo).

### 2. 🥗 Criação de Dieta (Nutrition Planner)

**Cenário:** O Nutri/Personal vai montar o plano alimentar.
**Integração AI Pilot:**
*   **Calculadora Contextual:**
    *   A I.A. já traz o TDEE calculado e sugere a divisão de macros (Carbo/Prot/Gord) ideal para o objetivo.
*   **Assistente de Cardápio:**
    *   O Personal define "Almoço: 600kcal".
    *   A I.A. oferece opções de combos que batem essa meta: *"Opção A: Frango + Batata Doce"*, *"Opção B: Patinho + Arroz"*.
    *   O profissional clica e adiciona, sem precisar calcular grama por grama manualmente.

### 3. 📷 Avaliação Física (Vision Assistant)

**Cenário:** O Personal recebe as fotos do aluno.
**Integração AI Pilot:**
*   **Pré-Análise:**
    *   A I.A. desenha as linhas de desvio **antes** do Personal abrir.
    *   Quando o Personal abre, ele já vê: *"Ombro D baixo (3º grau)"*.
    *   Ele só valida: *"Correto"* ou *"Não, isso é a postura da foto"*.

### 4. 💬 Chat & Suporte (Smart Reply)

**Cenário:** Aluno manda dúvida sobre execução.
**Integração AI Pilot:**
*   **Rascunho Rápido:**
    *   A I.A. lê a pergunta *"Sinto dor no ombro no supino"*.
    *   Sugere uma resposta técnica baseada em biomecânica: *"Pode ser falta de retração escapular. Tente filmar sua execução..."*
    *   O Personal edita (para dar o tom pessoal) e envia.

---

## 🔄 Diferença da Versão Anterior

| Versão "Sugestões Aleatórias" (Passivo) | Versão "Assistente de Fluxo" (Ativo) ✅ |
| :--- | :--- |
| Envia notificações: "Crie um treino para João." | **Durante** a criação do treino: "Aqui está um rascunho baseado na escoliose do João." |
| Sugere dietas do nada. | Ajuda a **calcular** e **montar** a dieta enquanto o profissional está na tela. |
| Fica "enchendo o saco" com avisos. | Fica em silêncio até ser chamada para **acelerar o trabalho**. |

---

## 🚀 Próximos Passos Técnicos

1.  **Refinar Avaliação (Body Scan):** Finalizar a aprovação da análise da I.A. (já em andamento).
2.  **Smart Workout Builder:** Criar a UI de criação de treino onde a I.A. pode injetar dados.
3.  **Supabase Edge Functions:** Preparar os endpoints que vão processar essas "solicitações de ajuda".
