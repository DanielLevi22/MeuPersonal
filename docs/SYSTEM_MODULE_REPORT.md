# Análise Completa: Módulo de Sistema (Admin & Config)

Este documento detalha as ferramentas de controle de infraestrutura, funcionalidades dinâmicas e acesso por planos.

---

## 🛠️ Visão Técnica e Arquitetura

O sistema utiliza uma camada de controle para permitir mudanças no comportamento do app sem necessidade de novos deploys.

### 1. Feature Flags (`feature_flags`)
- **Controle Dinâmico**: Permite ligar ou desligar módulos inteiros (como o Chat ou IA) via dashboard de admin.
- **Rollout**: A coluna `rollout_percentage` sugere uma intenção de habilitar funções gradualmente para a base de usuários (ex: liberar a nova dieta para apenas 10% dos usuários primeiro).

### 2. Controle de Acesso (`feature_access`)
- **Tiers/Planos**: O sistema diferencia o que usuários `Free`, `Basic` e `Pro` podem fazer.
- **Limites**: Controla variáveis como "Máximo de Alunos" ou "Máximo de Dietas Ativas". Se a `limit_value` for NULL, o acesso é ilimitado para aquele tier.

---

## ⚠️ Análise: Legado vs. Ativo

- **ATIVO ✅**: `feature_flags`, `feature_access`.
- **DICA 🧹**: Atualmente, as Feature Flags parecem ser globais (para todos os usuários). Seria útil adicionar uma coluna `target_user_ids` para testes beta com usuários específicos.

---

## 📊 Mapeamento do Banco de Dados

### Tabela: `feature_flags`
| Coluna | Tipo | Função |
| :--- | :--- | :--- |
| `flag_key` | text | Chave técnica (ex: `enable-ai-workouts`). |
| `is_enabled` | boolean | Chave mestre (ON/OFF). |
| `rollout_percentage` | integer | % de usuários afetados. |

### Tabela: `feature_access`
| Coluna | Tipo | Atributo |
| :--- | :--- | :--- |
| `subscription_tier` | text | free, basic, pro, elite. |
| `feature_key` | text | Link com a funcionalidade. |
| `limit_value` | integer | Limite numérico (ex: 5 alunos). |

---

## 🔍 SQL para Auditoria
```sql
-- Listar funcionalidades bloqueadas para usuários "Free"
SELECT feature_key, limit_value
FROM feature_access
WHERE subscription_tier = 'free' AND is_enabled = false;
```

---
*Documento gerado como parte do mapeamento técnico do sistema MeuPersonal.*
