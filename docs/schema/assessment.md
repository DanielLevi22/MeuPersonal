# Schema — Módulo Assessment

> **Status:** ✅ Aprovado
> Parte do [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) — fonte da verdade para geração das migrations.

---

## Contexto

O módulo Assessment centraliza tudo relacionado a avaliar o estado físico do aluno:

1. **Anamnese** — histórico de saúde preenchido pelo aluno no onboarding (`student_anamnesis`)
2. **Avaliação física** — medições manuais coletadas pelo especialista (`physical_assessments`)
3. **Body scan** — análise por IA a partir de fotos do aluno (`body_scans`)

Essas três entidades foram separadas do módulo Students porque compartilham o mesmo domínio (estado físico do aluno) e tendem a crescer juntas — comparações entre avaliações, linha do tempo de progresso, exportação de relatório. O módulo Students fica responsável apenas pelo relacionamento (quem está vinculado a quem).

O código mobile já refletia essa separação: `src/modules/assessment/` existia como módulo independente com `assessmentStore`, `anamnesisService` e `aiBodyScan`. O schema agora alinha-se com essa fronteira.

---

## Origem das tabelas

| Tabela | Origem |
|---|---|
| `student_anamnesis` | Movida de Students |
| `physical_assessments` | Movida de Students |
| `body_scans` | Nova — AI body scan |

---

## Tabela `student_anamnesis`

Questionário de saúde preenchido pelo próprio aluno no onboarding. Gera insumos para o especialista entender o histórico, limitações e objetivos do aluno antes de começar a prescrever.

Cada aluno tem exatamente uma anamnese — ela pode ser atualizada, mas não duplicada.

```
student_anamnesis
├── id            uuid        PK
├── student_id    uuid        NOT NULL UNIQUE FK → profiles.id CASCADE DELETE
├── responses     jsonb       NOT NULL DEFAULT '{}'
├── completed_at  timestamptz NULL — NULL = não preenchida ainda
└── created_at    timestamptz NOT NULL DEFAULT now()
```

**Por que jsonb?**
As perguntas da anamnese são qualitativas e semi-estruturadas — histórico de lesões, doenças, medicamentos, objetivos, restrições alimentares. O conteúdo do questionário pode evoluir (novas perguntas, remoção de perguntas antigas) sem precisar alterar o schema. A anamnese é sempre lida como um bloco completo — nunca filtramos por campo específico.

**`UNIQUE(student_id)`**: um aluno tem exatamente uma anamnese. Atualizamos o registro existente quando o questionário muda.

**`completed_at NULL`**: indica que o aluno ainda não preencheu. Usado para exibir prompt no app e aviso para o especialista ("aluno não preencheu anamnese").

**Quem preenche**: o aluno. O especialista lê, não edita. Sem `specialist_id`.

---

## Tabela `physical_assessments`

Cada avaliação é um snapshot imutável — não atualizamos registros existentes, criamos novos. Isso permite visualizar a evolução do aluno ao longo do tempo em gráficos e resumos.

A avaliação pertence ao aluno, não ao especialista. Qualquer especialista vinculado ao aluno pode registrar uma avaliação — personal trainer e nutricionista podem ambos fazer bioimpedância ou dobras cutâneas. O `specialist_id` registra quem coletou, mas não restringe quem pode coletar.

**Por que colunas fixas e não jsonb?**
Para gerar gráficos de evolução (peso ao longo do tempo, gordura corporal mês a mês), as queries precisam referenciar colunas nomeadas diretamente. As métricas de avaliação física são protocolos padronizados — o protocolo de dobras Jackson-Pollock tem sempre os mesmos 7 pontos, as circunferências têm sempre os mesmos locais. Não há ganho de flexibilidade em usar jsonb aqui.

