# AI Feature Roadmap & Ideation

Documentação das novas funcionalidades de IA e Utilidade planejadas para o "MeuPersonal".
**Status**: Em Planejamento/Implementação
**Data**: 2025-12-06

---

## 1. 🛒 Lista de Compras Inteligente (Smart Shopping List)
**Objetivo**: Transformar o plano alimentar semanal em uma lista de compras prática e organizada por setores de mercado.

### Funcionalidades:
- **Agregação**: Somar quantidades de todos os alimentos da semana (ex: 7 dias x 150g Frango = 1.05kg).
- **Categorização AI**: Usar o Gemini para categorizar os itens (Açougue, Hortifruti, Mercearia, Padaria, etc.).
- **Checklist**: Interface interativa onde o usuário pode marcar o que já comprou.
- **Compartilhamento**: Botão para exportar a lista em texto (WhatsApp, Notas).

### Implementação Técnica:
- **Input**: Dados do `nutritionStore` (DietPlans, Meals, MealItems).
- **Processamento**: Script de agregação local -> Envio para Gemini com prompt de categorização.
- **Output**: JSON estruturado para renderizar a UI.

---

## 2. 💬 NutriBot (Assistente Nutricional AI)
**Objetivo**: Um chat interativo onde o aluno pode tirar dúvidas sobre sua dieta e substituições em tempo real.

### Funcionalidades:
- **Contexto da Dieta**: O bot "sabe" qual é a dieta atual do usuário.
- **Tira-Dúvidas**: "Posso comer pizza hoje?"; "O que substitui arroz?"; "Quantas calorias tem uma banana?".
- **Persona**: Amigável, motivador e focado em saúde.

### Implementação Técnica:
- **Engine**: Google Gemini (Flash 1.5).
- **Context Window**: Inserir o JSON do plano alimentar atual no System Prompt.
- **Interface**: Tela de Chat similar ao WhatsApp/Telegram.

---

## 3. 🎧 Coach de Treino por Voz (Audio Workout Guide)
**Objetivo**: Guiar o aluno durante a execução do treino sem que ele precise olhar para a tela, aumentando o foco.

### Funcionalidades:
- **Comandos de Voz**:
  - "Início da série: Supino Reto, 10 repetições. Valendo!"
  - "Fim da série. Descanse 60 segundos."
  - "Faltam 10 segundos..."
  - "Prepare-se para o próximo: Agachamento."
- **Controles**: Opção de Mute/Unmute na tela de execução.

### Implementação Técnica:
- **Lib**: `expo-speech` (Text-to-Speech nativo).
- **Hooks**: `useVoiceCoach` integrado ao `ExecuteWorkoutScreen`.
- **Triggers**: Disparados pelos eventos de Timer e Mudança de Estado (Active -> Rest -> Active).

---
