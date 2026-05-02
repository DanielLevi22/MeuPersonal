-- AI Student Coach — Phase 1
-- Adds coach_mode and persona_track to profiles.
-- Makes ai_chat_sessions.specialist_id nullable so student-self sessions can exist.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS coach_mode text DEFAULT 'express'
    CHECK (coach_mode IN ('express', 'analytical'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS persona_track text DEFAULT 'beginner'
    CHECK (persona_track IN ('beginner', 'returning', 'intermediate', 'advanced'));

-- Student-initiated coach sessions have no specialist
ALTER TABLE ai_chat_sessions
  ALTER COLUMN specialist_id DROP NOT NULL;
