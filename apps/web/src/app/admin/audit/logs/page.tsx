'use client';

import { supabase } from '@meupersonal/supabase';
import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  description: string;
  created_at: string;
  admin?: {
    email: string;
    full_name: string | null;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  async function loadLogs() {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('admin_audit_logs')
        .select(`
          *,
          admin:admin_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const actionTypes = Array.from(new Set(logs.map(log => log.action_type))).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando logs de auditoria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
          Logs de Auditoria
        </h1>
        <p className="text-muted-foreground">
          Rastreie ações administrativas e mudanças no sistema
        </p>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Tipo de Ação:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas as Ações</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Data</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Admin</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Ação</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Descrição</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Alvo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                      {(log.admin?.full_name || log.admin?.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-foreground">
                      {log.admin?.full_name || log.admin?.email || 'Desconhecido'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-muted text-foreground border border-border">
                    {log.action_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {log.description}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {log.target_type && (
                    <span className="font-mono text-xs">
                      {log.target_type}: {log.target_id?.slice(0, 8)}...
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  Nenhum log de auditoria encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
