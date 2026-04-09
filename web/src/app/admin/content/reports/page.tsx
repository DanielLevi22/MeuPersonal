'use client';

import { supabase } from '@meupersonal/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: {
    email: string;
    full_name: string | null;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  async function loadReports() {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('content_reports')
        .select(`
          *,
          reporter:reporter_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: 'resolved' | 'dismissed') {
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({ 
          status: newStatus,
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

      if (error) throw error;

      setReports(prev => prev.map(report => 
        report.id === id ? { ...report, status: newStatus } : report
      ));
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Falha ao atualizar status do relatório');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
          Relatórios de Conteúdo
        </h1>
        <p className="text-muted-foreground">
          Revise e gerencie conteúdo reportado
        </p>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendente</option>
            <option value="resolved">Resolvido</option>
            <option value="dismissed">Dispensado</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    report.target_type === 'exercise' ? 'bg-blue-500/20 text-blue-400' :
                    report.target_type === 'food' ? 'bg-green-500/20 text-green-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {report.target_type === 'exercise' ? 'exercício' : report.target_type === 'food' ? 'alimento' : report.target_type}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Reportado por {report.reporter?.full_name || report.reporter?.email || 'Desconhecido'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    • {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Motivo: {report.reason}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ID do Alvo: {report.target_id}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                  report.status === 'resolved' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                  report.status === 'dismissed' ? 'bg-gray-500/20 text-gray-400 border-gray-500/50' :
                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                }`}>
                  {report.status === 'pending' ? 'pendente' : report.status === 'resolved' ? 'resolvido' : 'dispensado'}
                </span>
              </div>
            </div>

            {report.status === 'pending' && (
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => updateStatus(report.id, 'dismissed')}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 font-medium text-sm"
                >
                  Dispensar
                </button>
                <button
                  onClick={() => updateStatus(report.id, 'resolved')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"
                >
                  Marcar como Resolvido
                </button>
                <button
                  onClick={() => {
                    const path = report.target_type === 'exercise' ? `/admin/content/exercises/${report.target_id}` :
                               report.target_type === 'food' ? `/admin/content/foods/${report.target_id}` :
                               `/admin/users/${report.target_id}`;
                    router.push(path);
                  }}
                  className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 font-medium text-sm"
                >
                  Ver Conteúdo
                </button>
              </div>
            )}
          </div>
        ))}

        {reports.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-surface border border-border rounded-xl">
            Nenhum relatório encontrado
          </div>
        )}
      </div>
    </div>
  );
}
