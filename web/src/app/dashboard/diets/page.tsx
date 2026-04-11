"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DietCardSkeleton } from "@/modules/nutrition/components/DietCardSkeleton";
import { DietsEmptyState } from "@/modules/nutrition/components/DietsEmptyState";
import { DietsFilter } from "@/modules/nutrition/components/DietsFilter";
import { DietsHeader } from "@/modules/nutrition/components/DietsHeader";
import { DietCard, ImportDietModal } from "@/nutrition";
import { useDietPlans, useFinishDietPlan } from "@/shared/hooks/useNutrition";
import { useStudents } from "@/shared/hooks/useStudents";

export default function DietsPage() {
  const router = useRouter();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const { data: students = [] } = useStudents();
  const { data: dietPlans = [], isLoading } = useDietPlans(selectedStudentId);
  const finishMutation = useFinishDietPlan();

  const handleFinish = async (id: string) => {
    if (confirm("Tem certeza que deseja finalizar este plano?")) {
      await finishMutation.mutateAsync(id);
    }
  };

  const handleCreate = () => router.push("/dashboard/diets/new");
  const handleImport = () => setIsImportModalOpen(true);

  return (
    <div className="space-y-8 relative">
      <DietsHeader onCreateClick={handleCreate} onImportClick={handleImport} />

      <DietsFilter
        selectedStudentId={selectedStudentId}
        onStudentChange={setSelectedStudentId}
        students={students}
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <DietCardSkeleton key={i} />
          ))}
        </div>
      ) : dietPlans.length === 0 ? (
        <DietsEmptyState hasFilter={!!selectedStudentId} onCreateClick={handleCreate} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dietPlans.map((plan) => (
            <DietCard
              key={plan.id}
              dietPlan={plan}
              onDelete={() => handleFinish(plan.id)}
              onEdit={(id) => router.push(`/dashboard/diets/${id}`)}
              onView={(id) => router.push(`/dashboard/diets/${id}`)}
            />
          ))}
        </div>
      )}

      <ImportDietModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        targetStudentId={selectedStudentId}
      />
    </div>
  );
}
