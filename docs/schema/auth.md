# Schema — Módulo Auth

> **Status:** ✅ Aprovado
> Parte do [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) — fonte da verdade para geração das migrations.

---

## Contexto

O módulo Auth é a identidade central do sistema. Todo usuário — independente do tipo — tem exatamente uma linha na tabela `profiles`. Essa tabela é criada automaticamente via trigger do Supabase quando um usuário se registra em `auth.users`.

O schema anterior tinha problemas identificados durante o desenvolvimento das primeiras features:
- `is_super_admin` era redundante com `account_type = 'admin'`
- `birth_date` e `gender` estavam em `profiles` mas pertencem ao contexto de Students
- O nome `professional` não refletia bem o domínio do produto
- `managed_student` e `autonomous_student` eram técnicos demais

Esses problemas motivaram a decisão de arquitetar o banco inteiro antes de gerar qualquer migration.

---

## Tipos de conta — `account_type`

O sistema tem 4 tipos de conta. Essa foi uma das discussões mais importantes do módulo:

**`admin`**
Daniel — o criador do produto. Gerencia a plataforma, tem acesso total. Existe apenas um admin. Não tem relação com especialistas ou alunos.

**`specialist`**
Anteriormente chamado de `professional`. Renomeado porque "specialist" é semanticamente mais rico e extensível — um especialista pode ser personal trainer, nutricionista, fisioterapeuta (futuro), psicólogo esportivo (futuro). O tipo específico de serviço que ele oferece fica em `specialist_services`, não no `account_type`. Assim, adicionar um novo tipo de serviço no futuro não exige alterar o enum de contas.

**`student`**
Anteriormente chamado de `managed_student`. É o aluno vinculado a um ou mais especialistas. O especialista cria a conta do aluno (via RPC), prescreve treinos e planos alimentares. O aluno consome. Tem um fluxo de UI completamente próprio — telas de acompanhamento, execução de treino, registro de refeições.

**`member`**
Anteriormente chamado de `autonomous_student`. É o usuário independente — não tem especialista, cria e gerencia o próprio conteúdo. **Roadmap futuro**: no MVP apenas `specialist` e `student` estão implementados. O `member` entra quando o módulo de IA estiver pronto, pois o fluxo dele é fundamentalmente diferente e usa IA como assistente na criação de planos. O nome `member` foi escolhido porque "aluno" implica ter alguém ensinando — esse usuário não tem isso.

> **Por que não usar um flag `is_self_managed` em vez de um tipo separado?**
> Foi considerado. Mas `student` e `member` têm fluxos de UI completamente diferentes — onboarding diferente, telas diferentes, permissões diferentes. Quando a separação resulta em experiências distintas, o `account_type` é o lugar certo para fazer essa distinção. Um flag seria correto se a diferença fosse só de permissão, não de identidade.

---

## Tabela `profiles`

```
profiles
├── id            uuid           PK — espelho de auth.users.id (não autoincremento)
├── email         text           NOT NULL — espelho de auth.users.email
├── full_name     text           NULL — preenchido no cadastro
├── avatar_url    text           NULL — foto de perfil, armazenada no Supabase Storage
├── account_type  account_type   NOT NULL — enum: admin | specialist | student | member
├── account_status account_status NOT NULL DEFAULT 'active' — enum: active | inactive | invited
├── created_at    timestamptz    NOT NULL DEFAULT now()
└── updated_at    timestamptz    NOT NULL DEFAULT now()
```

### Enum `account_type`

```sql
CREATE TYPE account_type AS ENUM ('admin', 'specialist', 'student', 'member');
```

| Valor | Descrição |
|-------|-----------|
| `admin` | Daniel — acesso total à plataforma |
| `specialist` | Personal trainer ou nutricionista (antes: `professional`) |
| `student` | Aluno vinculado a um ou mais specialists (antes: `managed_student`) |
| `member` | Usuário independente, sem specialist — roadmap futuro (antes: `autonomous_student`) |

Renomeações em relação ao schema anterior: `professional → specialist`, `managed_student → student`, `autonomous_student → member`. Os nomes antigos estão registrados aqui para rastreabilidade na migração.

### Enum `account_status`

```sql
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'invited');
```

| Valor | Descrição |
|-------|-----------|
| `active` | Conta normal em operação |
| `inactive` | Desativada — nunca deletamos, só desativamos |
| `invited` | Criada pelo specialist (Fluxo A) — aluno ainda não ativou. Adicionado pelo módulo Students. |

O valor `pending` existia no schema anterior para aprovação do specialist pelo admin — fluxo removido. `invited` substitui essa necessidade no contexto correto (onboarding do aluno).

**O que foi removido e por quê:**

| Campo removido | Motivo |
|---------------|--------|
| `is_super_admin` | Redundante — `account_type = 'admin'` já identifica o administrador. Ter os dois criava dois caminhos para verificar a mesma coisa, gerando inconsistência potencial. |
| `birth_date` | Pertence ao contexto de Students (avaliação física, cálculo de idade para TMB). Não faz sentido para especialista ou admin. |
| `gender` | Mesmo motivo do `birth_date` — relevante para avaliação física de alunos, não para identidade de conta. |
| `invite_code` | Legado de um fluxo de convite que foi descartado. |
| `phone` | Nunca utilizado funcionalmente. |
| `cref` / `crn` | Credenciais profissionais que foram removidas do fluxo de cadastro. O processo de validação mudou. |
| `professional_bio` | Legado de uma tela de perfil expandido que não foi implementada. |
| `xp` / `level` | Pertencem ao módulo de Gamification, não à identidade de conta. |

---

## Tabela `specialist_services`

