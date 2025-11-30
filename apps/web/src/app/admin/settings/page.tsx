
'use client';

import { supabase } from '@meupersonal/supabase';
import { useEffect, useState } from 'react';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage: number;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'features'>('general');
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      
      const [settingsResult, flagsResult] = await Promise.all([
        supabase.from('system_settings').select('*').order('setting_key'),
        supabase.from('feature_flags').select('*').order('flag_key')
      ]);

      if (settingsResult.error) throw settingsResult.error;
      if (flagsResult.error) throw flagsResult.error;

      setSettings(settingsResult.data || []);
      setFeatureFlags(flagsResult.data || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateSetting(key: string, value: any) {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;

      setSettings(prev => prev.map(s => 
        s.setting_key === key ? { ...s, setting_value: value } : s
      ));
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Failed to update setting');
    }
  }

  async function toggleFeatureFlag(id: string, currentState: boolean) {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: !currentState })
        .eq('id', id);

      if (error) throw error;

      setFeatureFlags(prev => prev.map(f => 
        f.id === id ? { ...f, is_enabled: !currentState } : f
      ));
    } catch (error) {
      console.error('Error updating feature flag:', error);
      alert('Failed to update feature flag');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie configurações do sistema e feature flags
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-border">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-4 px-4 font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Configurações Gerais
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`pb-4 px-4 font-medium border-b-2 transition-colors ${
            activeTab === 'features'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Feature Flags
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="grid gap-6">
          {settings.map((setting) => (
            <div key={setting.id} className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground capitalize">
                    {setting.setting_key.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
              </div>

              <div className="mt-4">
                {setting.setting_key === 'maintenance_mode' && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.setting_value.enabled}
                        onChange={(e) => updateSetting(setting.setting_key, { ...setting.setting_value, enabled: e.target.checked })}
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-foreground">Ativar Modo de Manutenção</span>
                    </label>
                    {setting.setting_value.enabled && (
                      <input
                        type="text"
                        value={setting.setting_value.message}
                        onChange={(e) => updateSetting(setting.setting_key, { ...setting.setting_value, message: e.target.value })}
                        placeholder="Mensagem de manutenção..."
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                      />
                    )}
                  </div>
                )}

                {setting.setting_key === 'registration_enabled' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setting.setting_value.enabled}
                      onChange={(e) => updateSetting(setting.setting_key, { ...setting.setting_value, enabled: e.target.checked })}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">Permitir Novos Registros</span>
                  </label>
                )}

                {setting.setting_key === 'max_students_per_professional' && (
                  <div className="flex items-center gap-4">
                    <label className="text-foreground">Limite:</label>
                    <input
                      type="number"
                      value={setting.setting_value.limit}
                      onChange={(e) => updateSetting(setting.setting_key, { ...setting.setting_value, limit: parseInt(e.target.value) })}
                      className="w-32 px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>
                )}

                {setting.setting_key === 'subscription_prices' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Preço Assinatura Básica (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={setting.setting_value.basic}
                        onChange={(e) => updateSetting(setting.setting_key, { ...setting.setting_value, basic: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Preço Assinatura Premium (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={setting.setting_value.premium}
                        onChange={(e) => updateSetting(setting.setting_key, { ...setting.setting_value, premium: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {settings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma configuração encontrada. Por favor, execute a migração.
            </div>
          )}
        </div>
      )}

      {/* Feature Flags */}
      {activeTab === 'features' && (
        <div className="grid gap-6">
          {featureFlags.map((flag) => (
            <div key={flag.id} className="bg-surface border border-border rounded-xl p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-foreground">{flag.flag_name}</h3>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                    {flag.flag_key}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{flag.description}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <p className="text-sm font-medium text-foreground">Rollout</p>
                  <p className="text-sm text-muted-foreground">{flag.rollout_percentage}%</p>
                </div>
                <button
                  onClick={() => toggleFeatureFlag(flag.id, flag.is_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    flag.is_enabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      flag.is_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}

          {featureFlags.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma feature flag encontrada.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
