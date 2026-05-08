import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

type VoiceAction =
  | "next_set"
  | "finish_workout"
  | "pause_timer"
  | "resume_timer"
  | "repeat_instruction"
  | "unknown";

async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
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

// Gemini is used here because Anthropic does not support audio input.
// API key is kept server-side so it is never exposed to mobile clients.
async function callGeminiAudio(base64Audio: string): Promise<VoiceAction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "unknown";

  const SYSTEM_PROMPT = `Você está ouvindo um usuário treinando. Ele dará um comando curto.
Mapeie a fala dele para uma das seguintes ações JSON:
- "Terminei", "Próxima", "Feito", "Já", "Concluído", "Próxima série", "Next", "Check" -> "next_set"
- "Acabei o treino", "Finalizar", "Encerrar", "Chega" -> "finish_workout"
- "Pausar", "Espera", "Pause" -> "pause_timer"
- "Retomar", "Voltar", "Resume", "Continua" -> "resume_timer"
Retorne APENAS um JSON válido: { "action": "..." }.
Se não for claro, retorne { "action": "unknown" }.`;

  const body = {
    contents: [
      {
        parts: [
          { text: SYSTEM_PROMPT },
          { inline_data: { mime_type: "audio/mp4", data: base64Audio } },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );

  if (!response.ok) return "unknown";

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    const parsed = JSON.parse(text) as { action?: string };
    return (parsed.action as VoiceAction) ?? "unknown";
  } catch {
    return "unknown";
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { base64Audio?: string };

  if (!body?.base64Audio) {
    return NextResponse.json({ error: "base64Audio is required" }, { status: 400 });
  }

  const action = await callGeminiAudio(body.base64Audio);
  return NextResponse.json({ action });
}
