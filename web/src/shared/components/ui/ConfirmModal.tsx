"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-zinc-900 border border-white/10 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl shadow-black"
        >
          <div className="p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-black text-white italic uppercase tracking-tight">
                {title}
              </h2>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">{description}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl bg-zinc-800 text-zinc-400 text-xs font-black italic uppercase tracking-widest hover:bg-zinc-700 hover:text-white transition-all shadow-lg"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-6 py-4 rounded-2xl text-black text-xs font-black italic uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                  variant === "danger"
                    ? "bg-red-500 hover:bg-red-400 shadow-red-500/20"
                    : "bg-primary hover:bg-primary-dark shadow-primary/20"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
