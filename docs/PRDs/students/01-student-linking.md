# PRD: student-linking

**Data de criação:** 2026-04-13
**Status:** approved
**Branch:** feature/student-linking
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Implementar os dois fluxos de vínculo entre aluno e especialista: (A) especialista cria a conta do aluno e o vínculo já existe desde o início, e (B) aluno cria a própria conta e gera um código para se vincular a um especialista.

### Por quê?
O sistema precisa suportar dois perfis de entrada do aluno: o aluno que chega pelo especialista (fluxo mais comum no MVP) e o aluno que chega por conta própria e depois se conecta a um especialista. Ambos os caminhos chegam no mesmo estado final — um vínculo ativo em `student_specialists` — mas partem de origens diferentes.

### Como saberemos que está pronto?
- [ ] Especialista consegue criar conta de aluno pelo sistema → aluno recebe e-mail de ativação → ao ativar, já está vinculado ao especialista
- [ ] Aluno consegue criar conta própria → gera código de vínculo → especialista digita o código → vínculo criado
- [ ] Aluno com `account_status = 'invited'` não consegue acessar o sistema antes de ativar a conta
- [ ] Um aluno não pode ter dois especialistas do mesmo `service_type` simultaneamente
- [ ] Ao desvincular, `student_specialists.status` vai para `inactive` — aluno perde acesso aos dados do especialista
- [ ] Ao re-vincular com o mesmo especialista, dados anteriores são recuperados automaticamente
- [ ] Código de vínculo expira em 24h e é de uso único

---

## Contexto

Durante a arquitetura do módulo Students, identificamos que o sistema anterior tinha apenas um fluxo (especialista cria conta do aluno via RPC). Isso não cobria o caso do aluno autônomo que quer se vincular a um especialista depois. A solução é dois fluxos distintos que convergem para a mesma estrutura de dados.

---

## Fluxo A — Especialista cria o aluno

```
Especialista preenche:
  - nome completo
  - e-mail
  - serviço que vai prestar (personal_training | nutrition_consulting)

Sistema executa:
  1. Cria profiles com account_status = 'invited'
  2. Cria student_specialists com status = 'active'
     (specialist_id = quem criou, service_type = serviço selecionado)
  3. Envia e-mail ao aluno com link de ativação

Aluno recebe e-mail:
  - Clica no link
  - Define sua senha
  - profiles.account_status → 'active'
  - Entra no sistema já vinculado ao especialista
```

**Regra de negócio**: se o especialista tentar criar um aluno com um e-mail que já existe no sistema, o sistema não cria um novo perfil — apenas cria o vínculo (se ainda não existir para aquele service_type).

---

## Fluxo B — Aluno cria a própria conta

```
Aluno se cadastra:
  - nome completo, e-mail, senha
  - profiles criado com account_status = 'active'
  - Nenhum vínculo criado ainda

Aluno quer se vincular a um especialista:
  - Na tela de perfil, gera um código de vínculo
  - student_link_codes criado: { student_id, code, expires_at (24h), used: false }
  - Aluno passa o código para o especialista (fora do sistema — mensagem, verbal, etc.)

Especialista digita o código:
  - Sistema valida: código existe, não expirou, não foi usado
  - Verifica se o aluno já tem um vínculo ativo para o service_type do especialista
  - Se não tiver: cria student_specialists com status = 'active'
  - Marca o código como usado
```

---

## Regras de vínculo

**Um aluno pode ter no máximo um especialista por service_type ao mesmo tempo.**
`UNIQUE(student_id, service_type)` em `student_specialists` com `status = 'active'` (enforçado via constraint parcial ou lógica de aplicação).

**Desvincular não deleta dados.**
`student_specialists.status` vai para `inactive`. Os treinos, planos alimentares e avaliações criados pelo especialista permanecem no banco — o aluno simplesmente perde o acesso via RLS.

**Re-vincular o mesmo especialista restaura o acesso.**
Como os dados nunca foram deletados, ao criar um novo `student_specialists active` para o mesmo par `student_id + specialist_id`, o RLS libera o acesso novamente. Os dados aparecem como se nunca tivessem sumido.

**Dados pertencem ao especialista.**
Se o aluno se vincular a um novo especialista, ele não vê o histórico do anterior. Cada especialista vê apenas o que criou para aquele aluno.

---

## Tabelas envolvidas

- `profiles` — campo `account_status` ganha valor `invited`
- `student_specialists` — tabela de vínculo com `status active | inactive`
- `student_link_codes` — códigos de uso único para o Fluxo B

---

## Escopo

### Incluído
- Fluxo A: criação de aluno pelo especialista com e-mail de ativação
- Fluxo B: cadastro autônomo do aluno + geração e uso de código de vínculo
- Lógica de desvínculo (status → inactive)
- Lógica de re-vínculo (restaura acesso automaticamente)
- Expiração e invalidação de códigos

### Fora do escopo
- Notificações push de vínculo (infraestrutura separada)
- Aprovação do aluno para aceitar vínculo (MVP: confiança no código)
- Transferência de dados entre especialistas
- Vínculo entre dois alunos ou dois especialistas

---

## Checklist de done

- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/student-linking.md` criado
- [ ] `docs/STATUS.md` atualizado
