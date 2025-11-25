-- Migration: 20241125_admin_settings_tables.sql

-- Enable UUID extension if not already enabled (usually is, but good practice)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Feature Flags
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

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled) WHERE is_enabled = true;
COMMENT ON TABLE feature_flags IS 'Feature flags para controle de funcionalidades em desenvolvimento';

-- 2. Tabela de Configurações Globais
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- 3. Seed de configurações iniciais (Use ON CONFLICT to avoid errors on re-run)
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('maintenance_mode', '{"enabled": false, "message": ""}', 'Modo de manutenção'),
  ('registration_enabled', '{"enabled": true}', 'Permitir novos cadastros'),
  ('max_students_per_professional', '{"limit": 100}', 'Limite de alunos por profissional'),
  ('subscription_prices', '{"basic": 29.90, "premium": 49.90}', 'Preços das assinaturas')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Feature Flags: Everyone can read enabled flags (or all flags? usually public needs to know feature availability)
-- For security, maybe only authenticated users can read? Or public?
-- Let's allow public read for now as the app might need to know before login.
CREATE POLICY "Public can view feature flags"
  ON feature_flags FOR SELECT
  USING (true);

-- Admins can manage feature flags
CREATE POLICY "Admins can manage feature flags"
  ON feature_flags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- System Settings: Public can read (needed for maintenance mode check)
CREATE POLICY "Public can view system settings"
  ON system_settings FOR SELECT
  USING (true);

-- Admins can manage system settings
CREATE POLICY "Admins can manage system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );
