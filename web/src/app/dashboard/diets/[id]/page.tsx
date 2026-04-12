"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { DaySelector } from "@/modules/nutrition/components/DaySelector";
import { DietDetailsHeader } from "@/modules/nutrition/components/DietDetailsHeader";
import { DietDetailsSkeleton } from "@/modules/nutrition/components/DietDetailsSkeleton";
import { DayOptionsModal, MealEditor } from "@/nutrition";
import {
  useClearDay,
  useCopyDay,
  useDietMeals,
  useDietPlan,
  usePasteDay,
} from "@/shared/hooks/useNutrition";
import { useStudents } from "@/shared/hooks/useStudents";
import { exportDietToPDF } from "@/shared/utils/exportDietPDF";

const DAYS_OF_WEEK = [
  { id: 0, label: "Domingo", short: "Dom" },
  { id: 1, label: "Segunda", short: "Seg" },
  { id: 2, label: "Terça", short: "Ter" },
  { id: 3, label: "Quarta", short: "Qua" },
  { id: 4, label: "Quinta", short: "Qui" },
  { id: 5, label: "Sexta", short: "Sex" },
  { id: 6, label: "Sábado", short: "Sáb" },
];

export default function DietDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: dietPlan, isLoading } = useDietPlan(id);
  const { data: meals = [] } = useDietMeals(id);
  const { data: students = [] } = useStudents();

  const [selectedDay, setSelectedDay] = useState(1); // Default to Monday
  const [isDayOptionsOpen, setIsDayOptionsOpen] = useState(false);
  const [copiedDay, setCopiedDay] = useState<{ meals: any[]; dayOfWeek: number } | null>(null);

  const copyDayMutation = useCopyDay();
  const pasteDayMutation = usePasteDay();
  const clearDayMutation = useClearDay();

  const handleCopyDay = async () => {
    try {
      const result = await copyDayMutation.mutateAsync({
        dietPlanId: id,
        dayOfWeek: selectedDay,
      });
      setCopiedDay(result);
    } catch (error) {
      console.error("Error copying day:", error);
    }
  };

  const handlePasteDay = async () => {
    if (!copiedDay) return;
    try {
      await pasteDayMutation.mutateAsync({
        dietPlanId: id,
        targetDay: selectedDay,
        copiedMeals: copiedDay.meals || [],
      });
    } catch (error) {
      console.error("Error pasting day:", error);
    }
  };

  const handleClearDay = async () => {
    try {
      await clearDayMutation.mutateAsync({
        dietPlanId: id,
        dayOfWeek: selectedDay,
      });
    } catch (error) {
      console.error("Error clearing day:", error);
    }
  };

  const handleExportPDF = async () => {
    if (!dietPlan) return;
    try {
      const student = students.find((s) => s.id === dietPlan.student_id);
      const studentName = student?.full_name || "Aluno";
      await exportDietToPDF(dietPlan, meals, studentName);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  };

  if (isLoading) {
    return <DietDetailsSkeleton />;
  }

  if (!dietPlan) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Plano não encontrado</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-primary hover:underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  const isCyclic = dietPlan.plan_type === "cyclic";
  const currentDayName = DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.label || "";

  return (
    <div className="space-y-8">
      <DietDetailsHeader
        dietPlan={dietPlan}
        onBack={() => router.back()}
        onExportPDF={handleExportPDF}
        onDayOptions={() => setIsDayOptionsOpen(true)}
        isCyclic={isCyclic}
      />

      <DaySelector
        days={DAYS_OF_WEEK}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        isCyclic={isCyclic}
      />

      {/* Meal Editor */}
      <MealEditor dietPlanId={id} dayOfWeek={isCyclic ? selectedDay : -1} />

      {/* Day Options Modal */}
      <DayOptionsModal
        isOpen={isDayOptionsOpen}
        onClose={() => setIsDayOptionsOpen(false)}
        onCopy={handleCopyDay}
        onPaste={handlePasteDay}
        onClear={handleClearDay}
        canPaste={!!copiedDay}
        dayName={currentDayName}
      />
    </div>
  );
}
