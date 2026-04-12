"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteDietPlanModal } from "@/modules/nutrition/components/DeleteDietPlanModal";
import { DietCardSkeleton } from "@/modules/nutrition/components/DietCardSkeleton";
import { DietsEmptyState } from "@/modules/nutrition/components/DietsEmptyState";
import { DietsFilter } from "@/modules/nutrition/components/DietsFilter";
import { DietsHeader } from "@/modules/nutrition/components/DietsHeader";
import { DietCard, ImportDietModal } from "@/nutrition";
import { useAuthUser, useDeleteDietPlan, useDietPlans } from "@/shared/hooks";
import { useStudents } from "@/shared/hooks/useStudents";

export default function DietsPage() {
  const router = useRouter();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const { data: students = [] } = useStudents();
  const { isLoading: isAuthLoading } = useAuthUser();
  const { data: dietPlans = [], isLoading: isDietsLoading } = useDietPlans(selectedStudentId);
  const deleteMutation = useDeleteDietPlan();

  const isLoading = isAuthLoading || isDietsLoading;
  const [selectedPlanForDelete, setSelectedPlanForDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setSelectedPlanForDelete(id);
  };

  const confirmDelete = async () => {
    if (!selectedPlanForDelete) return;

    try {
      await deleteMutation.mutateAsync(selectedPlanForDelete);
      toast.success("Plano excluído com sucesso.");
      setSelectedPlanForDelete(null);
    } catch (_error) {
      toast.error("Erro ao excluir plano.");
    }
  };

  const planToDelete = dietPlans.find((p) => p.id === selectedPlanForDelete);

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
              onDelete={(id) => handleDelete(id)}
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

      <DeleteDietPlanModal
        isOpen={!!selectedPlanForDelete}
        onClose={() => setSelectedPlanForDelete(null)}
        onConfirm={confirmDelete}
        planName={planToDelete?.name || ""}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
