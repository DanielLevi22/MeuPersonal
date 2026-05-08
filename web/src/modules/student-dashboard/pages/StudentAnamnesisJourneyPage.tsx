"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  AdaptiveQuestion,
  PersonaTrack,
  UnlockCard,
} from "@/modules/students/data/anamnesisAdaptive";
import {
  getPrecisionScore,
  getQuestionPrecisionDelta,
  getTrackQuestions,
  PERSONA_OPTIONS,
  UNLOCK_CARDS,
} from "@/modules/students/data/anamnesisAdaptive";
import type { AnamnesisResponseValue } from "@/modules/students/hooks/useStudentAnamnesis";
import { useStudentAnamnesis } from "@/modules/students/hooks/useStudentAnamnesis";
import { useAnamnesisForm, useSavePersonaTrack } from "../hooks/useAnamnesisForm";
import { useCurrentStudentId } from "../hooks/useStudentDashboardData";

// ─── Question Field ─────────────────────────────────────────────────────────────

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: AdaptiveQuestion;
  value: AnamnesisResponseValue | undefined;
  onChange: (v: AnamnesisResponseValue) => void;
}) {
  const base =
    "bg-zinc-800/60 border border-white/10 rounded-xl text-white text-sm px-4 py-3 w-full focus:outline-none focus:border-white/30 placeholder:text-zinc-600";

  if (question.type === "text") {
    return (
      <textarea
        className={`${base} resize-none min-h-[80px]`}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder ?? "Sua resposta..."}
      />
    );
  }

  if (question.type === "number") {
    return (
      <div className="relative">
        <input
          type="number"
          className={`${base} pr-16`}
          value={(value as number) ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={question.placeholder ?? "0"}
        />
        {question.unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium pointer-events-none">
            {question.unit}
          </span>
        )}
      </div>
    );
  }

  if (question.type === "boolean") {
    return (
      <div className="flex gap-3">
        {([true, false] as const).map((opt) => (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
              value === opt
                ? "bg-white text-black border-white scale-[1.02]"
                : "bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/30"
            }`}
          >
            {opt ? "Sim" : "Não"}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "single_choice" && question.options) {
    return (
      <div className="flex flex-col gap-2">
        {question.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`w-full px-5 py-3 rounded-xl text-sm font-medium border text-left transition-all ${
              value === opt
                ? "bg-white text-black border-white"
                : "bg-zinc-900 text-zinc-300 border-white/10 hover:border-white/20 hover:bg-zinc-800"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "multiple_choice" && question.options) {
    const selected = (value as string[]) ?? [];
    const toggle = (opt: string) =>
      onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
    return (
      <div className="flex flex-col gap-2">
        {question.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`w-full px-5 py-3 rounded-xl text-sm font-medium border text-left transition-all ${
              selected.includes(opt)
                ? "bg-white text-black border-white"
                : "bg-zinc-900 text-zinc-300 border-white/10 hover:border-white/20 hover:bg-zinc-800"
            }`}
          >
            {selected.includes(opt) ? "✓ " : ""}
            {opt}
          </button>
        ))}
      </div>
    );
  }

  return null;
}

// ─── Persona Selection ──────────────────────────────────────────────────────────

