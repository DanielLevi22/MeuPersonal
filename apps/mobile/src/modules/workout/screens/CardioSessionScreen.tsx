import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { ShareWorkoutModal } from '@/components/workout/ShareWorkoutModal';
import { WorkoutFeedbackModal } from '@/components/workout/WorkoutFeedbackModal';
import { supabase } from '@/lib/supabase';
import { useGamificationStore } from '@/store/gamificationStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

// METs aproximados
const METS: Record<string, number> = {
  'Caminhada': 3.5,
  'Corrida': 8.0,
  'Bicicleta': 6.0,
  'Elíptico': 5.0,
  'Natação': 7.0,
  'Cardio': 5.0, // Default
};

export default function CardioSessionScreen() {
  const { id, exerciseId, exerciseName, muscleGroup } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { updateWorkoutProgress } = useGamificationStore();
  const { saveCardioSession } = useWorkoutStore();

  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [calories, setCalories] = useState(0);
  const [intensity, setIntensity] = useState<'Baixa' | 'Moderada' | 'Alta'>('Moderada');
  
  // Timestamp-based tracking
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [lastFeedbackTime, setLastFeedbackTime] = useState(0);

  const [targetMinutes, setTargetMinutes] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareStats, setShareStats] = useState({
    title: '',
    duration: '',
    calories: '',
    date: '',
    exerciseName: ''
  });

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // User weight state (default 70kg)
  const [userWeight, setUserWeight] = useState(70);

  useEffect(() => {
    async function fetchUserWeight() {
        if (!user?.id) return;

        try {
            // First try to get from profile
            const { data, error } = await supabase
                .from('profiles')
                .select('weight')
                .eq('id', user.id)
                .single();
            
            if (data?.weight) {
                setUserWeight(data.weight);
            } else {
                // If not in profile, try to get from latest assessment
                const { data: assessment } = await supabase
                    .from('physical_assessments')
                    .select('weight')
                    .eq('student_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (assessment?.weight) {
                    setUserWeight(assessment.weight);
                }
            }
        } catch (error) {
            console.log('Error fetching weight:', error);
        }
    }

    fetchUserWeight();
  }, [user?.id]);

  const met = METS[exerciseName as string] || METS['Cardio'] || 5.0;

  // Accelerometer logic
  useEffect(() => {
    let subscription: any;
    if (isActive) {
      Accelerometer.setUpdateInterval(1000); // Check every second
      subscription = Accelerometer.addListener(data => {
        const { x, y, z } = data;
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        
        // Simple heuristic for intensity based on movement magnitude
        // 1.0 is gravity (standing still)
        let newIntensity: 'Baixa' | 'Moderada' | 'Alta' = 'Baixa';
        if (magnitude > 1.8) {
          newIntensity = 'Alta';
        } else if (magnitude > 1.2) {
          newIntensity = 'Moderada';
        }

        if (newIntensity !== intensity) {
          setIntensity(newIntensity);
          Speech.speak(`Intensidade ${newIntensity}`, { language: 'pt-BR' });
        }
      });
    }
    return () => subscription && subscription.remove();
  }, [isActive, intensity]);

  useEffect(() => {
    let interval: any;
    if (isActive && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diffSeconds = Math.floor((now - startTime) / 1000);
        const totalSeconds = accumulatedSeconds + diffSeconds;
        
        setSeconds(totalSeconds);

        // Calculate calories: MET * Weight(kg) * Time(hours)
        const calsPerSec = (met * userWeight) / 3600;
        setCalories(totalSeconds * calsPerSec);

        // Target Time Feedback
        if (targetMinutes && totalSeconds === targetMinutes * 60) {
          Speech.speak(`Parabéns! Você atingiu sua meta de ${targetMinutes} minutos.`, {
            language: 'pt-BR',
          });
        }

        // Voice Feedback every 5 minutes (300 seconds)
        // Check if we crossed a 5-minute threshold since the last feedback
        if (totalSeconds >= lastFeedbackTime + 300) {
          const mins = Math.floor(totalSeconds / 60);
          const cals = Math.round(totalSeconds * calsPerSec);
          
          Speech.speak(`Você já treinou ${mins} minutos e gastou ${cals} calorias. Continue assim!`, {
            language: 'pt-BR',
          });
          
          // Update last feedback time to the current 5-minute mark
          // This prevents spamming if the app was in background for a long time
          const nextFeedbackMark = Math.floor(totalSeconds / 300) * 300;
          setLastFeedbackTime(nextFeedbackMark);
        }

      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime, accumulatedSeconds, met, userWeight, targetMinutes, lastFeedbackTime]);

  // Track the absolute start time of the session for the API
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  const handleStart = () => {
    setIsActive(true);
    setStartTime(Date.now());
    if (!sessionStartTime) setSessionStartTime(new Date());
  };

  const handlePause = () => {
    setIsActive(false);
    if (startTime) {
      const now = Date.now();
      const diffSeconds = Math.floor((now - startTime) / 1000);
      setAccumulatedSeconds(prev => prev + diffSeconds);
      setStartTime(null);
    }
  };

  const handlePresetSelect = (min: number) => {
    if (targetMinutes === min) {
      setTargetMinutes(null);
      setCustomMinutes('');
    } else {
      setTargetMinutes(min);
      setCustomMinutes(min.toString());
    }
  };

  const handleCustomChange = (text: string) => {
    setCustomMinutes(text);
    const val = parseInt(text);
    if (!isNaN(val) && val > 0) {
      setTargetMinutes(val);
    } else {
      setTargetMinutes(null);
    }
  };

  const onFeedbackSubmit = async (intensity: number, notes: string) => {
    setShowFeedbackModal(false);
    
    if (!user?.id || !sessionStartTime) return;

    const endTime = new Date();
    const finalCalories = Math.round(calories);
    const finalTime = formatTime(seconds);
    const finalExerciseName = (exerciseName as string) || 'Cardio Livre';

    try {
      // Save session
      await saveCardioSession({
        studentId: user.id,
        exerciseName: finalExerciseName,
        durationSeconds: seconds,
        calories: calories,
        startedAt: sessionStartTime.toISOString(),
        completedAt: endTime.toISOString(),
        intensity,
        notes
      });

      // Update gamification
      await updateWorkoutProgress(1);

      Alert.alert(
        'Treino Salvo! 🎉',
        `Tempo: ${finalTime}\nCalorias: ${finalCalories} kcal`,
        [
          {
            text: 'Sair',
            style: 'cancel',
            onPress: () => router.navigate('/(tabs)/cardio')
          },
          {
            text: 'Compartilhar 📸',
            onPress: () => {
              setShareStats({
                title: 'Cardio Finalizado',
                duration: finalTime,
                calories: `${finalCalories} kcal`,
                date: new Date().toLocaleDateString('pt-BR'),
                exerciseName: finalExerciseName
              });
              setShowShareModal(true);
            }
          }
        ]
      );

    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro ao salvar treino.');
    }
  };

  const handleFinish = () => {
    handlePause();
    setShowFeedbackModal(true);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours > 0 ? `${hours}:` : ''}${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <ScreenLayout>
      <View className="flex-1 p-6 justify-between">
        {/* Header */}
        <View className="items-center mt-4">
          <Text className="text-zinc-400 text-lg font-sans uppercase tracking-widest">
            Sessão de Cardio
          </Text>
          <Text className="text-white text-3xl font-bold font-display mt-2 text-center">
            {exerciseName || 'Exercício Livre'}
          </Text>
          <View className="bg-zinc-800 px-3 py-1 rounded-full mt-3">
            <Text className="text-zinc-400 text-xs font-bold">
              Intensidade: <Text className="text-orange-500">{intensity}</Text>
            </Text>
          </View>
        </View>

        {/* Main Stats */}
        <View className="items-center justify-center">
          {/* Timer Circle */}
          <View className="w-64 h-64 rounded-full border-8 border-zinc-800 items-center justify-center mb-8 relative">
            <View className="absolute w-full h-full rounded-full border-8 border-orange-500 opacity-20" />
            <Text className="text-6xl font-mono font-bold text-white tracking-tighter">
              {formatTime(seconds)}
            </Text>
            <Text className="text-zinc-500 text-sm font-bold uppercase mt-2">
              {targetMinutes ? `Meta: ${targetMinutes} min` : 'Duração'}
            </Text>
          </View>

          {/* Calories */}
          <View className="flex-row items-end">
            <Text className="text-5xl font-bold text-white font-display">
              {Math.round(calories)}
            </Text>
            <Text className="text-zinc-500 text-lg font-bold mb-2 ml-2">
              kcal
            </Text>
          </View>
          <Text className="text-zinc-600 text-xs mt-1">
            Estimado (~{met} METs)
          </Text>
        </View>

        {/* Target Time Selection (Only when not active and 0 seconds) */}
        {!isActive && seconds === 0 && (
          <View className="mb-4 w-full">
            <Text className="text-zinc-400 text-xs font-bold uppercase mb-3 text-center">
              Definir Meta de Tempo
            </Text>
            
            {/* Presets */}
            <View className="flex-row flex-wrap justify-center gap-3 mb-4">
              {[15, 30, 45, 60].map((min) => (
                <TouchableOpacity
                  key={min}
                  onPress={() => handlePresetSelect(min)}
                  className={`px-5 py-2 rounded-xl border ${
                    targetMinutes === min 
                      ? 'bg-orange-500 border-orange-500' 
                      : 'bg-zinc-800 border-zinc-700'
                  }`}
                >
                  <Text className={`font-bold ${targetMinutes === min ? 'text-white' : 'text-zinc-400'}`}>
                    {min} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Input - Integrated Design */}
            <View className="flex-row items-center justify-center mt-2">
               <View className={`flex-row items-center bg-zinc-800 rounded-xl border ${customMinutes ? 'border-orange-500' : 'border-zinc-700'} px-5 py-3`}>
                 <TextInput 
                    keyboardType="number-pad"
                    className="text-white font-bold text-2xl w-20 text-center p-0"
                    placeholder="00"
                    placeholderTextColor="#52525B"
                    value={customMinutes}
                    onChangeText={handleCustomChange}
                    maxLength={3}
                 />
                 <Text className="text-zinc-500 font-bold text-base ml-2">min</Text>
               </View>
            </View>
          </View>
        )}

        {/* Controls */}
        <View className="mb-8">
          {!isActive && seconds === 0 ? (
            <TouchableOpacity 
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B35', '#FF2E63']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-xl py-4 items-center justify-center"
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="play" size={24} color="white" />
                  <Text className="text-white text-lg font-bold font-display">
                    INICIAR
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View className="flex-row gap-4">
              {isActive ? (
                <TouchableOpacity 
                  onPress={handlePause}
                  className="flex-1 bg-zinc-800 py-5 rounded-2xl items-center justify-center border border-zinc-700"
                >
                  <Ionicons name="pause" size={28} color="white" />
                  <Text className="text-white font-bold mt-1">PAUSAR</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={handleStart}
                  className="flex-1 bg-emerald-600 py-5 rounded-2xl items-center justify-center"
                >
                  <Ionicons name="play" size={28} color="white" />
                  <Text className="text-white font-bold mt-1">RETOMAR</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                onPress={handleFinish}
                className="flex-1 bg-zinc-900 py-5 rounded-2xl items-center justify-center border border-zinc-800"
              >
                <Ionicons name="stop" size={28} color="#EF4444" />
                <Text className="text-red-500 font-bold mt-1">FINALIZAR</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ShareWorkoutModal
          visible={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            router.navigate('/(tabs)/cardio');
          }}
          stats={shareStats}
        />

        <WorkoutFeedbackModal
          visible={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={onFeedbackSubmit}
        />
      </View>
    </ScreenLayout>
  );
}
