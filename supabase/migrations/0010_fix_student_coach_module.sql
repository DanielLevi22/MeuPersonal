-- Fix ai_chat_sessions.module constraint: consolidate to single student_coach value
ALTER TABLE ai_chat_sessions
  DROP CONSTRAINT IF EXISTS ai_chat_sessions_module_check;

ALTER TABLE ai_chat_sessions
  ADD CONSTRAINT ai_chat_sessions_module_check
    CHECK (module IN ('workout', 'nutrition', 'general', 'student_coach'));
