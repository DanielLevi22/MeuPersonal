"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCreateDietPlanWithStrategy } from "@/shared/hooks/useNutrition";
import { useStudents } from "@/shared/hooks/useStudents";
import {
  calculateDietStrategy,
  DIET_STRATEGIES,
  type DietStrategyType,
} from "@/shared/utils/dietStrategies";

const DAYS_NAME = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface MacroRingProps {
  label: string;
  value: number;
  max: number;
  color: string;
  unit: string;
  icon: React.ReactNode;
}

const MacroRing = ({ label, value, max, color, unit, icon }: MacroRingProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Track */}
        <svg className="w-full h-full -rotate-90">
          <circle cx="48" cy="48" r={radius} className="stroke-white/5 fill-none" strokeWidth="6" />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            cx="48"
            cy="48"
            r={radius}
            className="fill-none transition-all duration-300"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={`p-1.5 rounded-lg mb-0.5 group-hover:scale-110 transition-transform`}
            style={{ color }}
          >
            {icon}
          </div>
          <div className="text-lg font-black text-white italic tracking-tighter leading-none">
            {value}
          </div>
          <div className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NewDietPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState<DietStrategyType>("standard");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [targetCalories, setTargetCalories] = useState(2000);

  const [protein, setProtein] = useState(150);
  const [carbs, setCarbs] = useState(200);
  const [fat, setFat] = useState(60);

  const { data: students = [] } = useStudents();
  const createMutation = useCreateDietPlanWithStrategy();

  const strategyDetails = useMemo(() => {
    return calculateDietStrategy(selectedStrategy, targetCalories);
  }, [selectedStrategy, targetCalories]);

  useEffect(() => {
    setProtein(strategyDetails.averageMacros.protein);
    setCarbs(strategyDetails.averageMacros.carbs);
    setFat(strategyDetails.averageMacros.fat);
  }, [strategyDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    try {
      await createMutation.mutateAsync({
        plan: {
          name,
          student_id: studentId,
          personal_id: "",
          plan_type: selectedStrategy === "carb_cycling" ? "cyclic" : "unique",
          start_date: startDate,
          end_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
            .toISOString()
            .split("T")[0],
          target_calories: targetCalories,
          target_protein: protein,
          target_carbs: carbs,
          target_fat: fat,
        },
        strategyData: strategyDetails,
      });
      toast.success("Plano nutricional criado com sucesso!");
      router.push("/dashboard/diets");
    } catch (error: any) {
      console.error("Error creating diet plan:", error);
      toast.error(error.message || "Erro ao criar plano nutricional");
    }
  };

  return (
    <div className="relative text-zinc-300">
      {/* Visual Background layers */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      {/* Floating Header */}
      <nav className="sticky top-0 z-50 py-4">
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/5 rounded-[32px] p-4 flex items-center justify-between shadow-2xl shadow-black/50">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="w-12 h-12 flex items-center justify-center bg-zinc-950 border border-white/5 rounded-2xl hover:border-primary/50 transition-all text-zinc-500 hover:text-white"
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
            <div className="border-l border-white/5 pl-6">
              <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">
                Macro<span className="text-primary">Architecture</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">
                Advanced Nutrition Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end pr-6 border-r border-white/5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Protocolo Ativo
              </span>
              <span className="text-sm font-black text-primary italic uppercase">
                {DIET_STRATEGIES[selectedStrategy].label}
              </span>
            </div>
            <button
              form="architecture-master-form"
              type="submit"
              disabled={createMutation.isPending || !studentId || !name}
              className="px-8 py-3.5 bg-primary text-black rounded-2xl font-black italic uppercase tracking-widest text-xs hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-30 disabled:hover:scale-100"
            >
              {createMutation.isPending ? "Deploying..." : "Liberar Dieta"}
            </button>
          </div>
        </div>
      </nav>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 relative z-10">
        {/* Left pane: Protocols & Workspace */}
        <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Section 1: Protocols */}
          <section className="bg-zinc-900/40 border border-white/5 rounded-[48px] p-8 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 bg-primary rounded-full shadow-[0_0_10px_#ccff00]" />
              <h2 className="text-lg font-black text-white italic uppercase tracking-tight">
                Arquitetura de Protocolo
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.keys(DIET_STRATEGIES) as DietStrategyType[]).map((strategy) => {
                const isSelected = selectedStrategy === strategy;
                const config = DIET_STRATEGIES[strategy];
                return (
                  <motion.button
                    key={strategy}
                    layout
                    onClick={() => setSelectedStrategy(strategy)}
                    className={`group relative p-6 rounded-[32px] border text-left transition-all duration-300 overflow-hidden ${
                      isSelected
                        ? "bg-primary/5 border-primary/50 shadow-2xl shadow-primary/10"
                        : "bg-zinc-950/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-all ${isSelected ? "bg-primary text-black shadow-lg shadow-primary/30" : "bg-zinc-900 text-zinc-600 group-hover:bg-zinc-800"}`}
                      >
                        {strategy === "standard" && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
                          </svg>
                        )}
                        {strategy === "carb_cycling" && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,6V9L16,5L12,1V4A8,8 0 0,0 4,12C4,14.21 4.9,16.21 6.34,17.65L7.75,16.24C6.67,15.16 6,13.66 6,12A6,6 0 0,1 12,6M16.25,7.76L17.66,6.35C19.1,7.79 20,9.79 20,12A8,8 0 0,1 12,20V17L8,21L12,25V22A10,10 0 0,0 22,12C22,9.24 20.9,6.74 19.1,5.05L16.25,7.76Z" />
                          </svg>
                        )}
                        {strategy === "ketogenic" && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.66,11.2C17.43,10.9 17.15,10.61 16.85,10.33l-0.12,-0.11 -0.13,-0.11L16.47,10l-0.13,-0.1 -0.14,-0.1 -0.14,-0.09L15.93,9.63l-0.14,-0.08L15.65,9.47l-0.15,-0.08 -0.15,-0.07L15.2,9.26l-0.15,-0.07L14.9,9.13l-0.16,-0.06L14.58,9l-0.16,-0.05L14.26,8.91C12.72,8.47 11.23,8.7 9.87,9.37l-0.2,0.1 0.1,0.2c0.41,0.85 0.54,1.82 0.44,2.83 -0.19,2.15 -1.24,4.11 -2.71,5.65L7.33,18.32 7.5,18.52c1.17,1.4 2.82,2.37 4.6,2.71l0.3,0.06 0.05,-0.3c0.11,-0.6 0.28,-1.19 0.51,-1.76l0.29,-0.74 0.77,0.24c0.14,0.04 0.28,0.08 0.42,0.12l0.28,0.08 0.06,-0.28c0.12,-0.6 0.16,-1.2 0.14,-1.82 -0.01,-0.2 -0.02,-0.4 -0.04,-0.6 -0.15,-1.72 -1.04,-3.21 -2.33,-4.2l-0.53,-0.4 0.45,-0.49c0.42,-0.46 0.94,-0.83 1.5,-1.11C14.77,9.8,15.75,9.74,16.63,10c0.31,0.09 0.6,0.22 0.88,0.4l0.15,0.1 0.15,-0.18c0.27,-0.34 0.49,-0.71 0.65,-1.12z" />
                          </svg>
                        )}
                        {strategy === "intermittent_fasting" && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22M12,7V12L15,15" />
                          </svg>
                        )}
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-primary neon-glow-primary"
                        >
                          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M10,17L5,12L6.41,10.59L10,14.17L17.59,6.58L19,8L10,17Z" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                    <div className="mt-6">
                      <h3
                        className={`text-base font-black italic uppercase transition-colors ${isSelected ? "text-white" : "text-zinc-500"}`}
                      >
                        {config.label}
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-medium leading-relaxed mt-1">
                        {config.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -mr-16 -mt-16" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Section 2: Technical Inputs */}
          <form
            id="architecture-master-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="bg-zinc-900/40 border border-white/5 rounded-[40px] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-secondary rounded-full shadow-[0_0_10px_#00f0ff]" />
                <h2 className="text-lg font-black text-white italic uppercase tracking-tight">
                  Identidade
                </h2>
              </div>
              <div className="space-y-6">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1 group-focus-within:text-primary transition-colors">
                    Nome da Estrutura
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-white/5 rounded-[24px] px-6 py-5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-zinc-700 font-bold"
                    placeholder="Ex: Ultra Cutting v1"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      Aluno Alvo
                    </label>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase italic tracking-tighter">
                      * Apenas alunos ativos
                    </span>
                  </div>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-white/5 rounded-[24px] px-6 py-5 text-white focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer font-bold appearance-none"
                    required
                  >
                    <option value="">Selecione um Aluno</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 rounded-[40px] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-accent rounded-full shadow-[0_0_10px_#ff0099]" />
                <h2 className="text-lg font-black text-white italic uppercase tracking-tight">
                  Deployment
                </h2>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">
                    Data de ativação
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-white/5 rounded-[20px] px-6 py-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-[24px]">
                  <p className="text-[9px] text-zinc-500 leading-relaxed font-medium italic">
                    * Este plano terá duração base de{" "}
                    <span className="text-zinc-300 font-bold">30 dias</span>. Você poderá estender
                    ou recalcular este período após o deployment.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right pane: Real-time Stats & Preview */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="sticky top-32 space-y-6 animate-in fade-in slide-in-from-right-8 duration-1000">
            {/* Macro Rings Section */}
            <div className="bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-[32px] p-5 shadow-3xl">
              <div className="text-center mb-6 space-y-1">
                <div className="inline-flex flex-col items-center">
                  <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.4em]">
                    Avg Macro Mix
                  </span>
                  <div className="text-3xl font-black text-primary italic font-display tracking-tight my-1">
                    {targetCalories}
                    <span className="text-xs ml-1 text-zinc-600">kcal</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="range"
                    min="1200"
                    max="5000"
                    step="50"
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(Number(e.target.value))}
                    className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="grid grid-cols-3 gap-2 bg-zinc-950/50 p-2 rounded-[24px] border border-white/5">
                  <MacroRing
                    label="Proteína"
                    value={protein}
                    max={300}
                    color="#10b981"
                    unit="g"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
                      </svg>
                    }
                  />
                  <MacroRing
                    label="Carbos"
                    value={carbs}
                    max={600}
                    color="#3b82f6"
                    unit="g"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,6V9L16,5L12,1V4A8,8 0 0,0 4,12C4,14.21 4.9,16.21 6.34,17.65L7.75,16.24C6.67,15.16 6,13.66 6,12A6,6 0 0,1 12,6M16.25,7.76L17.66,6.35C19.1,7.79 20,9.79 20,12A8,8 0 0,1 12,20V17L8,21L12,25V22A10,10 0 0,0 22,12C22,9.24 20.9,6.74 19.1,5.05L16.25,7.76Z" />
                      </svg>
                    }
                  />
                  <MacroRing
                    label="Gordura"
                    value={fat}
                    max={150}
                    color="#eab308"
                    unit="g"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.26,8.91C12.72,8.47 11.23,8.7 9.87,9.37l-0.2,0.1 0.1,0.2c0.41,0.85 0.54,1.82 0.44,2.83 -0.19,2.15 -1.24,4.11 -2.71,5.65L7.33,18.32 7.5,18.52c1.17,1.4 2.82,2.37 4.6,2.71l0.3,0.06 0.05,-0.3c0.11,-0.6 0.28,-1.19 0.51,-1.76l0.29,-0.74 0.77,0.24c0.14,0.04 0.28,0.08 0.42,0.12l0.28,0.08 0.06,-0.28c0.12,-0.6 0.16,-1.2 0.14,-1.82 -0.01,-0.2 -0.02,-0.4 -0.04,-0.6 -0.15,-1.72 -1.04,-3.21 -2.33,-4.2l-0.53,-0.4 0.45,-0.49c0.42,-0.46 0.94,-0.83 1.5,-1.11C14.77,9.8,15.75,9.74,16.63,10c0.31,0.09 0.6,0.22 0.88,0.4" />
                      </svg>
                    }
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                    Previsão Semanal
                  </span>
                  <span className="text-[9px] text-primary/60 font-black italic">
                    Deployment View
                  </span>
                </div>
                <div className="space-y-1.5 h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {strategyDetails.weeklySchedule.map((day) => (
                    <div
                      key={day.dayOfWeek}
                      className="group p-3 bg-zinc-950/40 hover:bg-zinc-950 transition-all border border-white/[0.03] hover:border-white/10 rounded-xl flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black italic ${day.dayOfWeek === 0 || day.dayOfWeek === 6 ? "bg-orange-500/10 text-orange-500" : "bg-primary/20 text-primary"}`}
                        >
                          {DAYS_NAME[day.dayOfWeek]}
                        </div>
                        <div>
                          <div className="text-xs font-black text-white italic leading-tight uppercase tracking-tight">
                            {day.label}
                          </div>
                          <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">
                            {day.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-white italic tracking-tighter">
                          {day.macros.calories}
                        </div>
                        <div className="text-[7px] font-bold text-zinc-600 flex gap-1 uppercase">
                          <span>P:{day.macros.protein}g</span>
                          <span>C:{day.macros.carbs}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
