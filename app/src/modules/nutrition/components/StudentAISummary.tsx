import type { DietPlan } from '@elevapro/core';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { AnalysisService } from '../services/AnalysisService';

interface StudentAISummaryProps {
  studentId: string;
  studentName: string;
  currentPlan: DietPlan | null;
}

export function StudentAISummary({ studentId, studentName, currentPlan }: StudentAISummaryProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!currentPlan) return;
    setLoading(true);
    try {
      const stats = await AnalysisService.getWeeklyStats(studentId, currentPlan);
      const result = await AnalysisService.generateSummary(studentName, stats, currentPlan.name);
      setSummary(result);
    } catch (_error) {
      setSummary('Erro ao gerar análise. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentPlan) return null;

  return (
    <View className="mb-6">
      <LinearGradient
        colors={['#2A1B3D', '#1A1025']}
        className="rounded-3xl p-5 border border-purple-500/30"
      >
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="sparkles" size={20} color="#D8B4FE" />
            <Text className="text-white font-bold text-lg">Análise Semanal (IA)</Text>
          </View>

          <TouchableOpacity
            onPress={handleGenerate}
            disabled={loading}
            className="bg-purple-600 px-3 py-1.5 rounded-full"
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-xs font-bold">
                {summary ? 'Atualizar' : 'Gerar Análise'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {summary ? (
          <Text className="text-zinc-300 leading-relaxed text-sm">{summary}</Text>
        ) : (
          <View className="items-center py-4 opacity-50">
            <Ionicons name="analytics-outline" size={40} color="#A1A1AA" />
            <Text className="text-zinc-500 text-xs mt-2 text-center">
              Toque em "Gerar" para a IA analisar o desempenho{'\n'}desta semana.
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
