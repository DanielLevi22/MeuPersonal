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

### 3.1. Cadastro
- **Login Único**: O sistema deve permitir login via E-mail/Senha ou Social (Google/Apple).
- **Seleção de Perfil**: No primeiro acesso, o usuário DEVE escolher se é "Personal" ou "Aluno".
    - *Regra*: Essa escolha é imutável para o mesmo email (ou requer contato com suporte).
- **Vínculo de Aluno**:
    - Um aluno só entra no sistema se convidado por um Personal? 
    - *Decisão*: O aluno pode se cadastrar, mas ficará com uma tela "Sem Personal" até aceitar um convite ou inserir um código de personal.
    - *Fluxo Principal*: Personal envia link -> Aluno clica -> Baixa App -> Cria conta -> Já aparece vinculado.

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
