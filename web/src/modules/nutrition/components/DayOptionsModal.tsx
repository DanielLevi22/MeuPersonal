interface DayOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onClear: () => void;
  canPaste: boolean;
  dayName: string;
}

export function DayOptionsModal({
  isOpen,
  onClose,
  onCopy,
  onPaste,
  onClear,
  canPaste,
  dayName,
}: DayOptionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-foreground">Opções - {dayName}</h2>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                onCopy();
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/50 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Copiar Dia</p>
                <p className="text-xs text-muted-foreground">Copiar todas as refeições deste dia</p>
              </div>
            </button>

            <button
              onClick={() => {
                onPaste();
                onClose();
              }}
              disabled={!canPaste}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/5"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Colar Dia</p>
                <p className="text-xs text-muted-foreground">
                  {canPaste ? 'Substituir refeições por dia copiado' : 'Copie um dia primeiro'}
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                if (confirm(`Tem certeza que deseja limpar todas as refeições de ${dayName}?`)) {
                  onClear();
                  onClose();
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/50 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Limpar Dia</p>
                <p className="text-xs text-muted-foreground">Remover todas as refeições</p>
              </div>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