```
physical_assessments
├── id                   uuid          PK
├── student_id           uuid          NOT NULL FK → profiles.id CASCADE DELETE
├── specialist_id        uuid          NULL FK → profiles.id SET NULL
├── assessed_at          timestamptz   NOT NULL DEFAULT now()
│
├── — Básico —
├── weight_kg            numeric(5,2)  NULL
├── height_cm            numeric(5,2)  NULL
│
├── — Composição corporal —
├── body_fat_pct         numeric(5,2)  NULL — % gordura (bioimpedância ou cálculo)
├── muscle_mass_kg       numeric(5,2)  NULL
│
├── — Dobras cutâneas (mm) — protocolo Jackson-Pollock 7 —
├── skinfold_chest       numeric(5,2)  NULL
├── skinfold_abdomen     numeric(5,2)  NULL
├── skinfold_thigh       numeric(5,2)  NULL
├── skinfold_tricep      numeric(5,2)  NULL
├── skinfold_suprailiac  numeric(5,2)  NULL
├── skinfold_subscapular numeric(5,2)  NULL
├── skinfold_midaxillary numeric(5,2)  NULL
│
├── — Circunferências (cm) —
├── circ_waist           numeric(5,2)  NULL
├── circ_hip             numeric(5,2)  NULL
├── circ_chest           numeric(5,2)  NULL
├── circ_right_arm       numeric(5,2)  NULL
├── circ_left_arm        numeric(5,2)  NULL
├── circ_right_thigh     numeric(5,2)  NULL
├── circ_left_thigh      numeric(5,2)  NULL
│
├── notes                text          NULL
└── created_at           timestamptz   NOT NULL DEFAULT now()
```

**`specialist_id NULL`**: nullable porque no futuro o aluno pode registrar o próprio peso sem precisar de especialista. `SET NULL` na deleção do especialista — a avaliação pertence ao aluno e deve ser preservada.

**`assessed_at` vs `created_at`**: `assessed_at` é quando a avaliação foi feita na prática (pode ser retroativa). `created_at` é quando o registro entrou no banco.

**Imutabilidade**: avaliações não são atualizadas. Uma avaliação corrigida cria um novo registro. O histórico é a fonte de verdade.

---

## Tabela `body_scans`

Avaliação gerada por IA a partir de fotos tiradas pelo próprio aluno. O aluno tira as fotos, o sistema salva no Storage e envia para análise da IA, que retorna métricas e análise postural.

**Status**: estrutura definida. A orquestração completa (fluxo de upload → IA → persistência do resultado) será especificada quando a feature migrar para o web. O schema suporta o resultado final independentemente do frontend.

```
body_scans
├── id                     uuid          PK
├── student_id             uuid          NOT NULL FK → profiles.id CASCADE DELETE
├── scanned_at             timestamptz   NOT NULL DEFAULT now()
│
├── — Fotos (URLs Supabase Storage) —
├── photo_front_url        text          NULL
├── photo_back_url         text          NULL
├── photo_side_right_url   text          NULL
├── photo_side_left_url    text          NULL
│
├── — Métricas derivadas pela IA —
├── height_cm              numeric(5,2)  NULL
├── weight_kg              numeric(5,2)  NULL
├── body_fat_pct           numeric(5,2)  NULL
├── muscle_mass_kg         numeric(5,2)  NULL
├── bmi                    numeric(5,2)  NULL
│
├── — Segmentos (cm) derivados pela IA —
├── circ_chest             numeric(5,2)  NULL
├── circ_waist             numeric(5,2)  NULL
├── circ_hips              numeric(5,2)  NULL
├── circ_arms              numeric(5,2)  NULL
├── circ_thighs            numeric(5,2)  NULL
├── circ_calves            numeric(5,2)  NULL
├── circ_neck              numeric(5,2)  NULL
├── circ_shoulders         numeric(5,2)  NULL
│
├── — Postura — scores numéricos (para gráficos) —
├── posture_symmetry_score numeric(4,2)  NULL — 0–10
├── posture_muscle_score   numeric(4,2)  NULL — 0–10
├── posture_overall_score  numeric(4,2)  NULL — 0–10
│
├── — Análise textual gerada pela IA —
├── posture_feedback       jsonb         NULL
│   — { front: [{title, risk, text}], back: [...], side_right: [...], side_left: [...] }
├── recommendations        text          NULL
│
└── created_at             timestamptz   NOT NULL DEFAULT now()
```

**Por que scores numéricos em colunas fixas e feedback em jsonb?**
Os scores (symmetry, muscle, posture) são números consultados em gráficos de evolução — precisam de colunas indexáveis. O feedback é texto livre gerado pela IA, estruturado por ângulo — não é consultado individualmente, sempre lido como bloco.

**Sem `specialist_id`**: o scan é iniciado pelo aluno, não pelo especialista. O especialista acessa o resultado via RLS por vínculo ativo.

