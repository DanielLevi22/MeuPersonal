# Regras de Negócio - MeuPersonal

## 1. Visão Geral
O **MeuPersonal** é uma plataforma SaaS mobile que conecta Personal Trainers aos seus alunos, permitindo a gestão de treinos, dietas e acompanhamento de progresso.

## 2. Atores do Sistema

### 2.1. Personal Trainer (Admin do seu ecossistema)
- **Perfil**: Usuário pagante (assinante).
- **Permissões**:
    - Criar e editar perfil profissional.
    - Convidar alunos (ilimitado).
    - Criar, editar e excluir treinos.
    - Criar, editar e excluir dietas.
    - Visualizar progresso e check-ins dos alunos.
    - Gerenciar sua assinatura (upgrade/downgrade/cancelamento).

### 2.2. Aluno
- **Perfil**: Usuário gratuito (convidado).
- **Permissões**:
    - Visualizar treinos e dietas atribuídos.
    - Realizar check-in de treinos (marcar como concluído).
    - Registrar feedback/observações no treino.
    - Visualizar histórico de treinos realizados.
    - Editar perfil básico (foto, peso, altura).
- **Restrições**:
    - Não pode criar treinos para si mesmo.
    - Não pode ver alunos de outros personais.

## 3. Regras de Cadastro e Autenticação

### 3.1. Cadastro e Autenticação
- **Personal Trainer**:
    - Login via E-mail/Senha ou Social.
    - Deve realizar cadastro completo.
- **Aluno**:
    - **Pré-Cadastro pelo Personal**: O Personal cadastra o aluno previamente (Nome, Peso, Altura, Dobras, etc.) e gera um **Código de Convite** único para aquele aluno.
    - **Acesso Simplificado**: O aluno baixa o app e entra com o Código de Convite.
    - **Herança de Dados**: Ao entrar, o aluno já visualiza seus dados (anamnese/medidas) cadastrados pelo Personal.
    - *Fluxo*: Personal cadastra Aluno + Dados -> Gera Código -> Envia para Aluno -> Aluno entra com Código -> Perfil é criado com os dados pré-existentes.

### 3.2. Avaliação Física e Anamnese
- **Medidas Antropométricas** (Obrigatório para evolução):
    - Peso (kg), Altura (cm).
    - Circunferências: Pescoço, Ombro, Peito, Braço (dir/esq, relaxado/contraído), Antebraço, Cintura, Abdômen, Quadril, Coxa (proximal/distal), Panturrilha.
- **Dobras Cutâneas**:
    - Protocolo de 7 dobras (Jackson & Pollock) ou 3 dobras.
- **Composição Corporal** (Calculado):
    - % Gordura, Massa Magra (kg), Massa Gorda (kg).
    - IMC, TMB (Basal), Gasto Energético Total (TDEE).
- **Periodicidade**: Primeira avaliação no cadastro, depois a cada 4-6 semanas.

## 4. Regras de Assinatura (Monetização)

### 4.1. Modelo para Personal
- **Trial**: 14 a 30 dias gratuitos para teste total.
- **Planos**:
    - Mensal: R$ 89,90 - R$ 129,90.
    - Acesso ilimitado a alunos.
- **Bloqueio**: Se a assinatura expirar, o Personal perde acesso à *edição* e *envio* de novos treinos, mas os dados não são apagados imediatamente (carência de 30 dias).
- **Alunos de Personal Inadimplente**: Continuam vendo os treinos já prescritos, mas não recebem novos.

## 5. Regras de Treinos

### 5.1. Estrutura do Treino
- Um treino é composto por: Título (ex: "Treino A - Peito"), Descrição, e Lista de Exercícios.
- Cada Exercício possui:
    - Nome (buscado de um banco de dados ou criado na hora).
    - Séries (ex: 3 ou 4).
    - Repetições (ex: 10-12).
    - Carga (kg).
    - Intervalo de descanso (segundos).
    - Link de vídeo (YouTube/Vimeo) opcional.
    - Observações (ex: "Falha concêntrica").

### 5.2. Prescrição
- O treino pode ser recorrente (ex: Toda Segunda-feira) ou pontual.
- O Personal pode duplicar treinos de um aluno para outro.

### 5.3. Execução (Lado do Aluno)
- O aluno deve marcar cada exercício como feito ou o treino inteiro como concluído.
- O sistema registra a data/hora da conclusão.

## 6. Regras de Dieta

### 6.1. Estrutura
- Dieta é dividida por Refeições (Café, Almoço, Lanche, Jantar).
- Cada refeição contém Alimentos e Quantidades.
- Opção de "Alimentos Substitutos" (ex: Frango pode trocar por Peixe).

## 7. Notificações

- **Lembrete de Treino**: Push notification enviada em horário configurável pelo aluno (default 08:00).
- **Cobrança**: Alertas para o Personal sobre vencimento da assinatura.
- **Feedback**: Notificação para o Personal quando o aluno conclui um treino.

## 8. Privacidade e Dados
- Os dados dos alunos de um Personal são visíveis APENAS para aquele Personal.
- O Personal não vê dados de alunos de outros Personais.
