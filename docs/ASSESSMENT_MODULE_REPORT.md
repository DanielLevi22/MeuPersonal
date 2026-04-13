# Análise Completa: Módulo de Avaliação (Assessment)

Este documento detalha o sistema de coleta de dados biométricos, questionários de saúde e análise por IA.

---

## 🛠️ Visão Técnica e Arquitetura

O módulo de avaliação combina dados tradicionais (Anamnese) com tecnologia de ponta (Visão Computacional).

### 1. Anamnese Digital (`student_anamnesis`)
Diferente das tabelas rígidas, a Anamnese é flexível:
- **Respostas**: Salvas em um objeto **JSONB (`responses`)**. Isso permite que o profissional adicione perguntas como "Você tem alergia a glúten?" ou "Qual sua cirurgia anterior?" sem mudar o banco.
- **Estado**: Controla se o aluno já completou (`completed_at`) o questionário inicial obrigatório.

### 2. AI Body Scan (Análise de Imagem)
Este é um recurso premium integrado ao Mobile:
- **Fluxo**: O aluno envia as 4 fotos padrão (Frente, Costas, Laterais).
- **IA**: O `AIBodyScanService` processa essas imagens e retorna um objeto `BodyScanResult` contendo estimativa de percentual de gordura visual e análise postural.
- **Storage**: As fotos são armazenadas no bucket do Supabase e vinculadas ao registro de avaliação do aluno.

---

## ⚠️ Análise: Legado vs. Ativo

- **ATIVO ✅**: `student_anamnesis`, integração com `AIBodyScanService`.
- **DICA 🧹**: Os dados de percentual de gordura gerados pela IA devem ser conciliados com os dados manuais (Pollock/7 dobras) inseridos no módulo de **Students**. Atualmente, eles vivem em registros separados em `physical_assessments`.

---

## 📊 Mapeamento do Banco de Dados

### Tabela: `student_anamnesis`
| Coluna | Tipo | Função |
| :--- | :--- | :--- |
| `student_id` | uuid | FK do Aluno (PK/Unique). |
| `responses` | jsonb | O dicionário completo de perguntas e respostas. |
| `completed_at` | timestamp| Quando o questionário foi finalizado. |

---

## 🔍 SQL para Auditoria
```sql
-- Verificar alunos que ainda não responderam a anamnese
SELECT p.full_name, p.email
FROM profiles p
LEFT JOIN student_anamnesis sa ON sa.student_id = p.id
WHERE sa.id IS NULL AND p.account_type = 'student';
```

---
*Documento gerado como parte do mapeamento técnico do sistema MeuPersonal.*
