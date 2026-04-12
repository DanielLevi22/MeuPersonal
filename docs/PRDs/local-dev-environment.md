# PRD: local-dev-environment

**Data de criação:** 2026-04-12
**Status:** draft
**Branch:** — (aguardando implementação)
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Configurar o ambiente de desenvolvimento local com Supabase CLI + Docker, eliminando a dependência do projeto Supabase cloud para desenvolvimento. Definir a separação clara entre ambiente local (dev) e produção (único projeto Supabase gratuito).

### Por quê?
Hoje todo o desenvolvimento acontece diretamente no Supabase cloud (produção). Isso significa:
- Qualquer erro de migration afeta dados reais
- Não é possível testar o banco do zero (o `meal_logs` não tem migration — se o banco for recriado, o sistema quebra)
- Não há separação entre "estou testando" e "isso está rodando para usuários"
- Custo zero adicional é possível com Supabase CLI local

### Como saberemos que está pronto?
- [ ] `supabase start` funciona localmente e sobe o banco completo
- [ ] Todas as migrations rodam do zero sem erro (`supabase db reset`)
- [ ] App mobile conecta no banco local em desenvolvimento
- [ ] Web conecta no banco local em desenvolvimento
- [ ] `.env.development` de cada projeto aponta para o banco local
- [ ] Documentado em `docs/features/local-dev-environment.md`

---

## Decisão de arquitetura (acordada em 2026-04-12)

| Ambiente | Banco | Quem usa | Custo |
|---|---|---|---|
| **Local (dev)** | Supabase CLI + Docker (`localhost:54321`) | Desenvolvedor durante desenvolvimento | Gratuito |
| **Produção** | 1 projeto Supabase (free tier) | Usuários reais | Gratuito |

**Não haverá ambiente de staging** neste momento. Custo-benefício não justifica antes do lançamento.

## Contexto

- Docker Desktop já está instalado na máquina
- Supabase CLI precisa ser instalado (`npm install -g supabase` ou Scoop)
- O projeto tem 12 migrations numeradas (0000–0011) + ~50 scripts avulsos no `/app/drizzle/`
- Antes de configurar o ambiente local, o banco precisa ser auditado (ver PRD: `database-audit-and-refactor`) — as migrations avulsas precisam ser organizadas primeiro para que `supabase db reset` funcione limpo

## Dependência

> ⚠️ Este PRD depende do `database-audit-and-refactor` estar concluído primeiro.
> Configurar o ambiente local antes de limpar as migrations pode fazer o `supabase db reset` falhar por referências a tabelas inexistentes.

## Escopo

### Incluído
- Instalação e configuração do Supabase CLI
- `supabase/config.toml` na raiz do projeto
- `.env.development` apontando para `localhost:54321`
- Documentação do fluxo: como iniciar o banco local, como rodar migrations, como resetar

### Fora do escopo
- Staging environment (decisão: não teremos por enquanto)
- CI rodando contra banco local (complexidade não justificada agora)
- Supabase Storage local (só se necessário)

---

## Checklist de done

- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/local-dev-environment.md` criado
- [ ] `docs/STATUS.md` atualizado
