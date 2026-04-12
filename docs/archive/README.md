# MeuPersonal — Documentação Central

Este é o único diretório de documentação do monorepo. Toda a documentação técnica, arquitetural, de produto e de processo vive aqui.

---

## 📁 Estrutura

```
docs/
├── architecture/           # Arquitetura modular (mobile e web)
│   ├── mobile-modules.md
│   └── web-modules.md
├── migrations/             # Guias de migração de banco de dados
│   └── account_status_migration_guide.md
│
├── ARCHITECTURE_MASTERPLAN.md   # Visão macro da arquitetura do sistema
├── AI_MANDATORY_RULES.md        # Regras obrigatórias para features de IA
├── CASL_GUIDE.md                # Controle de acesso baseado em CASL
├── CHECKLIST.md                 # Checklists de desenvolvimento
├── MONOREPO.md                  # Estrutura e convenções do monorepo
├── PROJECT_STATUS.md            # Status atual do projeto
├── WORKFLOW.md                  # Fluxo de desenvolvimento em equipe
├── decisions.md                 # Registro de decisões técnicas
│
├── architecture.md              # Stack, estrutura de pastas, fluxo de dados
├── architecture_strategy.md     # Estratégia arquitetural de longo prazo
├── ddd_architecture_proposal.md # Proposta de arquitetura DDD
│
├── access_control.md            # Controle de acesso e permissões (CASL + RLS)
├── admin_system.md              # Sistema administrativo
├── admin_system_design_full.md  # Design completo do sistema admin
├── best_practices.md            # Diretrizes e padrões (leia primeiro)
├── business_rules.md            # Regras de negócio e atores do sistema
│
├── design_system.md             # Sistema de design (Energy Gradient)
├── mobile_redesign_plan.md      # Plano de redesign mobile
│
├── features.md                  # Funcionalidades implementadas
├── features_overview.md         # Visão geral de todas as features
├── engagement_features.md       # Features de engajamento
├── gamification_design.md       # Design do sistema de gamificação
├── chat_and_feedback_system.md  # Sistema de chat e feedback
├── professional_approval_system.md # Sistema de aprovação de profissionais
│
├── ai_features_roadmap.md       # Roadmap de features de IA
├── ai_implementation_status.md  # Status de implementação das features de IA
├── ai_pilot_vision.md           # Visão do piloto de IA
├── 3d_heatmap_strategy.md       # Estratégia do heatmap 3D
│
├── nutrition-spec.md            # Especificação do módulo de nutrição
├── nutrition-updates.md         # Atualizações do módulo de nutrição
├── walkthrough-student-nutrition.md # Walkthrough: fluxo nutricional do aluno
│
├── complete_database_architecture.md  # Arquitetura completa do banco
├── database-schema.md           # Schema do banco de dados
├── database_analysis.md         # Análise do banco de dados
├── database_restructuring_plan.md     # Plano de reestruturação do banco
├── periodization_proposal.md    # Proposta de periodização de treinos
│
├── migration_guide.md           # Guia de migração (StyleSheet → Tailwind)
├── tanstack_query_evaluation.md # Avaliação e adoção do TanStack Query
├── roadmap.md                   # Roadmap de desenvolvimento
├── suggestions_roadmap.md       # Roadmap de sugestões
│
├── code_update_action_plan.md   # Plano de ação para atualizações de código
└── files_to_update.md           # Arquivos pendentes de atualização
```

---

## 🚀 Por onde começar

| Objetivo | Documento |
|---|---|
| Entender o projeto como um todo | [ARCHITECTURE_MASTERPLAN.md](./ARCHITECTURE_MASTERPLAN.md) |
| Configurar o ambiente | [MONOREPO.md](./MONOREPO.md) |
| Fluxo de desenvolvimento | [WORKFLOW.md](./WORKFLOW.md) |
| Boas práticas de código | [best_practices.md](./best_practices.md) |
| Regras de negócio | [business_rules.md](./business_rules.md) |
| Features implementadas | [features.md](./features.md) |
| Status atual | [PROJECT_STATUS.md](./PROJECT_STATUS.md) |
| Trabalhar com IA | [AI_MANDATORY_RULES.md](./AI_MANDATORY_RULES.md) |

---

> **Nota:** O guia operacional para sessões de pair programming com o agente está em [`CLAUDE.md`](../CLAUDE.md) na raiz do monorepo.

**Última atualização:** 2026-04-09
