-- AI Chat Sessions and Messages
-- Used by the AI Coach Chat feature (specialist ↔ IA multi-agent)

CREATE TABLE ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module text NOT NULL DEFAULT 'workout' CHECK (module IN ('workout', 'nutrition', 'general')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX ai_chat_sessions_student_id_idx ON ai_chat_sessions (student_id);
CREATE INDEX ai_chat_sessions_specialist_id_idx ON ai_chat_sessions (specialist_id);
CREATE INDEX ai_chat_messages_session_id_idx ON ai_chat_messages (session_id);

-- RLS
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Specialist can only see sessions they own
CREATE POLICY "specialist_own_sessions" ON ai_chat_sessions
  FOR ALL USING (specialist_id = auth.uid());

-- Messages visible if the session belongs to the specialist
CREATE POLICY "specialist_own_messages" ON ai_chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions s
      WHERE s.id = ai_chat_messages.session_id
        AND s.specialist_id = auth.uid()
    )
  );

-- Auto-update updated_at on sessions
CREATE OR REPLACE FUNCTION update_ai_chat_session_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE ai_chat_sessions SET updated_at = now() WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_chat_messages_update_session
  AFTER INSERT ON ai_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_ai_chat_session_timestamp();
