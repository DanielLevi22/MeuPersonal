import { describe, expect, it } from "vitest";
import { getAiReadinessScore } from "../aiReadiness";
import type { StudentCoachContext } from "../studentCoachContextLoader";

const BASE_CTX: StudentCoachContext = {
  studentId: "student-1",
  name: "Test Student",
  coachMode: "express",
  personaTrack: "beginner",
  anamnesis: null,
  lastAssessment: null,
  activePlan: null,
};

const FULL_ANAMNESIS = {
  main_goal: "Hipertrofia",
  experience_level: "intermediario",
  training_days: 4,
  training_duration: 60,
  gym_type: "academia",
  gender: "masculino",
  injuries: "nenhuma",
  dietary_restrictions: "nenhuma",
  sleep_hours: 7,
  stress_level: "medio",
  squat_rm: 100,
  bench_rm: 80,
  food_preferences: "onivoro",
  supplements: "creatina",
};

describe("getAiReadinessScore", () => {
  it("returns score 0 and level blocked when anamnesis is null", () => {
    const result = getAiReadinessScore(BASE_CTX);

    expect(result.score).toBe(0);
    expect(result.level).toBe("blocked");
    expect(result.missingRequired).toHaveLength(8);
    expect(result.missingOptional).toHaveLength(6);
  });

  it("returns level blocked when score < 60", () => {
    const ctx: StudentCoachContext = {
      ...BASE_CTX,
      anamnesis: { main_goal: "Hipertrofia" }, // only 1 of 8 required fields
    };

    const result = getAiReadinessScore(ctx);

    expect(result.level).toBe("blocked");
    expect(result.score).toBeLessThan(60);
    expect(result.missingRequired).toHaveLength(7);
  });

  it("returns level warning when score is between 60 and 79", () => {
    const ctx: StudentCoachContext = {
      ...BASE_CTX,
      anamnesis: {
        main_goal: "Hipertrofia",
        experience_level: "intermediario",
        training_days: 4,
        training_duration: 60,
        gym_type: "academia",
        gender: "masculino",
        injuries: "nenhuma",
        dietary_restrictions: "nenhuma",
        // no optional fields
      },
    };

    const result = getAiReadinessScore(ctx);

    expect(result.score).toBe(60);
    expect(result.level).toBe("warning");
    expect(result.missingRequired).toHaveLength(0);
    expect(result.missingOptional).toHaveLength(6);
  });

  it("returns level ready when all required + some optional fields are filled", () => {
    const ctx: StudentCoachContext = {
      ...BASE_CTX,
      anamnesis: {
        ...FULL_ANAMNESIS,
      },
    };

    const result = getAiReadinessScore(ctx);

    expect(result.score).toBe(90); // 60 required + 30 optional + 0 assessment
    expect(result.level).toBe("ready");
    expect(result.missingRequired).toHaveLength(0);
    expect(result.missingOptional).toHaveLength(0);
  });

  it("adds 10 points for lastAssessment", () => {
    const ctxWithoutAssessment: StudentCoachContext = {
      ...BASE_CTX,
      anamnesis: FULL_ANAMNESIS,
      lastAssessment: null,
    };
    const ctxWithAssessment: StudentCoachContext = {
      ...BASE_CTX,
      anamnesis: FULL_ANAMNESIS,
      lastAssessment: { weight_kg: 80, height_cm: 178 },
    };

    const without = getAiReadinessScore(ctxWithoutAssessment);
    const withAssessment = getAiReadinessScore(ctxWithAssessment);

    expect(withAssessment.score).toBe(without.score + 10);
    expect(withAssessment.level).toBe("ready");
  });

  it("returns max score 100 when all fields and assessment are present", () => {
    const ctx: StudentCoachContext = {
      ...BASE_CTX,
      anamnesis: FULL_ANAMNESIS,
      lastAssessment: { weight_kg: 80, height_cm: 178, body_fat_pct: 15 },
    };

    const result = getAiReadinessScore(ctx);

    expect(result.score).toBe(100);
    expect(result.level).toBe("ready");
    expect(result.missingRequired).toHaveLength(0);
    expect(result.missingOptional).toHaveLength(0);
  });

  it("lists correct missing required field labels", () => {
    const ctx: StudentCoachContext = {
      ...BASE_CTX,
      anamnesis: { main_goal: "Emagrecer" },
    };

    const result = getAiReadinessScore(ctx);

    expect(result.missingRequired).toContain("Nível de experiência");
    expect(result.missingRequired).toContain("Dias de treino por semana");
    expect(result.missingRequired).not.toContain("Objetivo principal");
  });

  it("lists correct missing optional field labels", () => {
    const ctx: StudentCoachContext = {
      ...BASE_CTX,
      anamnesis: { sleep_hours: 8, stress_level: "baixo" },
    };

    const result = getAiReadinessScore(ctx);

    expect(result.missingOptional).toContain("1RM Agachamento");
    expect(result.missingOptional).not.toContain("Horas de sono");
    expect(result.missingOptional).not.toContain("Nível de estresse");
  });
});
