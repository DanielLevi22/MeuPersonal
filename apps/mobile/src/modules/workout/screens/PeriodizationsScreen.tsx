import { useAuthStore } from '@/auth';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MuscleFilterCarousel } from '@/components/workout/MuscleFilterCarousel';
import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

const MUSCLE_IMAGES: Record<string, any> = {
  'Peito': require('../../../../assets/workouts/chest.png'),
  'Costas': require('../../../../assets/workouts/back.png'),
  'Pernas': require('../../../../assets/workouts/legs.png'),
  'Braços': require('../../../../assets/workouts/arms.png'),
  'Ombros': require('../../../../assets/workouts/shoulders.png'),
  'Abdominais': require('../../../../assets/workouts/abs.png'),
  'Geral': require('../../../../assets/workouts/back.png'),
};

const PERIODIZATION_IMAGES: Record<string, any> = {
  'strength': require('../../../../assets/workouts/back.png'),
  'hypertrophy': require('../../../../assets/workouts/chest.png'),
  'adaptation': require('../../../../assets/workouts/arms.png'),
  'default': require('../../../../assets/workouts/shoulders.png'),
};

export default function PeriodizationsScreen() {
  const router = useRouter();
  const { user, accountType } = useAuthStore();
  const { periodizations, libraryWorkouts, isLoading, fetchPeriodizations, fetchWorkouts } = useWorkoutStore();
  const [viewMode, setViewMode] = useState<'periodizations' | 'library'>('periodizations');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const filteredWorkouts = useMemo(() => {
    if (!selectedMuscle) return libraryWorkouts;
    return libraryWorkouts.filter(w => w.muscle_group === selectedMuscle);
  }, [libraryWorkouts, selectedMuscle]);


  useEffect(() => {
    if (user?.id) {
      if (viewMode === 'periodizations') {
        fetchPeriodizations(user.id);
      } else {
        fetchWorkouts(user.id);
      }
    }
  }, [user, viewMode]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#00C9A7';
      case 'intermediate': return '#FFB800';
      case 'advanced': return '#FF2E63';
      default: return '#00D9FF';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return difficulty;
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <PremiumCard
        title={item.name || 'Sem nome'}
        subtitle={`Periodização • ${item.phases_count || 0} Fases`}
        image={PERIODIZATION_IMAGES[item.type] || PERIODIZATION_IMAGES['default']}
        onPress={() => router.push(`/(tabs)/workouts/periodizations/${item.id}` as any)}
        badge={<StatusBadge status={item.status} />}
        containerStyle={{ marginBottom: 24 }}
      >
        <View className="flex-row items-center justify-between mt-4">
          <View className="flex-row items-center bg-black/40 px-3 py-2 rounded-xl border border-white/5">
            <Ionicons name="calendar-outline" size={14} color={colors.primary.start} style={{ marginRight: 8 }} />
            <Text className="text-white/90 text-[10px] font-bold uppercase tracking-widest">
              {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-orange-500 font-bold text-xs mr-1 uppercase" style={{ color: colors.primary.start }}>Gerenciar</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary.start} />
          </View>
        </View>
      </PremiumCard>
    );
  };

  const renderWorkoutItem = ({ item }: { item: any }) => {
    const muscleGroup = item.muscle_group || 'Geral';
    const bgImage = MUSCLE_IMAGES[muscleGroup] || MUSCLE_IMAGES['Geral'];

    return (
      <PremiumCard
        title={item.title}
        subtitle={`${muscleGroup} • ${getDifficultyLabel(item.difficulty)}`}
        image={bgImage}
        onPress={() => router.push(`/(tabs)/workouts/${item.id}` as any)}
        containerStyle={{ marginBottom: 24 }}
        badge={
          <View 
            className="px-3 py-1 rounded-full border border-white/10 self-start"
            style={{ backgroundColor: `${getDifficultyColor(item.difficulty)}40` }}
          >
            <Text 
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: getDifficultyColor(item.difficulty) }}
            >
              {getDifficultyLabel(item.difficulty)}
            </Text>
          </View>
        }
      >
        <View className="flex-row items-center justify-between mt-4">
          <View className="flex-row items-center bg-black/40 px-3 py-2 rounded-xl border border-white/5">
            <Ionicons name="time-outline" size={14} color={colors.secondary.main} style={{ marginRight: 8 }} />
            <Text className="text-white/90 text-[10px] font-bold uppercase tracking-widest">
              {item.duration_minutes || 60} MIN
            </Text>
            <View className="w-[1px] h-3 bg-white/20 mx-3" />
            <Ionicons name="apps-outline" size={14} color={colors.primary.start} style={{ marginRight: 8 }} />
            <Text className="text-white/90 text-[10px] font-bold uppercase tracking-widest">
              {(item.items?.length || item.exercises_count || 0)} EXERCÍCIOS
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-orange-500 font-bold text-xs mr-1 uppercase" style={{ color: colors.primary.start }}>Ver</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary.start} />
          </View>
        </View>
      </PremiumCard>
    );
  };

  return (
    <ScreenLayout>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-4xl font-extrabold text-white mb-0.5 font-display tracking-tight">
              {viewMode === 'periodizations' ? 'Alunos' : 'Treinos'}
            </Text>
            <Text className="text-sm text-zinc-400 font-sans">
              {viewMode === 'periodizations' ? 'Gestão de Planejamento' : 'Biblioteca de Modelos'}
            </Text>
          </View>
          
          {accountType === 'professional' && (
            <Link href={viewMode === 'periodizations' ? '/(tabs)/workouts/create-periodization' : '/(tabs)/workouts/create' as any} asChild>
              <TouchableOpacity activeOpacity={0.8}>
                <LinearGradient
                  colors={['#FF6B35', '#FF2E63']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="h-12 w-12 rounded-full items-center justify-center shadow-lg shadow-orange-500/20"
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </Link>
          )}
        </View>

        {/* View Switcher (Segmented Control) */}
        {accountType === 'professional' && (
          <View className="bg-zinc-900/80 p-1.5 rounded-2xl flex-row mb-6 border border-zinc-800">
            <TouchableOpacity 
              onPress={() => setViewMode('periodizations')}
              className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${viewMode === 'periodizations' ? 'bg-zinc-800 shadow-sm' : ''}`}
            >
              <Ionicons name="people" size={16} color={viewMode === 'periodizations' ? '#FF6B35' : '#71717A'} style={{marginRight: 8}} />
              <Text className={`font-bold text-xs uppercase tracking-widest ${viewMode === 'periodizations' ? 'text-white' : 'text-zinc-500'}`}>
                Alunos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setViewMode('library')}
              className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${viewMode === 'library' ? 'bg-zinc-800 shadow-sm' : ''}`}
            >
              <Ionicons name="library" size={16} color={viewMode === 'library' ? '#FF6B35' : '#71717A'} style={{marginRight: 8}} />
              <Text className={`font-bold text-xs uppercase tracking-widest ${viewMode === 'library' ? 'text-white' : 'text-zinc-500'}`}>
                Biblioteca
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Muscle Filters (Visible only in Library mode) */}
      {viewMode === 'library' && (
        <MuscleFilterCarousel 
          selectedMuscle={selectedMuscle} 
          onSelectMuscle={setSelectedMuscle}
          containerStyle={{ marginBottom: 24 }}
        />
      )}

      {/* Content */}
      <FlatList
        data={viewMode === 'periodizations' ? periodizations.filter(p => p.status === 'active') : filteredWorkouts}
        renderItem={viewMode === 'periodizations' ? renderItem : renderWorkoutItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={() => {
              if (user?.id) {
                if (viewMode === 'periodizations') fetchPeriodizations(user.id);
                else fetchWorkouts(user.id);
              }
            }} 
            tintColor="#FF6B35" 
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 justify-center items-center py-20">
              <View className="bg-zinc-900 p-8 rounded-full mb-6 border border-zinc-800">
                <Ionicons name={viewMode === 'periodizations' ? "calendar-outline" : "barbell-outline"} size={64} color="#52525B" />
              </View>
              <Text className="text-white text-xl font-bold mb-2 text-center font-display">
                {viewMode === 'periodizations' ? 'Nenhuma periodização ativa' : 'Nenhum modelo de treino'}
              </Text>
              <Text className="text-zinc-400 text-center px-8 text-sm mb-8 font-sans">
                {viewMode === 'periodizations' 
                  ? (accountType === 'professional' ? 'Crie um planejamento para seus alunos' : 'Seu personal ainda não criou uma periodização')
                  : 'Crie modelos de treino para usar em suas periodizações'}
              </Text>
              
              {accountType === 'professional' && (
                <Link href={viewMode === 'periodizations' ? '/(tabs)/workouts/create-periodization' : '/(tabs)/workouts/create' as any} asChild>
                  <TouchableOpacity activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#FF6B35', '#FF2E63']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="rounded-2xl py-3 px-6 shadow-lg shadow-orange-500/20"
                    >
                      <Text className="text-white text-base font-bold font-display">
                        {viewMode === 'periodizations' ? 'Criar Periodização' : 'Criar Modelo'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Link>
              )}
            </View>
          ) : (
            <View className="py-20">
              <ActivityIndicator size="large" color="#FF6B35" />
            </View>
          )
        }
      />
    </ScreenLayout>
  );
}
