"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useStudents } from "@/shared/hooks/useStudents";
import { AssessmentModal } from "../components/AssessmentModal";
import { EditStudentModal } from "../components/EditStudentModal";

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const { data: students = [], isLoading } = useStudents();
  const [editOpen, setEditOpen] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);

  const student = students.find((s) => s.id === studentId);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-foreground mb-2">Aluno não encontrado</h3>
        <button
          onClick={() => router.push("/dashboard/students")}
          className="text-primary hover:underline"
        >
          Voltar para lista de alunos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
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

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {(student.full_name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{student.full_name ?? "Aluno"}</h1>
              <p className="text-muted-foreground">{student.email}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 bg-surface border border-white/10 text-foreground font-medium rounded-lg hover:bg-white/5 transition-colors"
          >
            Editar Perfil
          </button>
          <button
            onClick={() => setAssessmentOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Nova Avaliação
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-white/10 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${student.account_status === "active" ? "bg-emerald-500" : "bg-orange-400"}`}
            />
            <span className="text-lg font-bold text-foreground">
              {student.account_status === "active" ? "Ativo" : "Pendente"}
            </span>
          </div>
        </div>
        <div className="bg-surface border border-white/10 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Membro desde</p>
          <p className="text-lg font-bold text-foreground">
            {student.link_created_at
              ? new Date(student.link_created_at).toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
        <div className="bg-surface border border-white/10 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Treinos</p>
          <p className="text-lg font-bold text-muted-foreground">—</p>
        </div>
        <div className="bg-surface border border-white/10 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Avaliações</p>
          <p className="text-lg font-bold text-muted-foreground">—</p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nutrition Module */}
        <Link
          href={`/dashboard/students/${studentId}/nutrition`}
          className="group bg-surface border border-white/10 rounded-2xl p-6 hover:border-secondary/50 transition-all hover:shadow-lg hover:shadow-secondary/5"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-xl bg-secondary/10 text-secondary group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-muted-foreground group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
              Ver Detalhes
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Nutrição</h3>
          <p className="text-muted-foreground mb-4">
            Gerencie dietas, acompanhe refeições e visualize o progresso nutricional.
          </p>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div className="bg-secondary h-full w-3/4" />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">75% da meta diária</p>
        </Link>

        {/* Workouts Module */}
        <Link
          href={`/dashboard/students/${studentId}/workouts`}
          className="group bg-surface border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              Ver Detalhes
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Treinos</h3>
          <p className="text-muted-foreground mb-4">
            Crie fichas de treino, acompanhe a frequência e evolução de cargas.
          </p>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-full w-1/2" />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">3 treinos essa semana</p>
        </Link>

        {/* Assessments Module */}
        <Link
          href={`/dashboard/students/${studentId}/assessments`}
          className="group bg-surface border border-white/10 rounded-2xl p-6 hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/5"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors">
              Ver Detalhes
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Avaliações</h3>
          <p className="text-muted-foreground">
            Registre avaliações físicas, composição corporal e circunferências.
          </p>
        </Link>

        {/* Anamnesis Module */}
        <Link
          href={`/dashboard/students/${studentId}/anamnesis`}
          className="group bg-surface border border-white/10 rounded-2xl p-6 hover:border-teal-500/50 transition-all hover:shadow-lg hover:shadow-teal-500/5"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-muted-foreground group-hover:bg-teal-500/10 group-hover:text-teal-400 transition-colors">
              Ver Detalhes
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Anamnese</h3>
          <p className="text-muted-foreground">
            Questionário completo de saúde, histórico de treino e objetivos do aluno.
          </p>
        </Link>

        {/* History Module */}
        <Link
          href={`/dashboard/students/${studentId}/history`}
          className="group bg-surface border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/5 md:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Histórico</h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Timeline de treinos realizados, avaliações e planos de dieta.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 text-muted-foreground group-hover:bg-violet-500/10 group-hover:text-violet-400 transition-colors shrink-0">
              Ver Histórico
            </span>
          </div>
        </Link>
      </div>

      <EditStudentModal
        studentId={editOpen ? studentId : null}
        onClose={() => setEditOpen(false)}
      />
      <AssessmentModal
        studentId={assessmentOpen ? studentId : null}
        onClose={() => setAssessmentOpen(false)}
      />
    </div>
  );
}
