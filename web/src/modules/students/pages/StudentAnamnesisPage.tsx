"use client";

import { useParams, useRouter } from "next/navigation";
import { useStudents } from "@/shared/hooks/useStudents";
import type { AnamnesisQuestion, AnamnesisSection } from "../data/anamnesisQuestions";
import { GENERAL_ANAMNESIS } from "../data/anamnesisQuestions";
import type { AnamnesisResponseValue } from "../hooks/useStudentAnamnesis";
import { useStudentAnamnesis } from "../hooks/useStudentAnamnesis";

function formatValue(question: AnamnesisQuestion, value: AnamnesisResponseValue): string {
  if (value === null || value === undefined || value === "") return "Não respondido";

  if (question.type === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (question.type === "multiple_choice" && Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "Nenhum";
  }

  if (question.type === "date" && typeof value === "string" && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    }
  }

  return String(value);
}

function isVisible(
  question: AnamnesisQuestion,
  responses: Record<string, AnamnesisResponseValue>,
): boolean {
  if (!question.condition) return true;
  const parent = responses[question.condition.questionId];
  return parent === question.condition.expectedValue;
}

function SectionCard({
  section,
  responses,
}: {
  section: AnamnesisSection;
  responses: Record<string, AnamnesisResponseValue>;
}) {
  const visibleQuestions = section.questions.filter((q) => isVisible(q, responses));

  if (visibleQuestions.length === 0) return null;

  return (
    <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02]">
        <h3 className="font-semibold text-foreground text-sm">{section.title}</h3>
      </div>
      <div className="divide-y divide-white/5">
        {visibleQuestions.map((q) => {
          const raw = responses[q.id];
          const answered = raw !== null && raw !== undefined && raw !== "";
          const display = answered ? formatValue(q, raw) : "Não respondido";

          return (
            <div key={q.id} className="px-5 py-3 flex justify-between gap-4">
              <p className="text-sm text-muted-foreground flex-1">{q.text}</p>
              <p
                className={`text-sm font-medium text-right max-w-[55%] ${answered ? "text-foreground" : "text-white/20"}`}
              >
                {display}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentAnamnesisPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const { data: students = [] } = useStudents();
  const student = students.find((s) => s.id === studentId);

  const { data: anamnesis, isLoading, isError } = useStudentAnamnesis(studentId);

  const rawResponses = (anamnesis?.responses ?? {}) as Record<
    string,
    { questionId: string; value: AnamnesisResponseValue } | AnamnesisResponseValue
  >;

  // Normalize: some clients store `{ questionId, value }`, others store the value directly
  const responses: Record<string, AnamnesisResponseValue> = Object.fromEntries(
    Object.entries(rawResponses).map(([k, v]) => {
      if (v !== null && typeof v === "object" && !Array.isArray(v) && "value" in v) {
        return [k, (v as { value: AnamnesisResponseValue }).value];
      }
      return [k, v as AnamnesisResponseValue];
    }),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Anamnese</h1>
            {student && <p className="text-sm text-muted-foreground">{student.full_name}</p>}
          </div>
        </div>

        {anamnesis?.completed_at && (
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400">
            Concluída em{" "}
            {new Date(anamnesis.completed_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface border border-white/10 rounded-2xl animate-pulse h-40"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-12 text-muted-foreground">Erro ao carregar anamnese.</div>
      )}

      {/* Empty */}
      {!isLoading && !isError && !anamnesis && (
        <div className="text-center py-16 bg-surface border border-white/10 rounded-2xl">
          <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">Anamnese não preenchida</h3>
          <p className="text-sm text-muted-foreground">
            Este aluno ainda não respondeu o questionário de anamnese.
          </p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && anamnesis && (
        <div className="flex flex-col gap-4">
          {GENERAL_ANAMNESIS.map((section) => (
            <SectionCard key={section.id} section={section} responses={responses} />
          ))}
        </div>
      )}
    </div>
  );
}
