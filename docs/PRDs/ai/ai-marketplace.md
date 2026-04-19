# PRD: Marketplace — Alunos Encontram Especialistas

**Data de criação:** 2026-04-19
**Status:** draft
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Um marketplace onde alunos autônomos descobrem, avaliam e contratam especialistas (personal trainers, nutricionistas) diretamente pela plataforma, com reviews verificados, perfis públicos e comunicação integrada.

### Por quê?
Especialistas encontram alunos hoje via Instagram e boca a boca — caro, lento e sem garantia de qualidade. Alunos não têm como verificar a competência de um personal antes de contratar. A plataforma resolve os dois lados: especialista ganha canal de aquisição de clientes qualificados (já usam o app, têm histórico), aluno ganha confiança via resultados verificados. Esse é o maior diferencial competitivo do produto — cria network effects e lock-in para ambos os lados.

### Como saberemos que está pronto?
- [ ] Aluno autônomo consegue buscar especialistas por especialidade, localização e preço
- [ ] Página de perfil do especialista exibe credenciais verificadas, resultados e reviews
- [ ] Aluno consegue entrar em contato com especialista diretamente pela plataforma
- [ ] Especialista recebe notificação de interesse de novo aluno
- [ ] Ao fechar contrato, aluno migra de autônomo para gerenciado automaticamente
- [ ] Reviews são coletados ao encerrar vínculo (não podem ser fakes — vinculados a relação real)

---

## Contexto e oportunidade

**Problema do especialista hoje:**
- Aquisição via Instagram = R$500–2.000/mês em ads ou horas de conteúdo
- Sem plataforma centralizada para mostrar resultados reais
- Contrato e pagamento fora da plataforma (WhatsApp + Pix)

**Problema do aluno hoje:**
- Não tem como verificar competência antes de contratar
- Reviews no Google/Instagram são facilmente falsificados
- Sem portabilidade: muda de personal e perde todo o histórico

**O que a plataforma resolve:**
- Especialista: canal de aquisição passivo, com alunos qualificados e histórico pronto
- Aluno: reviews verificados (vinculados a relações reais), histórico portátil entre especialistas
- Plataforma: nova fonte de receita + network effects que aumentam o moat

---

## Fluxo principal

### Aluno buscando especialista

```
Aluno autônomo → "Quero um especialista"
  → Filtros: especialidade / online ou presencial / cidade / faixa de preço
  → Lista de especialistas ordenada por: relevância, avaliação, proximidade
  → Clica no perfil → vê:
      - Credenciais verificadas (CREF)
      - Especialidades e metodologias
      - Galeria de resultados verificados (fotos antes/depois de alunos reais)
      - Reviews com nota e comentário
      - Preço médio mensal
      - Disponibilidade (vagas abertas ou lista de espera)
  → "Quero conversar" → mensagem inicial dentro da plataforma
  → Especialista responde e fecha contrato
  → Aluno migra para "gerenciado" — histórico completo transferido
```

### Especialista recebendo aluno do marketplace

```
Notificação: "Maria quer conversar — ela treina há 45 dias, fez 2 check-ins,
  objetivo: emagrecimento, disponibilidade: 3x/semana"
  → Especialista vê perfil completo do aluno (com permissão)
  → Aceita conversa → chat integrado
  → Fecha contrato → aluno adicionado à carteira automaticamente
  → Especialista já tem todo o histórico do aluno para iniciar o trabalho
```

---

## Reviews verificados — regra central

Reviews **só podem ser criados** quando existe (ou existiu) um vínculo ativo na tabela `student_specialists`. Sem vínculo real, sem review. Isso elimina reviews falsos.

**Fluxo de coleta:**
- Ao pausar ou encerrar vínculo, aluno recebe convite automático para avaliar
- 7 dias para responder, depois expira
- Review inclui: nota geral (1-5), nota de comunicação, nota de resultado, comentário livre
- Especialista pode responder publicamente ao review

**O que aparece no perfil:**
- Nota média + total de reviews
- Distribuição de notas (gráfico)
- Reviews com data, tempo de vínculo e (opcional) resultado verificado
- Badge "Resultado verificado" quando o aluno autorizou exibição do antes/depois

---

## Verificação de especialistas

Antes de aparecer no marketplace, o especialista passa por:

1. **Verificação de CREF** — upload da carteira + validação manual (MVP) ou via API do CONFEF (futuro)
2. **Foto de perfil real** — moderação básica
3. **Aceitação dos termos** — responsabilidade pelo serviço prestado

Badge "Verificado" aparece no perfil após aprovação. Especialistas não verificados podem usar a plataforma mas não aparecem no marketplace.

---

## Modelo de receita do marketplace

