# Regras de Negócio - MeuPersonal

## 1. Visão Geral
O **MeuPersonal** é uma plataforma SaaS mobile que conecta Personal Trainers aos seus alunos, permitindo a gestão de treinos, dietas e acompanhamento de progresso.

## 2. Atores do Sistema e Permissões (CASL)

O sistema utiliza controle de acesso granular. Ver detalhes técnicos em `docs/access_control.md`.

### 2.1. Personal Trainer (`role: personal`)
- **Perfil**: Profissional de Educação Física.
- **Permissões**:
    - ✅ **Gerenciar**: Alunos, Treinos, Exercícios.
    - ✅ **Visualizar**: Dietas (leitura), Analytics, Perfil.
    - ✅ **Editar**: Seu próprio perfil.
    - ❌ **Restrição**: Não pode criar/editar dietas (apenas nutricionista).

### 2.2. Nutricionista (`role: nutritionist`)
- **Perfil**: Profissional de Nutrição.
- **Permissões**:
    - ✅ **Gerenciar**: Alunos, Dietas.
    - ✅ **Visualizar**: Treinos (leitura), Analytics, Perfil.
    - ✅ **Editar**: Seu próprio perfil.
    - ❌ **Restrição**: Não pode criar/editar treinos (apenas personal).

### 2.3. Aluno (`role: student`)
- **Perfil**: Usuário final (cliente).
- **Permissões**:
    - ✅ **Visualizar**: Treinos, Dietas, Exercícios, Perfil.
    - ✅ **Editar**: Seu próprio perfil (foto, peso, altura).
    - ❌ **Restrição**: Não pode criar/excluir nenhum recurso principal.

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
> **Nota**: Vários alunos podem compartilhar o mesmo treino; para isso, usamos uma tabela de relacionamento many‑to‑many `workout_assignments`.

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
