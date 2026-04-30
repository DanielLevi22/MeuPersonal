import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Você é um analista nutricional. Analise o alimento na imagem e retorne APENAS JSON válido:
{"name":"Nome da refeição em Português","calories":número,"protein":número,"carbs":número,"fat":número,"confidence":número entre 0 e 1}
Se não for claro, estime com confidence menor. Nunca retorne texto fora do JSON.`;

export async function POST(request: NextRequest) {
  const studentId = await getStudentId(request);
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { imageBase64?: string; mimeType?: string };
  const { imageBase64, mimeType = "image/jpeg" } = body;

  if (!imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType as "image/jpeg", data: imageBase64 },
          },
          { type: "text", text: "Analise este alimento e retorne o JSON com os macros." },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  let result: FoodAnalysisResult;
  try {
    result = JSON.parse(text.replace(/```json|```/g, "").trim()) as FoodAnalysisResult;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
  }

  return NextResponse.json(result);
}
