"use client";

import { useParams } from "next/navigation";
import { useStudents } from "@/shared/hooks/useStudents";
import { AiCoachChat } from "../components/AiCoachChat";

export function AiCoachPage() {
  const params = useParams();
  const studentId = params.id as string;
  const { data: students = [] } = useStudents();
  const student = students.find((s) => s.id === studentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Coach</h2>
          {student?.full_name && (
            <p className="text-sm text-muted-foreground">
              Planejando treinos para {student.full_name}
            </p>
          )}
        </div>
      </div>

      <AiCoachChat studentId={studentId} />
    </div>
  );
}
