-- Adds persistent planning state to AI chat sessions.
-- Stores stage (periodization vs workouts) and list of saved workouts so the
-- AI never loses context between requests even when message history is capped.

ALTER TABLE ai_chat_sessions
  ADD COLUMN IF NOT EXISTS state jsonb DEFAULT '{}'::jsonb;
