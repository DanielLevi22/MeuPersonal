import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function getStudentId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
  const { data } = await client.auth.getUser(token);
  return data.user?.id ?? null;
}

async function loadDietContext(studentId: string): Promise<string> {
  const { data: plans } = await supabaseAdmin
    .from("diet_plans")
    .select("id, name, daily_calories, protein_target, carbs_target, fat_target")
    .eq("student_id", studentId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!plans) return "O aluno não possui plano alimentar ativo.";

  const { data: meals } = await supabaseAdmin
    .from("diet_meals")
    .select("id, name, meal_time, meal_type")
    .eq("diet_plan_id", plans.id)
    .order("meal_time");

  if (!meals?.length) return `Plano "${plans.name}" sem refeições cadastradas.`;

  const mealIds = meals.map((m) => m.id);
  const { data: items } = await supabaseAdmin
    .from("diet_meal_items")
    .select("meal_id, quantity, unit, food:foods(name, calories, protein, carbs, fat)")
    .in("meal_id", mealIds);

  const mealSummaries = meals.map((meal) => {
    const mealItems = items?.filter((i) => i.meal_id === meal.id) ?? [];
    const itemLines = mealItems
      .map((i) => {
        const food = i.food as unknown as { name: string } | null;
        return `  - ${i.quantity}${i.unit} de ${food?.name ?? "alimento"}`;
      })
      .join("\n");
    return `${meal.name} (${meal.meal_time}):\n${itemLines || "  - sem alimentos"}`;
  });

  return `Plano: "${plans.name}" | ${plans.daily_calories}kcal | P:${plans.protein_target}g C:${plans.carbs_target}g G:${plans.fat_target}g\n\n${mealSummaries.join("\n\n")}`;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const studentId = await getStudentId(request);
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { message?: string; history?: ChatMessage[] };
  const { message, history = [] } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const dietContext = await loadDietContext(studentId);

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `Você é o NutriBot, assistente nutricional do app Eleva Pro. Responda em Português do Brasil.
Seja amigável, motivador e conciso. Evite conselhos médicos.
Use o plano do aluno como referência para sugestões de substituições e receitas.

PLANO ALIMENTAR DO ALUNO:
${dietContext}`,
    messages: [
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ],
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ reply });
}
