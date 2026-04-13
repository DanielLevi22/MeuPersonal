# Análise Completa: Módulo de Autenticação (Auth)

Este documento detalha o estado atual, a arquitetura técnica e as jornadas de usuário do **Módulo de Auth**, abrangendo tanto a plataforma Web (Profissional) quanto Mobile (Aluno/Pro).

---

## 🛠️ Visão Técnica

O sistema de autenticação é híbrido, utilizando o **Supabase Auth** como provedor de identidade e o **Zustand** para gerenciamento de estado cliente em ambas as plataformas.

## ⚠️ Análise: Legado vs. Ativo (O que manter e o que remover)

O sistema de Auth passou por simplificações recentes. É crucial diferenciar os fluxos ativos das ideias descartadas para evitar manutenção desnecessária.

### 1. Fluxo de Registro (Ativo)
O registro foi simplificado para eliminar atritos.
- **Campos Ativos**: Nome Completo, Email, Senha e Seleção de Papel (Role).
- **Processo**: Registro -> Estado `pending` no banco -> Redirecionamento para `pending-approval`.
- **Aprovação**: Estritamente manual via banco de dados (mudança de `account_status`).

### 2. Código Morto & Ideias Descartadas (Remover)
- **Anexo de Certificados**: Qualquer lógica de upload de documentos no registro ou perfil é considerada **código morto**. A ideia de "André preenche dados e anexa certificados" foi removida por ser problemática.
- **Formulários Extensos**: Campos como `cref`, `crn` e `bio` no momento do cadastro são resquícios de designs anteriores e não possuem impacto no acesso hoje.
- **Fluxos de 'Invite Code' para Profissionais**: O acesso hoje depende da aprovação do admin, não de códigos de convite legados.

### 🔍 Auditoria Real do Banco (Snapshot: 13/04/2026)

Abaixo estão os dados reais extraídos do banco de dados (94 registros totais). Note que muitos campos marcados como "Legado" ainda contêm dados em 100% dos registros, o que reforça a necessidade de uma migração de limpeza.

| column_name | data_type | count_preenchido | total_registros | Veredito Técnico |
| :--- | :--- | :--- | :--- | :--- |
| **id** | uuid | 94 | 94 | **MANTER** (PK) |
| **email** | text | 94 | 94 | **MANTER** (Identidade) |
| **full_name** | text | 94 | 94 | **MANTER** (Nome principal) |
| **avatar_url** | text | 94 | 94 | **MANTER** |
| **created_at** | timestamp | 94 | 94 | **MANTER** |
| **account_type** | USER-DEFINED | 94 | 94 | **MANTER** (RBAC) |
| **account_status** | USER-DEFINED | 94 | 94 | **MANTER** (Aprovação) |
| **role** | text | 94 | 94 | **MANTER** (Compatibilidade) |
| **invite_code** | text | 94 | 94 | **REMOVER** (Legado) |
| **phone** | text | 94 | 94 | **REMOVER** (Não usado) |
| **weight** / **height** | numeric | 94 | 94 | **MOVER** (Para tabela de Avaliação) |
| **professional_name** | text | 94 | 94 | **REMOVER** (Duplicado) |
| **professional_bio** | text | 94 | 94 | **REMOVER** |
| **cref** / **crn** | text | 94 | 94 | **REMOVER** (Processo mudou) |
| **is_verified** | boolean | 94 | 94 | **REMOVER** (Status resolve) |
| **verified_at** | timestamp | 94 | 94 | **REMOVER** |
| **is_super_admin** | boolean | 94 | 94 | **MANTER** |
| **admin_notes** | text | 94 | 94 | **REMOVER** |
| **last_login_at** | timestamp | 94 | 94 | **REMOVER** |
| **xp** / **level** | integer | 94 | 94 | **MOVER** (Gamificação) |
| **birth_date** | date | 94 | 94 | **MANTER** (Alunos) |
| **gender** | text | 94 | 94 | **MANTER** (Alunos) |

---

