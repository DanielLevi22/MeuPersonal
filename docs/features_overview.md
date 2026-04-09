# Levantamento de Funcionalidades (Features) - MeuPersonal App

Com base na análise da arquitetura, módulos, telas e serviços do aplicativo, aqui está o levantamento completo das funcionalidades presentes:

## 1. Gestão de Usuários e Perfis
* **Autenticação (Auth):** Login e registro de usuários.
* **Onboarding:** Fluxo de boas-vindas e configuração inicial.
* **Tipos de Conta:** Suporte para contas de **Profissionais (Personal Trainers)** e **Alunos**.
* **Vínculo Aluno-Personal:** Tela específica para o aluno se juntar a um personal trainer (`join-personal`).
* **Perfil de Usuário:** Gerenciamento das informações da conta (`profile`).

## 2. Gestão de Treinos (Workout)
* **Biblioteca e Detalhes de Exercícios:** Dicionário de exercícios com instruções ou informações detalhadas (`exercise-detail`).
* **Visualização de Treinos:** Consulta dos treinos montados para o aluno (`workout-detail`).
* **Execução de Treino:** Funcionalidade guiada passo a passo para execução do treino diário (`execute-workout` e timer de descanso).
* **Cardio:** Módulo ou tela específica para prescrição e/ou acompanhamento de exercícios cardiovasculares (`cardio`).
* **Atribuição e Configuração (Personal):** Ferramentas para o profissional montar o treino, configurar e atribuir ao aluno.

## 3. Gestão Nutricional (Nutrition)
* **Plano Alimentar:** Visualização da dieta e refeições diárias (`MealCard`, `DailyNutrition`).
* **Busca e Substituição de Alimentos:** Permite buscar alimentos (`FoodSearchModal`) e sugerir/realizar substituições de pratos dentro do limite de macronutrientes do aluno (`EditFoodModal`).
* **Acompanhamento de Macros:** Controle do progresso diário de ingestão (Proteínas, Carboidratos e Gorduras) visível através de barras de progresso (`MacroProgressBar`).

## 4. Avaliações e Progresso
* **Anamnese:** Formulário/tela para coletar o histórico de saúde e objetivos do aluno (`anamnesis`).
* **Avaliações Físicas:** Módulo de 'Assessment' para registrar medidas, percentual de gordura e avaliações regulares.
* **Acompanhamento de Resultados:** Tela de progresso (`progress.tsx`) para o aluno visualizar a evolução corporal e a aderência ao longo do tempo.

## 5. Gamificação e Engajamento
* **Ranking (Leaderboard):** Competição amigável e exibição da posição do aluno em um ranking (`ranking.tsx`).
* **Conquistas (Achievements):** Sistema de medalhas e troféus atrelados às ações do usuário (`achievementService`).
* **Ofensivas (Streaks):** Contabilização de dias seguidos de treinos e dieta mantida, estimulando a consistência (`streakService`).
* **Notificações de Engajamento:** Serviço dedicado a comunicar novas conquistas e metas diárias atingidas (`gamificationNotificationService`).

## 6. Inteligência Artificial (AI)
* **Assistente Virtual:** Serviços de AI embutidos (`AssistantService`) para otimizar fluxos.
* **Análise de Aderência:** Algoritmos (ou prompts de IA) para checar o seguimento da dieta e dos treinos.
* **Geração Automática (Opcional):** Suporte de IA para criar e/ou adaptar treinos baseando-se no perfil do usuário.

## 7. Comunicação Integrada
* **Chat:** Troca de mensagens direta (`chat` módulo/tela) facilitando a comunicação para tirar dúvidas e realizar alinhamentos entre Aluno e Personal Trainer ou assistente virtual.

## 8. Infraestrutura e Serviços Secundários
* **Notificações Push / Locais:** Para lembretes de treinos, refeições e gamificação (`notificationService`, `backgroundTask`).
* **Armazenamento em Nuvem:** Integração mapeada com o Supabase para salvar mídias ou documentos (`SupabaseStorageService`).
