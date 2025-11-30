-- Migration: Semantic Renaming - Gamification & Communication
-- Description: Rename gamification and communication tables
-- Date: 2025-11-29
-- Phase: 2 - Semantic Renaming

-- ============================================================================
-- GAMIFICATION CONTEXT
-- ============================================================================

-- Rename student_streaks to streaks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_streaks') THEN
    ALTER TABLE student_streaks RENAME TO streaks;
    
    -- Update indexes
    ALTER INDEX IF EXISTS idx_student_streaks_student RENAME TO idx_streaks_student;
    
    RAISE NOTICE '✓ Renamed student_streaks to streaks';
  ELSE
    RAISE NOTICE 'Table student_streaks does not exist, skipping';
  END IF;
END $$;

-- Rename leaderboard_scores to ranking_scores
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leaderboard_scores') THEN
    ALTER TABLE leaderboard_scores RENAME TO ranking_scores;
    
    -- Update indexes
    ALTER INDEX IF EXISTS idx_leaderboard_scores_student RENAME TO idx_ranking_scores_student;
    ALTER INDEX IF EXISTS idx_leaderboard_scores_score RENAME TO idx_ranking_scores_score;
    
    RAISE NOTICE '✓ Renamed leaderboard_scores to ranking_scores';
  ELSE
    RAISE NOTICE 'Table leaderboard_scores does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- COMMUNICATION CONTEXT
-- ============================================================================

-- Rename chat_messages to messages
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    ALTER TABLE chat_messages RENAME TO messages;
    
    -- Update indexes
    ALTER INDEX IF EXISTS idx_chat_messages_conversation RENAME TO idx_messages_conversation;
    ALTER INDEX IF EXISTS idx_chat_messages_sender RENAME TO idx_messages_sender;
    ALTER INDEX IF EXISTS idx_chat_messages_receiver RENAME TO idx_messages_receiver;
    ALTER INDEX IF EXISTS idx_chat_messages_created RENAME TO idx_messages_created;
    ALTER INDEX IF EXISTS idx_chat_messages_unread RENAME TO idx_messages_unread;
    
    RAISE NOTICE '✓ Renamed chat_messages to messages';
  ELSE
    RAISE NOTICE 'Table chat_messages does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_gamification_count INTEGER := 0;
  v_communication_count INTEGER := 0;
BEGIN
  -- Count gamification tables
  SELECT COUNT(*) INTO v_gamification_count
  FROM information_schema.tables
  WHERE table_name IN ('streaks', 'ranking_scores');
  
  -- Count communication tables
  SELECT COUNT(*) INTO v_communication_count
  FROM information_schema.tables
  WHERE table_name = 'messages';
  
  RAISE NOTICE '✓ Gamification tables renamed: %', v_gamification_count;
  RAISE NOTICE '✓ Communication tables renamed: %', v_communication_count;
  RAISE NOTICE '✓ Gamification & Communication renaming completed!';
END $$;