Anteriormente chamada de `professional_services`. Renomeada para consistência com a renomeação de `professional` → `specialist`.

Um especialista pode oferecer um ou dois tipos de serviço. Essa tabela registra quais. A separação em tabela própria (em vez de colunas booleanas em `profiles`) permite adicionar novos tipos de serviço no futuro sem alterar o schema de `profiles`.

```
specialist_services
├── id             uuid          PK
├── specialist_id  uuid          NOT NULL FK → profiles.id CASCADE DELETE
├── service_type   service_type  NOT NULL — personal_training | nutrition_consulting
└── created_at     timestamptz   NOT NULL DEFAULT now()

UNIQUE(specialist_id, service_type)
```

**`service_type`: `personal_training | nutrition_consulting`**

**`UNIQUE(specialist_id, service_type)`**: um especialista não pode ter dois registros do mesmo tipo de serviço.

**Por que não ter `is_active`?**
O schema anterior tinha `is_active boolean`. Foi removido porque: se o especialista desativa um serviço, a linha é deletada. Não há necessidade de histórico de quais serviços um especialista já ofereceu no MVP. Manter `is_active = false` em vez de deletar só adiciona complexidade de filtragem em toda query que usa essa tabela.

---

## Relações do módulo Auth

```
auth.users (Supabase)
    │
    └── profiles (1:1)
            │
            └── specialist_services (1:N) — só para account_type = 'specialist'
```

O `profiles.id` é idêntico ao `auth.users.id` — não é gerado pelo banco, é recebido do Supabase Auth via trigger. Isso garante que autenticação e dados de perfil estão sempre sincronizados sem joins desnecessários.

---

## Compliance LGPD — revisão `/lgpd-check`

### Bloco A — Necessidade e Finalidade ✅

Todos os campos passam no critério de necessidade:

| Campo | Necessário? | Justificativa |
|-------|------------|---------------|
| `email` | Sim | Autenticação e comunicação — o serviço não funciona sem |
| `full_name` | Sim | Identificação do usuário nas telas — obrigatório no cadastro |
| `avatar_url` | Opcional | Personalização — o sistema funciona sem. Campo deve ser opcional no formulário |
| `account_type` | Sim | Controla fluxo de UI, permissões e RLS |
| `account_status` | Sim | Ciclo de vida da conta |
| `service_type` | Sim | Define quais funcionalidades o especialista acessa |

Campos rejeitados do schema anterior que teriam violado a Necessidade: `birth_date`, `gender`, `phone`, `cref/crn`, `is_super_admin`, `professional_bio`, `xp/level` — todos corretos.

### Bloco B — Bases Legais ✅

| Dado | Base legal | Artigo |
|------|------------|--------|
| `profiles` (todos os campos) | Execução de contrato | Art. 7°, V |
| `specialist_services` | Execução de contrato | Art. 7°, V |
| `avatar_url` (opcional) | Consentimento | Art. 7°, I |

### Bloco C — Segurança e RLS ⚠️

RLS obrigatório para `profiles` e `specialist_services`. Políticas mínimas necessárias:

```sql
-- profiles: usuário vê e edita apenas o próprio perfil
-- admin vê todos (necessidade operacional documentada)
-- specialist NÃO acessa profile de outro specialist diretamente
-- specialist acessa profiles de seus alunos via student_specialists

-- specialist_services: specialist gerencia apenas os próprios serviços
-- outros usuários podem ler (necessário para o aluno saber o tipo de serviço ao se vincular)
```

**Decisão pendente para implementação:** definir se specialist pode ver `profiles` de outros specialists ou apenas de seus alunos.

### Bloco D — Direitos dos Titulares ❌

**Problema identificado — Exclusão vs. Soft Delete:**

O schema usa `account_status = 'inactive'` para desativar contas. Pela LGPD, isso **não é eliminação**. Quando um usuário solicita exclusão da conta:

- `profiles.email` e `profiles.full_name` devem ser eliminados ou anonimizados
- `profiles.avatar_url` (arquivo no Storage) deve ser deletado
- `specialist_services` pode ser deletado (não há histórico necessário aqui)

**Decisão tomada:** o fluxo de exclusão de conta deve:
1. Anonimizar `profiles`: `email → deleted_{uuid}@deleted.meupersonal`, `full_name → 'Usuário removido'`, `avatar_url → NULL`
2. Deletar `specialist_services` do usuário
3. Manter `profiles.id` e `account_status = 'inactive'` para preservar integridade referencial com dados de outros módulos (treinos, avaliações pertencentes a alunos do specialist)
4. Dados de saúde de alunos: ver decisão no módulo Students

**Problema identificado — Contas `invited` sem ativação:**

O status `invited` (adicionado pelo módulo Students) cria perfis com `email` e `full_name` de alunos que podem nunca ativar a conta. Isso representa dado pessoal coletado sem que o titular tenha ação direta.

**Base legal:** o especialista cria a conta como parte da execução do contrato de serviço (Art. 7°, V). O aluno dará consentimento no momento da ativação.

**Política de retenção para contas `invited`:** se o aluno não ativar em **90 dias**, o perfil deve ser anonimizado (`email → expired_{uuid}@deleted.meupersonal`, `full_name → NULL`) e o status vai para `inactive`. O especialista recebe notificação para reenviar o convite se ainda necessário.

> Decisão pendente: implementar job de limpeza automática de contas `invited` expiradas (90 dias).

### Bloco E — Prevenção e Transparência ✅

- Senhas nunca armazenadas — gerenciadas pelo Supabase Auth
- `email` não deve aparecer em logs de aplicação
- `avatar_url` é uma referência ao Storage, não dado em si — ok logar a URL pública
- Onboarding informa quais dados são coletados no cadastro
