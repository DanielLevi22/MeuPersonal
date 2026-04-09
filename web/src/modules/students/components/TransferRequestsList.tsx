'use client';

import { useRespondToTransfer, useTransferRequests } from '@/shared/hooks/useStudents';

export function TransferRequestsList() {
  const { data: requests = [], isLoading } = useTransferRequests();
  const respondToTransfer = useRespondToTransfer();

  if (isLoading) return null;
  if (requests.length === 0) return null;

  const handleRespond = async (transferId: string, approve: boolean) => {
    try {
      await respondToTransfer.mutateAsync({ transferId, approve });
    } catch (error) {
      console.error('Error responding to transfer:', error);
      alert('Erro ao processar solicitação.');
    }
  };

  const serviceLabels: Record<string, string> = {
    training: 'Treinos',
    nutrition: 'Nutrição',
    physiotherapy: 'Fisioterapia',
    psychology: 'Psicologia'
  };

  return (
    <div className="mb-8 bg-surface border border-yellow-500/20 rounded-xl overflow-hidden">
      <div className="bg-yellow-500/10 px-6 py-4 border-b border-yellow-500/10 flex items-center gap-3">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Solicitações de Transferência</h3>
          <p className="text-sm text-muted-foreground">Outros profissionais desejam assumir alguns de seus alunos.</p>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {requests.map((request) => {
          // @ts-ignore
          const requesterName = Array.isArray(request.requester) ? request.requester[0]?.full_name : request.requester?.full_name;
          // @ts-ignore
          const studentName = Array.isArray(request.profiles) ? request.profiles[0]?.full_name : request.profiles?.full_name;

          return (
          <div key={request.id} className="p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground font-medium">
                <span className="text-primary">{requesterName}</span> deseja assumir a 
                <span className="font-bold mx-1">{serviceLabels[request.service_category]}</span>
                do aluno <span className="text-white">{studentName}</span>.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Solicitado em {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleRespond(request.id, false)}
                disabled={respondToTransfer.isPending}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
              >
                Rejeitar
              </button>
              <button
                onClick={() => handleRespond(request.id, true)}
                disabled={respondToTransfer.isPending}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {respondToTransfer.isPending ? 'Processando...' : 'Aprovar Transferência'}
              </button>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