**Fotos em Supabase Storage**: as URLs referenciam o bucket privado `body-scans`. Acesso controlado por RLS no storage — apenas o aluno e especialistas vinculados.

**Imutabilidade**: cada scan é um snapshot. Nenhum campo é atualizado após a criação.

---

## Relações do módulo Assessment

```
profiles (Auth)
    │
    ├── student_anamnesis (1:1) — só para account_type = 'student'
    │       └── preenchido pelo aluno, lido pelo especialista
    │
    ├── physical_assessments (1:N) — histórico imutável
    │       └── specialist_id → profiles.id (quem coletou, SET NULL)
    │
    └── body_scans (1:N) — histórico imutável
            └── iniciado pelo próprio aluno — sem specialist_id
```

**Dependência cruzada com Students:**
O RLS deste módulo consulta `student_specialists` (Students) para verificar se o especialista está vinculado ao aluno. O módulo Assessment não importa dados de Students — apenas o RLS faz a verificação na camada do banco.

**Dependência cruzada com student_consents (Students):**
O RLS de `physical_assessments`, `student_anamnesis` e `body_scans` verifica se existe `student_consents` com `revoked_at IS NULL` antes de permitir INSERT. O consentimento fica em Students porque pertence ao aluno como entidade — não é específico de nenhum tipo de avaliação.

---

## O que foi explicitamente rejeitado

| Decisão rejeitada | Motivo |
|---|---|
| Manter `physical_assessments` e `student_anamnesis` em Students | Students é gerência de relacionamento. Dados de saúde têm domínio próprio e tendem a crescer juntos (comparações, relatórios, linha do tempo). |
| jsonb para métricas de `physical_assessments` | Necessário fazer queries por campo específico para gráficos de evolução. Colunas fixas são mais eficientes e o protocolo de medição é padronizado. |
| jsonb para scores de postura em `body_scans` | Scores são numéricos e consultados em gráficos — precisam de índice. Apenas o feedback textual vai em jsonb. |
| `nutrition_progress` como tabela separada em Nutrition | Os dados (peso, medidas, % gordura) já existem em `physical_assessments` e `body_scans`. Duplicar seria inconsistência de fonte de verdade. A tela de progresso nutricional lê diretamente daqui. |
| Atualizar registros existentes em `physical_assessments` e `body_scans` | Avaliações são snapshots históricos. Atualizar destruiria o histórico. Uma correção cria novo registro. |

---

## Compliance LGPD

Todas as tabelas deste módulo contêm **dados sensíveis de saúde** (Art. 5°, II da Lei 13.709/2018).

### Bases legais

| Tabela | Base legal | Artigo |
|---|---|---|
| `student_anamnesis` | Consentimento explícito | Art. 11, I |
| `physical_assessments` | Tutela da saúde + Consentimento | Art. 11, II, f + I |
| `body_scans` | Tutela da saúde + Consentimento | Art. 11, II, f + I |

### Mecanismo de consentimento

O INSERT em qualquer tabela deste módulo requer `student_consents` com `revoked_at IS NULL` para aquele aluno (verificado via RLS). O consentimento é registrado no onboarding — ver módulo Students.

### RLS — políticas mínimas

```sql
-- physical_assessments
-- SELECT: student proprietário + specialist com student_specialists.status = 'active'
-- INSERT: specialist vinculado + student_consents ativo para o aluno
-- UPDATE: proibido — snapshots imutáveis
-- DELETE: apenas via fluxo de exclusão de conta

-- student_anamnesis
-- SELECT: student proprietário + specialist com student_specialists.status = 'active'
-- INSERT/UPDATE: apenas o próprio student
-- DELETE: apenas via fluxo de exclusão de conta

-- body_scans
-- SELECT: student proprietário + specialist com student_specialists.status = 'active'
-- INSERT: specialist vinculado + student_consents ativo para o aluno
-- UPDATE: proibido — snapshots imutáveis
-- DELETE: apenas via fluxo de exclusão de conta
```

### Garantias críticas

- Specialist desvinculado perde acesso via RLS automaticamente — sem lógica de aplicação
- Fotos do body scan em bucket privado — acesso controlado por RLS no Supabase Storage
- Nunca logar conteúdo de `student_anamnesis.responses` ou métricas individuais em texto claro
- Seeds de desenvolvimento não podem conter dados reais de avaliações, anamnese ou fotos
