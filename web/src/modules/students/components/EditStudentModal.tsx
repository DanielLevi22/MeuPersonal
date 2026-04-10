"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useStudentDetails } from "../hooks/useStudentDetails";
import { useUpdateStudent } from "../hooks/useUpdateStudent";

interface EditStudentModalProps {
  studentId: string | null;
  onClose: () => void;
}

type Tab = "dados" | "medidas";

const MEASUREMENT_FIELDS: Array<{ key: string; label: string }> = [
  { key: "neck", label: "Pescoço" },
  { key: "shoulder", label: "Ombro" },
  { key: "chest", label: "Peito" },
  { key: "waist", label: "Cintura" },
  { key: "abdomen", label: "Abdômen" },
  { key: "hips", label: "Quadril" },
  { key: "arm_right_relaxed", label: "Braço D (relaxado)" },
  { key: "arm_left_relaxed", label: "Braço E (relaxado)" },
  { key: "arm_right_contracted", label: "Braço D (contraído)" },
  { key: "arm_left_contracted", label: "Braço E (contraído)" },
  { key: "thigh_proximal", label: "Coxa proximal" },
  { key: "thigh_distal", label: "Coxa distal" },
  { key: "calf", label: "Panturrilha" },
];

export function EditStudentModal({ studentId, onClose }: EditStudentModalProps) {
  const [tab, setTab] = useState<Tab>("dados");
  const [error, setError] = useState<string | null>(null);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");

  // Measurement fields
  const [measurements, setMeasurements] = useState<Record<string, string>>({});

  const { data: details, isLoading } = useStudentDetails(studentId);
  const updateStudent = useUpdateStudent();

  // Pre-fill form when details load
  useEffect(() => {
    if (!details) return;
    setFullName(details.profile.full_name ?? "");
    setPhone(details.profile.phone ?? "");
    setWeight(details.profile.weight?.toString() ?? "");
    setHeight(details.profile.height?.toString() ?? "");
    setNotes(details.profile.notes ?? "");

    if (details.measurements) {
      const m: Record<string, string> = {};
      for (const { key } of MEASUREMENT_FIELDS) {
        const val = details.measurements[key as keyof typeof details.measurements];
        m[key] = val !== null && val !== undefined ? String(val) : "";
      }
      setMeasurements(m);
    }
  }, [details]);

  const handleClose = () => {
    setError(null);
    setTab("dados");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    setError(null);

    try {
      const measurementValues: Record<string, string | null> = {};
      for (const { key } of MEASUREMENT_FIELDS) {
        measurementValues[key] = measurements[key] || null;
      }

      await updateStudent.mutateAsync({
        studentId,
        full_name: fullName,
        phone: phone || null,
        weight: weight || null,
        height: height || null,
        notes: notes || null,
        measurements: measurementValues as never,
      });

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar alterações");
    }
  };

  return (
    <Dialog open={!!studentId} onClose={handleClose} title="Editar Aluno" maxWidth="lg">
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground text-sm">Carregando...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {(["dados", "medidas"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "dados" ? "Dados Pessoais" : "Medidas"}
              </button>
            ))}
          </div>

          {/* Tab: Dados Pessoais */}
          {tab === "dados" && (
            <div className="space-y-4">
              <FormField label="Nome Completo" htmlFor="edit-fullName">
                <Input
                  id="edit-fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </FormField>

              <FormField label="Telefone" htmlFor="edit-phone" optional>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Peso (kg)" htmlFor="edit-weight" optional>
                  <Input
                    id="edit-weight"
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </FormField>
                <FormField label="Altura (cm)" htmlFor="edit-height" optional>
                  <Input
                    id="edit-height"
                    type="number"
                    placeholder="175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Observações" htmlFor="edit-notes" optional>
                <textarea
                  id="edit-notes"
                  placeholder="Objetivo, restrições, histórico..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </FormField>
            </div>
          )}

          {/* Tab: Medidas */}
          {tab === "medidas" && (
            <div className="grid grid-cols-2 gap-3">
              {MEASUREMENT_FIELDS.map(({ key, label }) => (
                <FormField key={key} label={`${label} (cm)`} htmlFor={`edit-${key}`} optional>
                  <Input
                    id={`edit-${key}`}
                    type="number"
                    step="0.1"
                    placeholder="—"
                    value={measurements[key] ?? ""}
                    onChange={(e) =>
                      setMeasurements((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </FormField>
              ))}
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
            >
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" fullWidth onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" fullWidth isLoading={updateStudent.isPending}>
              {updateStudent.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
