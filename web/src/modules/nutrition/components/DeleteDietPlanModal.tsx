"use client";

import { AnimatePresence, motion } from "framer-motion";

interface DeleteDietPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  planName: string;
  isDeleting: boolean;
}

export function DeleteDietPlanModal({
  isOpen,
  onClose,
  onConfirm,
  planName,
  isDeleting,
}: DeleteDietPlanModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[32px] p-8 shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">
              Excluir Plano Nutricional?
            </h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-6">
              Esta ação é{" "}
              <span className="text-red-500 font-bold uppercase tracking-widest">irreversível</span>
              . Ao confirmar, todos os seguintes dados vinculados ao plano{" "}
              <span className="text-white font-bold">{planName}</span> serão removidos
              permanentemente:
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-xs text-zinc-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                Todas as <span className="text-zinc-200">refeições</span> e horários configurados
              </li>
              <li className="flex items-center gap-3 text-xs text-zinc-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                Alimentos e <span className="text-zinc-200">quantidades</span> de cada refeição
              </li>
              <li className="flex items-center gap-3 text-xs text-zinc-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                Histórico de <span className="text-zinc-200">logs e adesão</span> deste período
              </li>
              <li className="flex items-center gap-3 text-xs text-zinc-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                Metas de <span className="text-zinc-200">calorias e macros</span> do planeamento
              </li>
            </ul>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold hover:bg-zinc-750 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