function PersonaScreen({ onSelect }: { onSelect: (t: PersonaTrack) => void }) {
  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          Como você se descreveria?
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          Vamos montar seu plano a partir do seu nível real.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {PERSONA_OPTIONS.map((opt) => (
          <button
            key={opt.track}
            type="button"
            onClick={() => onSelect(opt.track)}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-white/20 transition-all text-left group"
          >
            <span className="text-3xl">{opt.emoji}</span>
            <div className="flex-1">
              <p className="text-white font-bold text-base">{opt.label}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{opt.detail}</p>
            </div>
            <svg
              className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Unlock Screen ───────────────────────────────────────────────────────────────

function UnlockScreen({ card, onContinue }: { card: UnlockCard; onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-6 max-w-sm mx-auto">
      <div className="text-6xl animate-bounce">{card.emoji}</div>
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">{card.title}</h2>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{card.detail}</p>
      </div>
      <button
        onClick={onContinue}
        className="w-full py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-white/90 transition-colors"
      >
        Continuar →
      </button>
    </div>
  );
}

// ─── Completion Screen ───────────────────────────────────────────────────────────

function CompletionScreen({ score, onStartCoach }: { score: number; onStartCoach: () => void }) {
  const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-zinc-400";
  const borderColor =
    score >= 80 ? "border-emerald-500/30" : score >= 60 ? "border-amber-500/30" : "border-zinc-700";

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-6 max-w-sm mx-auto">
      <div
        className={`w-28 h-28 rounded-full border-2 ${borderColor} flex items-center justify-center`}
      >
        <span className={`text-3xl font-black ${color}`}>{score}%</span>
      </div>
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">
          {score >= 60 ? "Perfil pronto!" : "Bom começo!"}
        </h2>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          {score >= 80
            ? "Seu coach tem tudo que precisa para montar seu plano personalizado."
            : score >= 60
              ? "Dados suficientes para começar. O coach pode pedir mais detalhes durante a conversa."
              : "Você pode continuar e responder mais no chat com o coach."}
        </p>
      </div>
      <button
        onClick={onStartCoach}
        className="w-full py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-white/90 transition-colors"
      >
        ⚡ Gerar meu plano agora
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────────

export function StudentAnamnesisJourneyPage() {
  const router = useRouter();
  const studentId = useCurrentStudentId();
  const { data: existing } = useStudentAnamnesis(studentId);
  const { mutateAsync: save, isPending } = useAnamnesisForm();
  const { mutateAsync: saveTrack } = useSavePersonaTrack();

  const [track, setTrack] = useState<PersonaTrack | null>(null);
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, AnamnesisResponseValue>>({});
  const [pendingUnlock, setPendingUnlock] = useState<UnlockCard | null>(null);
  const [precisionDelta, setPrecisionDelta] = useState<number | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Pre-fill from existing anamnesis
  useEffect(() => {
    if (!existing?.responses) return;
    const raw = existing.responses as Record<string, unknown>;
    const normalized: Record<string, AnamnesisResponseValue> = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => {
        if (v !== null && typeof v === "object" && !Array.isArray(v) && "value" in v) {
          return [k, (v as { value: AnamnesisResponseValue }).value];
        }
        return [k, v as AnamnesisResponseValue];
      }),
    );
    setResponses(normalized);
  }, [existing]);

  const questions = track ? getTrackQuestions(track) : [];
  const currentQ = questions[step];
  const precision = questions.length > 0 ? getPrecisionScore(questions, responses) : 30;
  const isLastStep = step === questions.length - 1;
  const progressPct = questions.length > 0 ? Math.round(((step + 1) / questions.length) * 100) : 0;

  const TRACK_LABELS: Record<PersonaTrack, string> = {
    beginner: "🌱 Iniciante",
    returning: "🔄 Retomada",
    intermediate: "💪 Intermediário",
    advanced: "🏆 Avançado",
  };

  const handleSelectTrack = async (t: PersonaTrack) => {
    setTrack(t);
    setStep(0);
    setShowWhy(false);
    if (studentId) {
      try {
        await saveTrack({ studentId, track: t });
      } catch {
        // column may not exist in all environments
      }
    }
  };

  const handleAnswerChange = (value: AnamnesisResponseValue) => {
    setResponses((prev) => ({ ...prev, [currentQ.id]: value }));
    const delta = getQuestionPrecisionDelta(currentQ, questions);
    setPrecisionDelta(delta);
    setTimeout(() => setPrecisionDelta(null), 1800);
  };

  const handleNext = async () => {
    if (!studentId || !track) return;
    await save({ studentId, responses, completed: isLastStep });

    const unlock = UNLOCK_CARDS.find((u) => u.afterQuestionId === currentQ.id);
    if (unlock && !isLastStep) {
      setPendingUnlock(unlock);
      return;
    }

    if (isLastStep) {
      setIsDone(true);
    } else {
      setStep((s) => s + 1);
      setShowWhy(false);
    }
  };

  const handleUnlockContinue = () => {
    setPendingUnlock(null);
    setStep((s) => s + 1);
    setShowWhy(false);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      setShowWhy(false);
    } else {
      setTrack(null);
    }
  };

  if (!track) return <PersonaScreen onSelect={handleSelectTrack} />;
  if (pendingUnlock) return <UnlockScreen card={pendingUnlock} onContinue={handleUnlockContinue} />;
  if (isDone)
    return (
      <CompletionScreen
        score={precision}
        onStartCoach={() => router.push("/dashboard/student/coach")}
      />
    );

  const barColor = precision >= 80 ? "#10b981" : precision >= 60 ? "#f59e0b" : "#818cf8";

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-zinc-500 font-medium">
          <span>{TRACK_LABELS[track]}</span>
          <span>
            {step + 1} / {questions.length}
          </span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col gap-5">
        <h2 className="text-xl font-black text-white leading-tight">{currentQ.text}</h2>

        <button
          type="button"
          onClick={() => setShowWhy((v) => !v)}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1 w-fit"
        >
          Por que perguntamos? {showWhy ? "▲" : "▼"}
        </button>
        {showWhy && (
          <p className="text-xs text-zinc-500 leading-relaxed -mt-3">{currentQ.whyWeAsk}</p>
        )}

        <QuestionField
          question={currentQ}
          value={responses[currentQ.id]}
          onChange={handleAnswerChange}
        />
      </div>

      {/* Precision meter */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 relative overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-500 font-medium">Precisão do seu plano</span>
          <span className="text-sm font-black text-white">{precision}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${precision}%`, backgroundColor: barColor }}
          />
        </div>
        <p className="text-[10px] text-zinc-600 mt-2">
          Um plano genérico tem 30% de precisão. Complete para chegar a 94%.
        </p>
        {precisionDelta !== null && (
          <span className="absolute top-3 right-12 text-xs font-black text-emerald-400 animate-bounce">
            +{precisionDelta}%
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="px-5 py-3 bg-zinc-900 text-zinc-400 font-bold text-sm rounded-xl border border-white/10 hover:border-white/20 transition-colors"
        >
          {step === 0 ? "Voltar" : "Anterior"}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="flex-1 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40"
        >
          {isPending ? "Salvando..." : isLastStep ? "Concluir" : "Próximo →"}
        </button>
      </div>
    </div>
  );
}
