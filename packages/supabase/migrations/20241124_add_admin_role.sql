-- Migration: Add Admin Role to MeuPersonal
-- Description: Adds admin account type and supporting infrastructure for platform administration
-- Author: MeuPersonal Team
-- Date: 2024-11-24

-- ============================================================================
-- PART 1: ADD ADMIN TO ACCOUNT_TYPE ENUM
-- ============================================================================

-- Add 'admin' to the account_type enum
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'admin';

-- ============================================================================
-- PART 2: UPDATE PROFILES TABLE
-- ============================================================================

-- Add admin-specific columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NULL;

-- Note: Index creation moved to RLS policies migration to avoid enum transaction issues

-- Add comments
COMMENT ON COLUMN profiles.is_super_admin IS 'Super admin with unrestricted access (cannot be deleted)';
COMMENT ON COLUMN profiles.admin_notes IS 'Internal notes about the user (visible only to admins)';
COMMENT ON COLUMN profiles.last_login_at IS 'Timestamp of last login for tracking purposes';

-- ============================================================================
-- PART 3: CREATE ADMIN_AUDIT_LOGS TABLE
-- ============================================================================

-- Table to track all admin actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'user_update', 'content_delete', 'config_change', etc.
  target_type TEXT, -- 'user', 'workout', 'diet', 'config', etc.
  target_id UUID,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_type, target_id);

-- Comment
COMMENT ON TABLE admin_audit_logs IS 'Audit trail of all actions performed by administrators';

-- ============================================================================
-- PART 4: CREATE FEATURE_FLAGS TABLE
-- ============================================================================

-- Table to control features in development
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_key TEXT UNIQUE NOT NULL,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_account_types account_type[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for enabled features
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled 
  ON feature_flags(is_enabled) 
  WHERE is_enabled = true;

-- Index for flag key lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);

-- Comment
COMMENT ON TABLE feature_flags IS 'Feature flags for controlling functionality in development';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_updated_at();

-- ============================================================================
-- PART 5: CREATE SYSTEM_SETTINGS TABLE
-- ============================================================================

-- Global platform configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for setting key lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Comment
COMMENT ON TABLE system_settings IS 'Global system configuration settings';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- ============================================================================
-- PART 6: SEED INITIAL SYSTEM SETTINGS
-- ============================================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('maintenance_mode', '{"enabled": false, "message": ""}', 'Modo de manutenção do sistema'),
  ('registration_enabled', '{"enabled": true}', 'Permitir novos cadastros de usuários'),
  ('max_students_per_professional', '{"limit": 100}', 'Limite máximo de alunos por profissional'),
  ('subscription_prices', '{"basic": 29.90, "premium": 49.90}', 'Preços das assinaturas (em R$)'),
  ('trial_period_days', '{"days": 7}', 'Período de trial em dias'),
  ('email_notifications_enabled', '{"enabled": true}', 'Habilitar notificações por email')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- PART 7: SEED INITIAL FEATURE FLAGS
-- ============================================================================

-- Insert some example feature flags
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled, rollout_percentage) VALUES
  ('new_dashboard_ui', 'New Dashboard UI', 'Novo design do dashboard com melhorias de UX', false, 0),
  ('ai_workout_generator', 'AI Workout Generator', 'Gerador de treinos com inteligência artificial', false, 0),
  ('social_feed', 'Social Feed', 'Feed social para compartilhar progresso', false, 0),
  ('challenges', 'Challenges', 'Sistema de desafios e competições', false, 0),
  ('video_calls', 'Video Calls', 'Chamadas de vídeo entre profissional e aluno', false, 0)
ON CONFLICT (flag_key) DO NOTHING;

-- ============================================================================
-- PART 8: GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users (RLS will control actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_flags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO authenticated;

-- ============================================================================
-- PART 9: ENABLE RLS
-- ============================================================================

-- Enable Row Level Security on new tables
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTES
-- ============================================================================

-- After running this migration:
-- 1. Run the RLS policies migration (20241124_admin_rls_policies.sql)
-- 2. Create your first admin user manually:
--    UPDATE profiles SET account_type = 'admin', is_super_admin = true WHERE email = 'your@email.com';
-- 3. Test admin authentication and permissions
