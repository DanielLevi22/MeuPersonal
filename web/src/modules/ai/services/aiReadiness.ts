import type { StudentCoachContext } from "./studentCoachContextLoader";

export type ReadinessLevel = "blocked" | "warning" | "ready";

export interface AiReadinessScore {
  score: number;
  level: ReadinessLevel;
  missingRequired: string[];
  missingOptional: string[];
}

const REQUIRED_FIELDS: Array<{ key: string; label: string }> = [
  { key: "main_goal", label: "Objetivo principal" },
  { key: "experience_level", label: "Nível de experiência" },
  { key: "training_days", label: "Dias de treino por semana" },
  { key: "training_duration", label: "Duração da sessão" },
  { key: "gym_type", label: "Local de treino" },
  { key: "gender", label: "Sexo" },
  { key: "injuries", label: "Lesões / contraindicações" },
  { key: "dietary_restrictions", label: "Restrições alimentares" },
];

const OPTIONAL_FIELDS: Array<{ key: string; label: string }> = [
  { key: "sleep_hours", label: "Horas de sono" },
  { key: "stress_level", label: "Nível de estresse" },
  { key: "squat_rm", label: "1RM Agachamento" },
  { key: "bench_rm", label: "1RM Supino" },
  { key: "food_preferences", label: "Preferências alimentares" },
  { key: "supplements", label: "Suplementação" },
];

export function getAiReadinessScore(ctx: StudentCoachContext): AiReadinessScore {
  const anamnesis = ctx.anamnesis ?? {};

  const missingRequired = REQUIRED_FIELDS.filter((f) => !anamnesis[f.key]).map((f) => f.label);
  const missingOptional = OPTIONAL_FIELDS.filter((f) => !anamnesis[f.key]).map((f) => f.label);

  const hasAssessment = ctx.lastAssessment !== null;
  const requiredScore =
    ((REQUIRED_FIELDS.length - missingRequired.length) / REQUIRED_FIELDS.length) * 60;
  const optionalScore =
    ((OPTIONAL_FIELDS.length - missingOptional.length) / OPTIONAL_FIELDS.length) * 30;
  const assessmentScore = hasAssessment ? 10 : 0;

  const score = Math.round(requiredScore + optionalScore + assessmentScore);

  let level: ReadinessLevel;
  if (score < 60) level = "blocked";
  else if (score < 80) level = "warning";
  else level = "ready";

  return { score, level, missingRequired, missingOptional };
}
