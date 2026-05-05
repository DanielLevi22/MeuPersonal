"use client";

import { useGrantHealthDataConsent } from "@/shared/hooks/useHealthDataConsent";

interface HealthDataConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function HealthDataConsentModal({ onAccept, onDecline }: HealthDataConsentModalProps) {
  const { mutateAsync: grantConsent, isPending } = useGrantHealthDataConsent();

  async function handleAccept() {
    await grantConsent();
    onAccept();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-black text-white uppercase tracking-tight">
            Uso de dados de saúde
          </h2>
          <p className="text-sm text-zinc-400">
            Para criar um plano alimentar, precisamos armazenar suas metas nutricionais (calorias,
            proteínas, carboidratos e gorduras).
          </p>
        </div>

        <div className="rounded-xl bg-zinc-800/60 border border-white/5 p-4 flex flex-col gap-2 text-sm text-zinc-300">
          <p className="font-semibold text-white">O que será armazenado:</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li>Metas calóricas e de macronutrientes</li>
            <li>Refeições e alimentos do plano</li>
            <li>Registros de refeições realizadas</li>
          </ul>
          <p className="mt-2 text-zinc-500 text-xs">
            Base legal: Tutela da Saúde (Art. 11, II, f) + Consentimento (Art. 11, I) — LGPD. Você
            pode revogar este consentimento a qualquer momento nas configurações de privacidade.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isPending}
            className="w-full py-3 bg-primary text-black font-black text-sm uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Registrando..." : "Aceitar e continuar"}
          </button>
          <button
            type="button"
            onClick={onDecline}
            disabled={isPending}
            className="w-full py-3 text-zinc-500 font-bold text-sm uppercase tracking-widest hover:text-zinc-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
