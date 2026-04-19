# Módulo [NOME] — Documentação Técnica

![Status](https://img.shields.io/badge/status-planejado-8B9BB4)

> **C4 Nível 3** — Componentes internos deste módulo.
> Para a visão geral do sistema: [docs/README.md](../../README.md)
> Para os PRDs deste módulo: [docs/PRDs/.../README.md](../../PRDs/)

---

## Visão geral do módulo

> O que este módulo faz, qual problema resolve, quem o usa.

```mermaid
graph TB
    %% Adicionar diagrama C4 nível 3 aqui
    %% Mostrar: componentes internos, dependências externas, banco de dados
```

---

## C4 Nível 3 — Componentes

### [Componente 1]
**Responsabilidade:**
**Modelo/Tecnologia:**
**Input / Output:**

### [Componente 2]
...

---

## Fluxos principais

### Fluxo 1 — [Nome do fluxo]

```mermaid
sequenceDiagram
    %% Usar swimlanes para mostrar quem faz o quê
    %% Atores: usuário, UI, API, banco, serviço externo
```

### Fluxo 2 — [Nome do fluxo]
...

---

## Ciclos de vida (state diagrams)

```mermaid
stateDiagram-v2
    %% Mostrar estados possíveis da entidade principal deste módulo
    %% Ex: status de assinatura, status de check-in, status do plano
```

---

## Todos os endpoints

| Endpoint | Método | Tipo | Auth |
|---|---|---|---|
| `/api/...` | POST/GET | REST/SSE | role |

---

## Tabelas do banco

| Tabela | Operação | RLS |
|---|---|---|
| `nome_tabela` | SELECT, INSERT, UPDATE | descrição da política |

---

## Regras inegociáveis

1. Regra crítica 1
2. Regra crítica 2

---

## Links de referência

| Recurso | Link |
|---|---|
| PRD | [PRDs/.../nome.md]() |
| Schema | [SYSTEM_MAPPING.md](../../SYSTEM_MAPPING.md) |
