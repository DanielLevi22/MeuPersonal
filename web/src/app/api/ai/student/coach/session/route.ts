import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getAiReadinessScore } from "@/modules/ai/services/aiReadiness";
import {
  buildProfileSummary,
  loadStudentCoachContext,
} from "@/modules/ai/services/studentCoachContextLoader";
import {
  getOrCreateStudentCoachSession,
  getStudentSessionMessages,
} from "@/modules/ai/services/studentCoachService";

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

export async function GET(request: NextRequest) {
  const studentId = await getStudentId(request);
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await loadStudentCoachContext(studentId);

  const [sessionId] = await Promise.all([getOrCreateStudentCoachSession(studentId)]);
  const [profileSummary, messages] = await Promise.all([
    Promise.resolve(buildProfileSummary(ctx)),
    getStudentSessionMessages(sessionId),
  ]);

  const readiness = getAiReadinessScore(ctx);

  return NextResponse.json({
    sessionId,
    coachMode: ctx.coachMode,
    personaTrack: ctx.personaTrack,
    profileSummary,
    readiness,
    messageCount: messages.length,
    activePlan: ctx.activePlan,
  });
}
