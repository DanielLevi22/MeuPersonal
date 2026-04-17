"use client";

import Link from "next/link";
import { useState } from "react";
import type { Student } from "@/shared/hooks/useStudents";
import { DeleteStudentModal } from "./DeleteStudentModal";

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="group relative bg-surface border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
        {/* Menu button */}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen((v) => !v);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            aria-label="Opções do aluno"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                onKeyDown={() => setMenuOpen(false)}
                role="button"
                tabIndex={-1}
                aria-label="Fechar menu"
              />
              <div className="absolute right-0 mt-1 w-40 bg-surface border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Remover
                </button>
              </div>
            </>
          )}
        </div>

        {/* Card content — links to details */}
        <Link href={`/dashboard/students/${student.id}`} className="block">
          <div className="flex items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:scale-110 transition-transform">
              {(student.full_name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div
              className={`ml-auto px-2 py-1 rounded-full text-xs font-medium border ${
                student.account_status === "invited"
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}
            >
              {student.account_status === "invited" ? "Pendente" : "Ativo"}
            </div>
          </div>

          <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors pr-6">
            {student.full_name ?? "Aluno sem nome"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 truncate">
            {student.email || "Sem email"}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-white/5 pt-4">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span>Planos</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Treinos</span>
            </div>
          </div>
        </Link>
      </div>

      <DeleteStudentModal
        student={showDeleteModal ? { id: student.id, full_name: student.full_name ?? "" } : null}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  );
}
