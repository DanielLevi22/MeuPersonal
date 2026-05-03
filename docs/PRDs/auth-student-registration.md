# PRD: auth-student-registration

**Data de criação:** 2026-05-02
**Status:** approved
**Branch:** feature/auth-student-registration
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Fluxo de auto-cadastro para alunos na web e no mobile. O aluno cria sua conta com nome, e-mail e senha sem precisar de um especialista. Após login é roteado para a interface do aluno (/dashboard/coach) em vez do dashboard do especialista.

### Por quê?
Hoje só especialistas conseguem criar contas. Alunos sem especialista ficam sem acesso ao produto. Com o coach IA já implementado, o aluno autônomo tem uma experiência completa assim que se cadastra.

### Como saberemos que está pronto?
- [ ] Aluno consegue se registrar na web com nome, e-mail e senha
- [ ] Conta criada com account_type = 'student'
- [ ] Após login, aluno é redirecionado para /dashboard/coach
- [ ] Rotas de especialista bloqueiam account_type = 'student' com redirect
- [ ] Aluno consegue se registrar no mobile com opção "Sou aluno"
- [ ] Fluxo de especialista continua funcionando sem regressões

---

## Contexto

Atualmente o cadastro é exclusivo para especialistas. O aluno só existe se criado pelo especialista via código de 6 dígitos. O `profiles.account_type` já suporta `student` mas não há fluxo de auto-registro.

## Escopo

### Incluído
- Página de registro web com seleção de tipo (especialista / aluno)
- API route `POST /api/auth/register/student`
- Roteamento pós-login por account_type (specialist → /dashboard, student → /dashboard/coach)
- Guard no layout do dashboard bloqueando student de acessar rotas de especialista
- Tela de registro no mobile com opção "Sou aluno"

### Fora do escopo (explicitamente)
- Dashboard completo do aluno (métricas, treinos, dieta)
- Aprovação/moderação de cadastro de aluno
- Fluxo de vinculação aluno ↔ especialista após auto-registro
- Aluno gerenciado via código (fluxo atual não é tocado)

---

## Fluxo de dados

```
[Trigger/Ação do usuário]
  → [Componente/Screen]
  → [Hook / Mutation]
  → [Service / Supabase]
  → [Tabela do banco]
  ← [Retorno / Estado atualizado]
```

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `nome_tabela` | SELECT / INSERT / UPDATE / DELETE | nota relevante |

## Impacto em outros módulos

<!-- Esta feature afeta outros módulos? Quais? Como? -->
- Nenhum | ou listar módulos afetados

---

## Decisões técnicas

<!-- Decisões não-óbvias que precisam ser registradas. Ex: por que usar X e não Y. -->

---

## Checklist de done

> Só muda o Status para `done` quando TODOS estão marcados.

- [ ] Código funciona e passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/auth-student-registration.md` criado ou atualizado
- [ ] `docs/STATUS.md` atualizado
