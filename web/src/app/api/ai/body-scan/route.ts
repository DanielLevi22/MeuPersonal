import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

interface BodyScanPayload {
  metrics: {
    height: number;
    weight: number;
    bodyFat: number;
    muscleMass: number;
    bmi: number;
  };
  segments: {
    chest: number;
    waist: number;
    hips: number;
    arms: number;
    thighs: number;
    calves?: number;
    neck?: number;
    shoulders?: number;
  };
  postureAnalysis?: {
    scores: { symmetry: number; muscle: number; posture: number };
    feedback: {
      front: Array<{ title: string; risk: string; text: string }>;
      back: Array<{ title: string; risk: string; text: string }>;
      side_right: Array<{ title: string; risk: string; text: string }>;
      side_left: Array<{ title: string; risk: string; text: string }>;
    };
    recommendations: string;
  };
}

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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Você é um especialista em avaliação física e análise postural. Analise as imagens corporais fornecidas e retorne APENAS JSON válido com esta estrutura exata:
{
  "metrics": { "height": number (cm), "weight": number (kg), "bodyFat": number (%), "muscleMass": number (kg), "bmi": number },
  "segments": { "chest": number (cm), "waist": number (cm), "hips": number (cm), "arms": number (cm), "thighs": number (cm), "calves": number, "neck": number, "shoulders": number },
  "postureAnalysis": {
    "scores": { "symmetry": number (0-100), "muscle": number (0-100), "posture": number (0-100) },
    "feedback": {
      "front": [{ "title": string, "risk": "ÓTIMO"|"BOM"|"NORMAL"|"MODERADO"|"ALTO", "text": string }],
      "back": [{ "title": string, "risk": "ÓTIMO"|"BOM"|"NORMAL"|"MODERADO"|"ALTO", "text": string }],
      "side_right": [{ "title": string, "risk": "ÓTIMO"|"BOM"|"NORMAL"|"MODERADO"|"ALTO", "text": string }],
      "side_left": [{ "title": string, "risk": "ÓTIMO"|"BOM"|"NORMAL"|"MODERADO"|"ALTO", "text": string }]
    },
    "recommendations": string
  }
}
Nunca retorne texto fora do JSON. Estime com base nas imagens disponíveis.`;

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    images: {
      front?: string;
      side_right?: string;
      back?: string;
      side_left?: string;
    };
  };

  if (!body?.images || !Object.values(body.images).some(Boolean)) {
    return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
  }

  const imageContent: Anthropic.MessageParam["content"] = [];

  const labels: Record<string, string> = {
    front: "Vista Frontal",
    side_right: "Vista Lateral Direita",
    back: "Vista Posterior",
    side_left: "Vista Lateral Esquerda",
  };

  for (const key of ["front", "side_right", "back", "side_left"] as const) {
    const base64 = body.images[key];
    if (!base64) continue;
    imageContent.push({
      type: "text",
      text: `[${labels[key]}]`,
    });
    imageContent.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: base64 },
    });
  }

  imageContent.push({
    type: "text",
    text: "Analise estas imagens corporais e retorne o JSON de avaliação física.",
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: imageContent }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  let result: BodyScanPayload;
  try {
    result = JSON.parse(text.replace(/```json|```/g, "").trim()) as BodyScanPayload;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
  }

  if (!result?.metrics) {
    return NextResponse.json({ error: "Invalid AI response structure" }, { status: 502 });
  }

  return NextResponse.json(result);
}
