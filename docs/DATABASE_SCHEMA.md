# Database Schema — MeuPersonal

> Documento vivo. Atualizado a cada módulo discutido.
> **Fonte da verdade** para geração das migrations — nenhuma migration é escrita antes de todos os módulos estarem completos e aprovados.

---

## Como ler este documento

Este arquivo é o índice. Cada módulo tem seu próprio arquivo em `docs/schema/` com:
- Os campos e seus tipos
- O **porquê** de cada decisão — não apenas o quê
- O que foi **explicitamente rejeitado** e por quê
- As **relações** com outros módulos

As decisões refletem discussões reais entre Daniel e o agente. O objetivo é que qualquer pessoa (ou sessão futura) consiga entender o raciocínio por trás de cada escolha sem precisar revisar o histórico de conversas.

---

## Status dos módulos

| Módulo | Status | Arquivo |
|--------|--------|---------|
| **Auth** | ✅ Aprovado | [schema/auth.md](schema/auth.md) |
| **Students** | ✅ Aprovado (emendado) | [schema/students.md](schema/students.md) |
| **Assessment** | ✅ Aprovado | [schema/assessment.md](schema/assessment.md) |
| **Nutrition** | ✅ Aprovado | [schema/nutrition.md](schema/nutrition.md) |
| **Workouts** | ✅ Aprovado | [schema/workouts.md](schema/workouts.md) |
| **Gamification** | ✅ Aprovado | [schema/gamification.md](schema/gamification.md) |
| **Chat** | ❌ Removido do escopo | — |
| **System** | ⏳ Pendente | [schema/system.md](schema/system.md) |

---

## Enums — tipos fixos do banco

Todos os campos com valores predefinidos usam enum PostgreSQL. Valor inválido é rejeitado no banco, sem depender de validação na aplicação.

| Enum | Valores | Usado em |
|------|---------|---------|
| `account_type` | `admin \| specialist \| student \| member` | `profiles.account_type` |
| `account_status` | `active \| inactive \| invited` | `profiles.account_status` |
| `service_type` | `personal_training \| nutrition_consulting` | `specialist_services.service_type`, `student_specialists.service_type` |
| `link_status` | `active \| inactive` | `student_specialists.status` |
| `consent_type` | `health_data_collection` | `student_consents.consent_type` |
| `training_status` | `planned \| active \| completed` | `training_periodizations.status`, `training_plans.status` |
| `workout_difficulty` | `beginner \| intermediate \| advanced` | `workouts.difficulty` |
| `day_of_week` | `monday \| tuesday \| wednesday \| thursday \| friday \| saturday \| sunday` | `workouts.day_of_week` |

| `diet_plan_status` | `active \| finished` | `diet_plans.status` |
| `diet_plan_type` | `unique \| cyclic` | `diet_plans.plan_type` |

> Módulos pendentes (`gamification`, `chat`, `system`) adicionarão seus enums aqui ao serem aprovados.

---

## Visão geral das tabelas

Uma vez que todos os módulos estejam aprovados, esta seção será preenchida com o mapa completo de tabelas e relações entre módulos.
