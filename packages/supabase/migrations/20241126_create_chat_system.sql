-- Create Chat System Tables
-- This migration creates the necessary tables for real-time chat between personal trainers and students

-- Conversations table
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  personal_id uuid references profiles(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  
  unique(personal_id, student_id)
);

-- Chat messages table
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  message_type text default 'text' check (message_type in ('text', 'image', 'audio', 'file')),
  media_url text,
  read_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_conversations_personal on conversations(personal_id);
create index if not exists idx_conversations_student on conversations(student_id);
create index if not exists idx_conversations_last_message on conversations(last_message_at desc);

create index if not exists idx_chat_messages_conversation on chat_messages(conversation_id);
create index if not exists idx_chat_messages_sender on chat_messages(sender_id);
create index if not exists idx_chat_messages_receiver on chat_messages(receiver_id);
create index if not exists idx_chat_messages_created on chat_messages(created_at desc);
create index if not exists idx_chat_messages_unread on chat_messages(receiver_id, read_at) where read_at is null;

-- Enable Row Level Security
alter table conversations enable row level security;
alter table chat_messages enable row level security;

-- RLS Policies for conversations
create policy "Users can view their own conversations"
  on conversations for select
  using (
    auth.uid() = personal_id or 
    auth.uid() = student_id
  );

create policy "Users can create conversations with their linked contacts"
  on conversations for insert
  with check (
    auth.uid() = personal_id or 
    auth.uid() = student_id
  );

-- RLS Policies for chat_messages
create policy "Users can view messages in their conversations"
  on chat_messages for select
  using (
    exists (
      select 1 from conversations
      where conversations.id = chat_messages.conversation_id
      and (conversations.personal_id = auth.uid() or conversations.student_id = auth.uid())
    )
  );

create policy "Users can send messages in their conversations"
  on chat_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations
      where conversations.id = conversation_id
      and (conversations.personal_id = auth.uid() or conversations.student_id = auth.uid())
    )
  );

create policy "Users can update their own messages (for read receipts)"
  on chat_messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Function to update conversation last_message_at
create or replace function update_conversation_timestamp()
returns trigger as $$
begin
  update conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update conversation timestamp on new message
drop trigger if exists on_message_created on chat_messages;
create trigger on_message_created
  after insert on chat_messages
  for each row
  execute function update_conversation_timestamp();

-- Function to get unread message count
create or replace function get_unread_count(user_id uuid)
returns table (conversation_id uuid, unread_count bigint) as $$
begin
  return query
  select 
    cm.conversation_id,
    count(*) as unread_count
  from chat_messages cm
  where cm.receiver_id = user_id
    and cm.read_at is null
  group by cm.conversation_id;
end;
$$ language plpgsql security definer;

-- Enable realtime for chat_messages
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table conversations;

-- Comments
comment on table conversations is 'Stores chat conversations between personal trainers and students';
comment on table chat_messages is 'Stores individual chat messages with support for different media types';
comment on function get_unread_count is 'Returns unread message count per conversation for a user';
