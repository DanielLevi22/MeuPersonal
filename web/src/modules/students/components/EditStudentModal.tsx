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

const TABS: { id: Tab; label: string }[] = [
  { id: "dados", label: "Dados Pessoais" },
  { id: "medidas", label: "Medidas" },
];

export function EditStudentModal({ studentId, onClose }: EditStudentModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dados");
  const [error, setError] = useState<string | null>(null);

  // Dados pessoais
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Medidas
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [neck, setNeck] = useState("");
  const [shoulder, setShoulder] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [abdomen, setAbdomen] = useState("");
  const [hips, setHips] = useState("");
  const [armRight, setArmRight] = useState("");
  const [armLeft, setArmLeft] = useState("");
  const [thighRight, setThighRight] = useState("");
  const [thighLeft, setThighLeft] = useState("");
  const [calfRight, setCalfRight] = useState("");
  const [calfLeft, setCalfLeft] = useState("");

  const { data: profile } = useStudentDetails(studentId);
  const updateStudent = useUpdateStudent();

  // Pre-populate form when profile loads
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setNotes(profile.notes ?? "");
    setWeight(profile.weight?.toString() ?? "");
    setHeight(profile.height?.toString() ?? "");
  }, [profile]);

  // Reset tab and error when modal opens/closes
  useEffect(() => {
    if (!studentId) {
      setActiveTab("dados");
      setError(null);
      updateStudent.reset();
    }
  }, [studentId, updateStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    setError(null);

    try {
      await updateStudent.mutateAsync({
        studentId,
        fullName,
        phone: phone || undefined,
        notes: notes || undefined,
        measurements: {
          weight,
          height,
          neck,
          shoulder,
          chest,
          waist,
          abdomen,
          hips,
          armRightRelaxed: armRight,
          armLeftRelaxed: armLeft,
          thighRight,
          thighLeft,
          calfRight,
          calfLeft,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  return (
    <Dialog open={!!studentId} onClose={onClose} title="Editar Aluno" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Dados Pessoais */}
        {activeTab === "dados" && (
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
            <FormField label="Observações" htmlFor="edit-notes" optional>
              <textarea
                id="edit-notes"
                rows={3}
                placeholder="Objetivo, restrições, histórico..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </FormField>
          </div>
        )}

        {/* Tab: Medidas */}
        {activeTab === "medidas" && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
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

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-1">
              Circunferências (cm)
            </p>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Pescoço" htmlFor="edit-neck" optional>
                <Input
                  id="edit-neck"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={neck}
                  onChange={(e) => setNeck(e.target.value)}
                />
              </FormField>
              <FormField label="Ombro" htmlFor="edit-shoulder" optional>
                <Input
                  id="edit-shoulder"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={shoulder}
                  onChange={(e) => setShoulder(e.target.value)}
                />
              </FormField>
              <FormField label="Peito" htmlFor="edit-chest" optional>
                <Input
                  id="edit-chest"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                />
              </FormField>
              <FormField label="Cintura" htmlFor="edit-waist" optional>
                <Input
                  id="edit-waist"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                />
              </FormField>
              <FormField label="Abdômen" htmlFor="edit-abdomen" optional>
                <Input
                  id="edit-abdomen"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={abdomen}
                  onChange={(e) => setAbdomen(e.target.value)}
                />
              </FormField>
              <FormField label="Quadril" htmlFor="edit-hips" optional>
                <Input
                  id="edit-hips"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={hips}
                  onChange={(e) => setHips(e.target.value)}
                />
              </FormField>
              <FormField label="Braço D (relaxado)" htmlFor="edit-armRight" optional>
                <Input
                  id="edit-armRight"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={armRight}
                  onChange={(e) => setArmRight(e.target.value)}
                />
              </FormField>
              <FormField label="Braço E (relaxado)" htmlFor="edit-armLeft" optional>
                <Input
                  id="edit-armLeft"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={armLeft}
                  onChange={(e) => setArmLeft(e.target.value)}
                />
              </FormField>
              <FormField label="Coxa D" htmlFor="edit-thighRight" optional>
                <Input
                  id="edit-thighRight"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={thighRight}
                  onChange={(e) => setThighRight(e.target.value)}
                />
              </FormField>
              <FormField label="Coxa E" htmlFor="edit-thighLeft" optional>
                <Input
                  id="edit-thighLeft"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={thighLeft}
                  onChange={(e) => setThighLeft(e.target.value)}
                />
              </FormField>
              <FormField label="Panturrilha D" htmlFor="edit-calfRight" optional>
                <Input
                  id="edit-calfRight"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={calfRight}
                  onChange={(e) => setCalfRight(e.target.value)}
                />
              </FormField>
              <FormField label="Panturrilha E" htmlFor="edit-calfLeft" optional>
                <Input
                  id="edit-calfLeft"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={calfLeft}
                  onChange={(e) => setCalfLeft(e.target.value)}
                />
              </FormField>
            </div>
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
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth isLoading={updateStudent.isPending}>
            {updateStudent.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
