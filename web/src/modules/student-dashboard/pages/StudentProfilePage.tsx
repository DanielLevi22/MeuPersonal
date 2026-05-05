"use client";

import { useAuth, useAuthStore } from "@/modules/auth";
import { useAuthUser } from "@/shared/hooks/useAuthUser";
import { SpecialistLinkSection } from "../components/SpecialistLinkSection";
import { useCurrentStudentId } from "../hooks/useStudentDashboardData";

export function StudentProfilePage() {
  const accountType = useAuthStore((s) => s.accountType);
  const { user } = useAuth();
  const { data: authProfile, isLoading } = useAuthUser();
  const studentId = useCurrentStudentId();
  const isMember = accountType === "member";

  if (isLoading || !authProfile) {
    return <div className="h-40 bg-zinc-900/40 border border-white/5 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Perfil</h1>
        <p className="text-sm text-zinc-500 mt-1">Suas informações de conta</p>
      </div>

      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col gap-5 max-w-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center font-black text-xl text-zinc-400">
            {(authProfile?.fullName ?? user?.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-black text-white uppercase tracking-tight">
              {authProfile?.fullName}
            </p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
            <span className="mt-1 inline-block px-2 py-0.5 bg-zinc-800 rounded text-[9px] font-black text-zinc-400 uppercase tracking-widest">
              {accountType === "member" ? "Membro" : "Aluno"}
            </span>
          </div>
        </div>

        <div className="w-full h-px bg-white/5" />

        {studentId && <SpecialistLinkSection studentId={studentId} isMember={isMember} />}

        <div className="w-full h-px bg-white/5" />

        <p className="text-xs text-zinc-600">
          Para alterar senha ou e-mail, use as configurações de conta enviadas por e-mail.
        </p>
      </div>
    </div>
  );
}
