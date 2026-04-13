# Análise Completa: Módulo de Chat

Este documento detalha a arquitetura de comunicação em tempo real entre Profissionais e Alunos.

---

## 🛠️ Visão Técnica e Arquitetura

O chat é construído sobre o Supabase Realtime, permitindo trocas instantâneas de mensagens e mídia.

### 1. Estrutura de Conversas (`conversations`)
- Gerencia o par de usuários (Personal e Aluno).
- **Vínculo**: Cada conversa é única para um par Personal-Aluno, evitando duplicidade de canais.
- **Metadados**: Armazena o `last_message_at` para ordenação eficiente na lista de chats.

### 2. Mensageria (`messages`)
- **Tipos de Mídia**: Suporta `text`, `image`, `audio` e `file`.
- **Status de Leitura**: O campo `read_at` (timestamp) indica se o destinatário visualizou a mensagem.
- **Relacionamento**: Cada mensagem pertence a uma `conversation_id` e aponta para um `sender_id` e `receiver_id`.

---

## ⚠️ Análise: Legado vs. Ativo

- **ATIVO ✅**: Tabelas `conversations` e `messages`.
- **DICA 🧹**: As mensagens de áudio e imagem dependem do Supabase Storage. É importante auditar se o bucket de storage está limpando arquivos de mensagens deletadas (atualmente parece não haver um trigger para isso).

---

## 📊 Mapeamento do Banco de Dados

### Tabela: `conversations`
| Coluna | Tipo | Função |
| :--- | :--- | :--- |
| `id` | uuid | PK. |
| `personal_id` | uuid | FK para o profissional. |
| `student_id` | uuid | FK para o aluno. |
| `last_message_at` | timestamp | Usado para o "Top 1" da lista. |

### Tabela: `messages`
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `conversation_id` | uuid | Vínculo com a conversa. |
| `content` | text | Conteúdo da mensagem. |
| `message_type` | text | enum: text, image, audio, file. |
| `media_url` | text | Link para o arquivo no Storage. |
| `read_at` | timestamp | Null = Não lida. |

---

## 🔍 SQL para Auditoria
```sql
-- Mensagens não lidas por aluno
SELECT p.full_name, count(m.id) as pendentes
FROM messages m
JOIN profiles p ON m.sender_id = p.id
WHERE m.read_at IS NULL
GROUP BY p.full_name;
```

---
*Documento gerado como parte do mapeamento técnico do sistema MeuPersonal.*
