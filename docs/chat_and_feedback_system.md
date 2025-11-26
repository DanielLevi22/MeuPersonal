# Chat & Workout Feedback System

## Overview
Sistema de comunicação em tempo real entre personal trainer e aluno, com feedback detalhado de treinos para melhorar o acompanhamento e engajamento.

## 🎯 Objetivos

### Chat System
- Comunicação direta e instantânea entre personal e aluno
- Suporte a mensagens de texto, imagens e áudios
- Notificações push para novas mensagens
- Indicadores de leitura e digitação
- Histórico completo de conversas

### Workout Feedback
- Feedback pós-treino com múltiplas dimensões
- Sistema de avaliação (dificuldade, energia, satisfação)
- Comentários e observações do aluno
- Analytics para o personal visualizar tendências
- Histórico de feedback por treino

## 📊 Database Schema

### Chat Messages Table
```sql
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  sender_id uuid references profiles(id) not null,
  receiver_id uuid references profiles(id) not null,
  content text not null,
  message_type text default 'text', -- 'text', 'image', 'audio', 'file'
  media_url text,
  read_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_chat_messages_conversation on chat_messages(conversation_id);
create index idx_chat_messages_sender on chat_messages(sender_id);
create index idx_chat_messages_receiver on chat_messages(receiver_id);
create index idx_chat_messages_created on chat_messages(created_at desc);
```

### Conversations Table
```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  personal_id uuid references profiles(id) not null,
  student_id uuid references profiles(id) not null,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  
  unique(personal_id, student_id)
);

create index idx_conversations_personal on conversations(personal_id);
create index idx_conversations_student on conversations(student_id);
```

### Workout Feedback Table
```sql
create table workout_feedback (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid references workout_logs(id) not null,
  student_id uuid references profiles(id) not null,
  
  -- Ratings (1-5)
  difficulty_rating int check (difficulty_rating between 1 and 5),
  energy_level int check (energy_level between 1 and 5),
  satisfaction_rating int check (satisfaction_rating between 1 and 5),
  
  -- Mood/Feeling
  mood text, -- 'great', 'good', 'ok', 'tired', 'exhausted'
  
  -- Comments
  notes text,
  exercises_notes jsonb, -- { "exercise_id": "note" }
  
  -- Metrics
  perceived_exertion int check (perceived_exertion between 1 and 10), -- RPE scale
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_workout_feedback_log on workout_feedback(workout_log_id);
create index idx_workout_feedback_student on workout_feedback(student_id);
```

## 🎨 UI/UX Design

### Chat Interface

#### Mobile
```
┌─────────────────────────┐
│ ← João Silva         ⋮  │ Header
├─────────────────────────┤
│                         │
│  Oi! Como foi o treino? │ Personal
│  10:30                  │
│                         │
│         Foi ótimo! 💪   │ Student
│         Consegui fazer  │
│         todas as séries │
│                  10:32  │
│                         │
│  Parabéns! 🎉          │ Personal
│  10:33                  │
│                         │
├─────────────────────────┤
│ 📎  [Type message...]  │ Input
└─────────────────────────┘
```

#### Web
```
┌──────────────────────────────────────────┐
│  Conversas                               │
├──────────┬───────────────────────────────┤
│ 🟢 João  │ João Silva                    │
│   Silva  │ ────────────────────────────  │
│   10:33  │                               │
│          │ Oi! Como foi o treino?        │
│ 🔴 Maria │ 10:30                          │
│   Costa  │                               │
│   09:15  │ Foi ótimo! 💪                 │
│          │ Consegui fazer todas as...    │
│ Ana Lima │ 10:32                          │
│   Ontem  │                               │
│          │ Parabéns! 🎉                  │
│          │ 10:33                          │
│          │                               │
│          │ ─────────────────────────────  │
│          │ 📎 [Type message...]    Send  │
└──────────┴───────────────────────────────┘
```

### Workout Feedback Interface

```
┌─────────────────────────────────────┐
│  Como foi seu treino?               │
│                                     │
│  Dificuldade                        │
│  ⭐⭐⭐⭐☆                          │
│                                     │
│  Nível de Energia                   │
│  ⚡⚡⚡☆☆                          │
│                                     │
│  Satisfação                         │
│  😊😊😊😊😊                        │
│                                     │
│  Como você se sentiu?               │
│  [😊 Ótimo] [😐 Ok] [😫 Cansado]  │
│                                     │
│  Observações (opcional)             │
│  ┌─────────────────────────────┐   │
│  │ Consegui aumentar a carga   │   │
│  │ no supino!                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Exercícios específicos             │
│  • Supino Reto: Muito bom! ✓       │
│  • Crucifixo: Um pouco difícil      │
│                                     │
│  [Enviar Feedback]                  │
└─────────────────────────────────────┘
```

## 🔐 Security & Permissions

### RLS Policies

**Chat Messages:**
- Students can only see messages in their conversations
- Professionals can only see messages with their students
- Users can only send messages to their linked contacts

**Workout Feedback:**
- Students can create/edit their own feedback
- Professionals can view feedback from their students
- Feedback is read-only after 24 hours

## 🚀 Features

### Chat
- [x] Real-time messaging with Supabase Realtime
- [x] Typing indicators
- [x] Read receipts
- [x] Unread message badges
- [x] Message timestamps
- [ ] Image sharing
- [ ] Audio messages
- [ ] File attachments
- [ ] Message reactions (👍, ❤️, etc.)
- [ ] Search in conversations

### Workout Feedback
- [x] Multi-dimensional ratings
- [x] Mood/energy tracking
- [x] Exercise-specific notes
- [x] RPE (Rate of Perceived Exertion) scale
- [x] Feedback history
- [ ] Feedback analytics dashboard
- [ ] Trend charts
- [ ] Automatic insights (AI-powered)
- [ ] Comparison with previous workouts

## 📱 Implementation Strategy

### Phase 1: Database & Backend
1. Create tables and RLS policies
2. Set up Realtime subscriptions
3. Create helper functions

### Phase 2: Mobile Chat
1. Create chat store (Zustand)
2. Build ChatScreen with message list
3. Implement real-time updates
4. Add typing indicators

### Phase 3: Mobile Feedback
1. Add feedback button to workout completion
2. Create FeedbackModal with ratings
3. Save feedback to database
4. Show feedback history

### Phase 4: Web Implementation
1. Create chat module pages
2. Build ChatWindow component
3. Create feedback analytics dashboard
4. Add feedback timeline view

### Phase 5: Polish & Testing
1. Add loading states
2. Error handling
3. Offline support
4. Push notifications
5. Performance optimization

## 🎯 Success Metrics
- 80%+ of students leave feedback after workouts
- Average response time < 5 minutes
- 90%+ message delivery success rate
- Positive user feedback on communication quality