## 🛠️ Visão Técnica (Mecanismos Ativos)

### 1. Arquitetura de Dados & Papéis
- **Hierarquia de `AccountType`**:
  - `admin`: Controle total (`manage all`), acesso ao **AdminPanel**, **FeatureFlags** e **AuditLogs**.
  - `professional`: Papel base para especialistas. Suas permissões são filtradas por `ServiceType`.
  - `managed_student`: Aluno vinculado a um profissional, com acesso apenas de leitura aos planos.
  - `autonomous_student`: Aluno independente com modelo freemium/premium baseado em `FeatureAccess`.
- **Especializações (`ServiceType`)**:
  - `personal_training`: Habilita gestão de `Workout` e `Periodization`. Permite **apenas leitura** de `Diet`.
  - `nutrition_consulting`: Habilita gestão de `Diet` e `Food`. Permite **apenas leitura** de `Workout`.

### 2. Mecanismos de Autorização
- **JWT Context**: O sistema utiliza a Edge Function `getUserContextJWT` para extrair permissões granulares diretamente do token.
- **Abilities dinâmicas (CASL)**: Permissões recalculadas em tempo real sempre que o contexto muda.
- **Admin `is_super_admin`**: Proteção de nível de banco (RLS) para administradores master.

### 3. Fluxos Mobile (Cross-Role)
- **Masquerade Mode (Modo Espelhamento)**: Permite ao Profissional (ou Admin) entrar na conta de um Aluno para suporte.
- **Login por Código (Student Magic Link)**: Login simplificado para alunos via código alfanumérico (`aluno{code}@test.com`).

---

## 📖 Histórias de Usuário (Auth Edition)

### 📽️ "O Profissional em Validação" (Web)
> *Personagem: André, novo Personal Trainer que acabou de se cadastrar.*

1.  **Registro**: André preenche seus dados e anexa seus certificados.
2.  **O Bloqueio**: Ao tentar acessar o dashboard logo após o registro, ele é saudado por uma tela de **"Aguardando Aprovação"**. O sistema verificou via `authStore` que seu `account_status` ainda é `pending`.
3.  **A Liberação**: O administrador aprova a conta de André. Na próxima tentativa de login, o `updateSession` detecta o status `active`, carrega suas `abilities` e ele acessa as ferramentas de montagem de treino.

### 📱 "O Mistério do Treino Desaparecido" (Mobile/Masquerade)
> *Personagem: Amanda (Personal) e Carlos (Aluno).*

1.  **O Problema**: Carlos envia uma mensagem: "Amanda, meu treino de hoje não apareceu!".
2.  **A Investigação**: Amanda não precisa pedir a senha de Carlos. No seu app, ela vai na lista de alunos, clica no Carlos e seleciona **"Ver como Aluno"**.
3.  **O Masquerade**: O app da Amanda entra em modo "Masquerade". O cabeçalho muda (🎭 Modo Aluno). Ela percebe que esqueceu de ativar a periodização do Carlos.
4.  **A Solução**: Ela sai do modo aluno (`exitStudentView`), ativa o plano no Web, e confirma para Carlos que agora está tudo ok.

---

## 🛠️ Status de Implementação & Dívida Técnica

- [x] **Store Persistente (Zustand)**: Implementado e resiliente a recarregamentos.
- [x] **Redirecionamento Inteligente**: Baseado em `role` e `status`.
- [x] **Modo Masquerade**: Totalmente funcional com reset de cache.
- [ ] **Fluxo de Recuperação**: Páginas de "Esqueci minha senha" ainda precisam de refinamento visual e tradução completa.
- [ ] **Audit Log**: O modo Masquerade precisa de um log no banco de dados para auditoria de segurança (atualmente é apenas log de console).

---

> **Próximos Passos Sugeridos:** Validar as triggers de banco de dados que sincronizam o `account_type` do metadado do Supabase com a tabela `profiles`.

---
*Documento gerado como parte da análise modular do sistema MeuPersonal.*
