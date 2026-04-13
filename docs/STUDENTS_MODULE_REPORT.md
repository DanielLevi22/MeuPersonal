# Análise Completa: Módulo de Alunos (Students)

Este documento detalha a arquitetura, o fluxo de dados e os processos de avaliação do **Módulo de Alunos**, mapeando as tabelas ativas e identificando o débito técnico acumulado.

### 🔍 Auditoria Real do Banco (Snapshot: 13/04/2026)

Os dados abaixo confirmam que o sistema de avaliações é o mais denso em termos de volume de colunas, e que a tabela de convites está atualmente sem uso.

| table_name | column_name | data_type | coaching_rows | assessment_rows | Veredito |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **coachings** | (Todas as colunas) | uuid/text | 72 | 0 | **ATIVO** (Espinha dorsal) |
| **physical_assessments** | (50+ colunas) | numeric/text | 0 | 26 | **ATIVO** (Histórico denso) |
| **student_invites** | (Todas as colunas) | uuid/text | 0 | 0 | **LEGADO** (Remover) |

#### Detalhamento do Snapshot:
| table_name | column_name | data_type | coaching_rows | assessment_rows |
| :--- | :--- | :--- | :--- | :--- |
| coachings | client_id | uuid | 72 | 0 |
| coachings | created_at | timestamp | 72 | 0 |
| coachings | status | USER-DEFINED | 72 | 0 |
| physical_assessments | bmi | numeric | 0 | 26 |
| physical_assessments | bmr | numeric | 0 | 26 |
| physical_assessments | body_fat_percentage | numeric | 0 | 26 |
| physical_assessments | skinfold_abdominal | numeric | 0 | 26 |
| physical_assessments | photo_front | text | 0 | 26 |
| physical_assessments | student_id | uuid | 0 | 26 |

> [!TIP]
> A tabela `physical_assessments` já possui campos calculados como **BMI (IMC)**, **BMR (TMB)** e **TDEE (GET)**. Isso indica que a lógica de cálculo está sendo persistida no banco, o que é ótimo para performance de relatórios históricos.

---

## 🛠️ Visão Técnica e Arquitetura

O módulo de alunos gerencia desde a criação de contas (via Admin SDK) até o histórico detalhado de avaliações físicas, integrando permissões e vínculos entre profissionais e clientes.

### 1. Onboarding e Vínculo
- **Criação de Conta (Web)**: Utiliza a API `/api/students` que, por meio do `supabaseAdmin`, cria o usuário no Supabase Auth, gera o perfil e cria automaticamente o vínculo na tabela `coachings`.
- **Criação via RPC (Mobile)**: O app mobile utiliza uma função de banco de dados (`create_student_with_auth`) que centraliza a criação do aluno para garantir atomicidade entre Auth, Profile e Assessment Inicial.
- **Códigos de Convite**: O sistema gera códigos alfanuméricos de 6 dígitos que permitem que alunos autônomos se vinculem a um personal manualmente.

### 2. Sistema de Avaliação Física
O sistema possui uma estrutura robusta para medições, armazenada na tabela `physical_assessments`:
- **Circunferências**: Pescoço, Ombro, Tórax, Braço (relaxado e contraído), Antebraço, Cintura, Abdômen, Quadril, Coxa (proximal e medial) e Panturrilha.
- **Dobras Cutâneas**: Peitoral, Abdominal, Coxa, Tríceps, Supra-ilíaca, Subescapular e Axilar Média.
- **Registro Fotográfico**: Suporte para 4 fotos (Frente, Costas, Lateral Direita e Esquerda).

---

## ⚠️ Análise: Legado vs. Ativo (KEEP or DROP)

### 1. Tabelas de Relacionamento
- **ATIVO ✅: `coachings`**: Esta é a tabela que o código (Web e Mobile) realmente consulta para listar alunos e validar permissões.
- **LEGADO ❌: `student_professionals`**: Presente no schema Drizzle e nas migrações iniciais, mas **não é usada** pelas stores ou APIs atuais. Deve ser removida para evitar confusão.

### 2. Dados de Perfil
- **LEGADO ❌: `profiles.weight` e `profiles.height`**: Embora existam na tabela de perfis, os valores reais devem ser consumidos da tabela `physical_assessments`, que guarda o histórico temporal. Manter peso/altura fixos no perfil causa dessincronização de dados.
- **LEGADO ❌: `student_invites`**: Parece ser um resquício de um sistema de convites por email simplificado. O fluxo atual de criação direta via API ou vínculo via `invite_code` o torna redundante.

---

## 📊 Mapeamento do Banco de Dados

### Tabela Principal: `coachings`
| Coluna | Status | Função |
| :--- | :--- | :--- |
| `id` | **Ativo** | Chave primária. |
| `client_id` | **Ativo** | FK para `profiles.id` (o aluno). |
| `professional_id` | **Ativo** | FK para `profiles.id` (o personal/nutri). |
| `service_type` | **Ativo** | Define se é um vínculo de `personal_training` ou `nutrition_consulting`. |
| `status` | **Ativo** | Define se o vínculo está `active`, `pending`, ou `paused`. |

### Tabela de Histórico: `physical_assessments`
Esta tabela é o coração do acompanhamento de resultados.
- **Medições**: Todas as dobras e circunferências são numéricas (`numeric` ou `float`).
- **Imagens**: URLs do Supabase Storage para fotos de progresso.

---

## 🔍 Queries SQL para Auditoria (Supabase)

```sql
-- 1. Verificar alunos vinculados a um profissional específico e o tipo de serviço
SELECT 
    p.full_name as aluno, 
    p.email, 
    c.service_type, 
    c.status as status_vinculo
FROM coachings c
JOIN profiles p ON c.client_id = p.id
WHERE c.professional_id = 'ID_DO_PROFISSIONAL_AQUI';

-- 2. Ver a última avaliação física de cada aluno (Snapshot de progresso)
SELECT DISTINCT ON (student_id)
    student_id,
    weight,
    height,
    created_at
FROM physical_assessments
ORDER BY student_id, created_at DESC;

-- 3. Identificar se a tabela legada ainda possui dados
SELECT count(*) FROM student_professionals;
```

---

## 📖 História de Usuário: "A Jornada do Aluno"

1.  **O Convite**: O Personal André cria o perfil do Carlos via dashboard Web. O sistema dispara a criação do usuário e já cria o vínculo na tabela `coachings`.
2.  **A Primeira Dobra**: Na primeira consulta, André usa o app Mobile para registrar 7 dobras cutâneas do Carlos. Os dados caem direto em `physical_assessments`.
3.  **O Acompanhamento**: Meses depois, Carlos visualiza seu gráfico de evolução no seu próprio app. O sistema busca todas as entradas em `physical_assessments` e plota o progresso de peso e medidas.

---
*Documento gerado como parte do mapeamento técnico do sistema MeuPersonal.*