| Modelo | Descrição | Prós | Contras |
|---|---|---|---|
| **Taxa de conexão** | R$49 por novo aluno adquirido via marketplace | Simples, baixo atrito | Especialista evita plataforma após 1ª conexão |
| **Comissão mensal** | 10% da mensalidade do aluno enquanto ativo | Alinha incentivos, recorrente | Complexo de implementar, especialista pode esconder |
| **Boost de perfil** | Especialista paga para aparecer primeiro (como Google Ads) | Não interfere no fluxo | Pode degradar qualidade dos resultados |
| **Freemium de slots** | Plano básico = 2 alunos via marketplace; Pro = ilimitado | Simples de gate | Limita crescimento dos menores |

**Recomendação para MVP:** Taxa de conexão (R$49 por aluno adquirido via marketplace). Simples de cobrar, sem complexidade de reconciliação. Evoluir para comissão mensal quando houver tracking confiável.

---

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|---|---|---|
| `specialist_public_profiles` | SELECT, INSERT, UPDATE | **NOVA** — perfil público, visível sem auth |
| `specialist_verifications` | SELECT, INSERT, UPDATE | **NOVA** — status de verificação CREF |
| `student_reviews` | SELECT, INSERT | **NOVA** — reviews vinculados a student_specialists |
| `marketplace_leads` | SELECT, INSERT, UPDATE | **NOVA** — interesse de aluno em especialista |
| `specialist_messages` | SELECT, INSERT | Compartilhada com ai-specialist-engagement |
| `student_specialists` | SELECT, INSERT | Existente — migração de autônomo para gerenciado |

### Novas tabelas

```sql
CREATE TABLE specialist_public_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio text,
  specialties text[] DEFAULT '{}',
  modalities text[] DEFAULT '{}',     -- online, presencial, híbrido
  city text,
  state text,
  price_range_min numeric,
  price_range_max numeric,
  cref text,
  is_verified boolean DEFAULT false,
  accepting_students boolean DEFAULT true,
  avatar_url text,
  result_photos jsonb DEFAULT '[]',   -- [{before_url, after_url, description, student_consent}]
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE student_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_specialist_id uuid NOT NULL REFERENCES student_specialists(id),
  rating_overall smallint NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_communication smallint CHECK (rating_communication BETWEEN 1 AND 5),
  rating_results smallint CHECK (rating_results BETWEEN 1 AND 5),
  comment text,
  specialist_reply text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_specialist_id)       -- 1 review por relação
);

CREATE TABLE marketplace_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'contracted', 'declined')),
  student_message text,
  source text DEFAULT 'marketplace',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Fases de entrega

### Fase 1 — Perfil público e verificação (1 semana)
- [ ] Tabela `specialist_public_profiles` com RLS (leitura pública, escrita só do próprio)
- [ ] Formulário de criação de perfil público no dashboard do especialista
- [ ] Fluxo de verificação de CREF (upload + aprovação manual pelo admin)
- [ ] Página pública `/especialistas/[slug]` — sem auth para visualizar

### Fase 2 — Busca e discovery (1 semana)
- [ ] Página de busca `/especialistas` com filtros
- [ ] Indexação por especialidade, cidade, modalidade, nota
- [ ] Ordenação por relevância (verificado > nota > recência)
- [ ] Cards de especialista na listagem

### Fase 3 — Leads e comunicação (1 semana)
- [ ] Tabela `marketplace_leads` + fluxo de "quero conversar"
- [ ] Notificação para especialista ao receber lead
- [ ] Chat integrado (compartilhado com ai-specialist-engagement)
- [ ] Migração automática de autônomo → gerenciado ao fechar contrato

### Fase 4 — Reviews (1 semana)
- [ ] Fluxo de coleta de review ao encerrar vínculo
- [ ] Exibição de reviews no perfil público
- [ ] Badge "Resultado verificado" com fotos antes/depois
- [ ] Resposta pública do especialista ao review

### Fase 5 — Monetização (2-3 dias)
- [ ] Cobrança de taxa de conexão (R$49 por lead convertido)
- [ ] Integração com Stripe/Asaas para cobrar o especialista
- [ ] Dashboard de leads e conversões para o especialista

---

## Riscos e mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Especialista fecha contrato fora da plataforma para fugir da taxa | Alta | Oferecer valor suficiente (histórico do aluno, ferramentas) que compense a taxa |
| Reviews falsos coordenados | Baixa | Vínculo real obrigatório em `student_specialists` |
| Especialista sem CREF (mercado informal) | Média | Deixar usar plataforma mas sem badge e sem marketplace |
| Disputas entre aluno e especialista | Média | Política de uso clara, canal de suporte, sem responsabilidade financeira da plataforma no MVP |

---

## Checklist de done
- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/ai-marketplace.md` criado
- [ ] `docs/STATUS.md` atualizado
- [ ] RLS configurado — perfis públicos legíveis sem auth, writes protegidos
- [ ] Política de privacidade atualizada (dados de perfil público)
