# 🥗 Nutrition Module: Implementation Roadmap

Este documento serve como a especificação para as próximas funcionalidades do módulo de nutrição na Web, buscando paridade e melhoria em relação à experiência Mobile.

## 1. Visão Geral
Atualmente, o Web foca na gestão do coach (Dashboard e Editor de Dietas). O Mobile foca na utilidade do aluno (Lista de Compras, Cooking Mode, NutriBot). O objetivo é trazer essa utilidade para o Web, tornando-o uma ferramenta completa de "Logística Nutricional".

---

## 2. Funcionalidades de Curto Prazo (Fase 1)
*Melhorias na produtividade do Coach e visualização rápida.*

### ⚡ Gerador de Refeições Padrão
*   **Mobile Ref:** Botão que gera instantaneamente as refeições base (Café, Almoço, Lanche, Jantar).
*   **Web Target:** Adicionar botão "Gerar Estrutura Padrão" no `MealEditor` para popular o dia com um clique.

### 📊 Bento Macros Dashboard
*   **Mobile Ref:** Tiles coloridas (Emerald, Blue, Orange) para macros.
*   **Web Target:** Header fixo no Editor de Dietas com o status de Kcal/P/C/G em tempo real conforme o coach adiciona itens.

---

## 3. Funcionalidades de Logística (Fase 2)
*Ferramentas para facilitar a rotina do aluno.*

### 🛒 Gerador de Lista de Compras
*   **Funcionalidade:** Extrair todos os ingredientes da dieta ativa e somar as quantidades por período (3, 7, 15 ou 30 dias).
*   **Categorização:** Agrupar automaticamente em: Hortifruti, Proteínas, Laticínios, Mercearia, Bebidas, Suplementos.
*   **Exportação:** Links para compartilhar via WhatsApp ou baixar PDF formatado com a lista.

### 🛒 Modo Mercado
*   **UX:** Visualização otimizada para "check-list" rápido, ideal para consulta no celular durante as compras.

---

## 4. Funcionalidades de Experiência (Fase 3)
*Transformando a dieta em ação.*

### 👨‍🍳 Modo Cozinha (Cooking Mode)
*   **UX:** Interface de foco para o preparo de refeições.
*   **Passo a Passo:** Divisão da refeição em instruções claras (ex: "Passo 1: Grelhe o frango...").
*   **IA Assist:** Uso do NutriAI para sugerir modos de preparo saudáveis para os ingredientes daquela refeição específica.

### 💬 NutriBot Web
*   **Integração:** Chat sidebar disponível no Dashboard.
*   **Contexto:** A IA deve saber qual aluno e qual plano está sendo visualizado para dar dicas personalizadas sobre substituições e receitas.

---

## 5. Checklist Técnico
- [ ] **Data Sync:** Compartilhar o `ShoppingListService` entre os projetos (ou replicar a lógica de agregação).
- [ ] **AI Integration:** Conectar o NutriBot Web ao mesmo endpoint de assistência da Mobile.
- [ ] **PDF Engine:** Atualizar o `exportDietPDF.ts` para opcionalmente incluir a Lista de Compras.
