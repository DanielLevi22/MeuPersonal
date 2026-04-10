"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useCreateStudent } from "../hooks/useCreateStudent";

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXPERIENCE_LEVELS = ["Iniciante", "Intermediário", "Avançado"] as const;

export function CreateStudentModal({ isOpen, onClose }: CreateStudentModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");
  const [level, setLevel] = useState<(typeof EXPERIENCE_LEVELS)[number] | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createStudent = useCreateStudent();

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setWeight("");
    setHeight("");
    setNotes("");
    setLevel("");
    setError(null);
    setSuccess(false);
    createStudent.reset();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createStudent.mutateAsync({
        fullName,
        email,
        password,
        phone: phone || undefined,
        weight: weight || undefined,
        height: height || undefined,
        notes: notes || undefined,
        experience_level: (level as (typeof EXPERIENCE_LEVELS)[number]) || undefined,
      });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar aluno";
      setError(message);
    }
  };

  if (success) {
    return (
      <Dialog open={isOpen} onClose={handleClose} title="Aluno Criado!">
        <div className="text-center space-y-4 py-2">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-7 h-7 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">
            <strong className="text-foreground">{fullName}</strong> foi cadastrado com sucesso. As
            credenciais de acesso foram enviadas para{" "}
            <strong className="text-foreground">{email}</strong>.
          </p>
          <Button fullWidth onClick={handleClose}>
            Concluir
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      title="Novo Aluno"
      description="Cadastre um aluno criando o acesso dele ao app."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome Completo" htmlFor="fullName">
          <Input
            id="fullName"
            required
            placeholder="Ex: João Silva"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </FormField>

        <FormField label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            placeholder="joao@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>

        <FormField
          label="Senha"
          htmlFor="password"
          hint="O aluno usará essa senha para entrar no app"
        >
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>

        <FormField label="Telefone" htmlFor="phone" optional>
          <Input
            id="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Peso (kg)" htmlFor="weight" optional>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="70.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </FormField>
          <FormField label="Altura (cm)" htmlFor="height" optional>
            <Input
              id="height"
              type="number"
              placeholder="175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Nível de Experiência" htmlFor="level" optional>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value as typeof level)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Selecionar...</option>
            {EXPERIENCE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Observações" htmlFor="notes" optional>
          <textarea
            id="notes"
            placeholder="Objetivo, restrições, histórico..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </FormField>

        {error && (
          <p
            role="alert"
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" fullWidth onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth isLoading={createStudent.isPending}>
            {createStudent.isPending ? "Criando..." : "Criar Aluno"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
