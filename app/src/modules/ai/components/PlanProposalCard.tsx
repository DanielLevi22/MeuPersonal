import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '@/auth';
import { colors } from '@/constants/colors';
import { useWorkoutStore } from '@/modules/workout/store/workoutStore';

export interface PlanProposal {
  name: string;
  goal: string;
  durationWeeks: number;
  level: string;
  phases: { name: string; weeks: number; focus: string }[];
}

interface PlanProposalCardProps {
  proposal: PlanProposal;
  studentId: string;
  onApproved: (periodizationId: string) => void;
  onError?: (message: string) => void;
}

export function PlanProposalCard({
  proposal,
  studentId,
  onApproved,
  onError,
}: PlanProposalCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Criando...');
  const createPeriodization = useWorkoutStore((state) => state.createPeriodization);
  const { user } = useAuthStore();

  const handleApprove = async () => {
    if (!user?.id) {
      return;
    }

    setIsApproving(true);
    try {
      setLoadingStatus('Criando Periodização...');

      // 1. Create the Periodization (structure only — fast)
      const periodization = await createPeriodization({
        name: proposal.name,
        student_id: studentId,
        specialist_id: user.id,
        objective: ((
          {
            Hipertrofia: 'hypertrophy',
            Força: 'strength',
            Emagrecimento: 'weight_loss',
            Resistência: 'conditioning',
          } as const
        )[
          (['Hipertrofia', 'Força', 'Emagrecimento', 'Resistência'].includes(proposal.goal)
            ? proposal.goal
            : 'Hipertrofia') as string
        ] || 'hypertrophy') as 'hypertrophy' | 'strength' | 'weight_loss' | 'conditioning',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + proposal.durationWeeks * 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        status: 'active',
      });

      // 2. Create the Training Plans (Phases) — structure only, NO workout generation
      if (periodization && proposal.phases.length > 0) {
        const { createTrainingPlan } = useWorkoutStore.getState();
        let currentDate = new Date();

        for (let i = 0; i < proposal.phases.length; i++) {
          const phase = proposal.phases[i];
          setLoadingStatus(`Criando fase ${i + 1}/${proposal.phases.length}...`);

          const endDate = new Date(currentDate.getTime() + phase.weeks * 7 * 24 * 60 * 60 * 1000);

          await createTrainingPlan({
            periodization_id: periodization.id,
            name: phase.name,
            start_date: currentDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            status: 'planned',
            order_index: i,
          });

          currentDate = endDate;
        }
      }

      setIsDone(true);
      onApproved(periodization.id);
    } catch (error: unknown) {
      const msg = `Erro ao criar plano: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
      if (onError) onError(msg);
      else alert(msg);
      console.error(error);
    } finally {
      setIsApproving(false);
    }
  };

  if (isDone) {
    return (
      <View className="bg-emerald-900/30 p-4 rounded-2xl border border-emerald-500/30 items-center flex-row gap-3">
        <View className="bg-emerald-500/20 p-2 rounded-full">
          <Ionicons name="checkmark" size={20} color={colors.status.success} />
        </View>
        <View>
          <Text className="text-white font-bold">Periodização Criada!</Text>
          <Text className="text-zinc-400 text-xs">
            Agora vamos definir os treinos e exercícios.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden my-2">
      {/* Header */}
      <View className="bg-zinc-950 p-4 border-b border-zinc-800 flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <Ionicons name="sparkles" size={16} color="#A855F7" />
          <Text className="text-white font-bold uppercase tracking-wider text-xs">
            Periodização Proposta
          </Text>
        </View>
        <Text className="text-zinc-500 text-xs">{proposal.durationWeeks} semanas</Text>
      </View>

      {/* Body */}
      <View className="p-5">
        <Text className="text-2xl font-black text-white font-display mb-1">{proposal.name}</Text>
        <Text className="text-zinc-400 mb-4 text-sm">
          {proposal.goal} • {proposal.level}
        </Text>

        {/* Phases Preview */}
        <View className="gap-2 mb-6">
          {proposal.phases.map((phase, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: phases have no stable ID
            <View key={index} className="flex-row items-center gap-3">
              <View className="w-6 h-6 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700">
                <Text className="text-xs text-zinc-400 font-bold">{index + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-sm">{phase.name}</Text>
                <Text className="text-zinc-500 text-xs truncate" numberOfLines={1}>
                  {phase.focus}
                </Text>
              </View>
              <Text className="text-zinc-600 text-xs">{phase.weeks} sem</Text>
            </View>
          ))}
        </View>

        {/* Stage hint */}
        <Text className="text-zinc-500 text-xs mb-4 italic">
          Após aprovar, vamos definir a divisão de treino e os exercícios.
        </Text>

        {/* Action */}
        <TouchableOpacity
          onPress={handleApprove}
          disabled={isApproving}
          className="w-full bg-purple-600 py-3 rounded-xl items-center flex-row justify-center gap-2 active:bg-purple-700"
        >
          {isApproving ? (
            <>
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white text-xs font-bold">{loadingStatus}</Text>
            </>
          ) : (
            <>
              <Text className="text-white font-bold uppercase tracking-wide text-xs">
                Aprovar Periodização
              </Text>
              <Ionicons name="arrow-forward" size={14} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
