import { VideoPlayer } from '@/components/VideoPlayer';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Exercise, SelectedExercise } from '../store/workoutStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  exercise: Exercise;
  initialData?: SelectedExercise;
  onSave: (data: SelectedExercise) => void;
}

export const ExerciseConfigModal: React.FC<Props> = ({ visible, onClose, exercise, initialData, onSave }) => {
  const insets = useSafeAreaInsets();
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');
  const [weight, setWeight] = useState('');
  const [restSeconds, setRestSeconds] = useState('60');
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSets(String(initialData.sets));
      setReps(String(initialData.reps));
      setWeight(initialData.weight);
      setRestSeconds(String(initialData.rest_seconds));
      setVideoUrl(initialData.video_url || '');
    } else {
      setSets('3');
      setReps('12');
      setWeight('');
      setRestSeconds('60');
      setVideoUrl('');
    }
  }, [initialData, visible]);

  const handleSave = useCallback(async () => {
    const setsNum = parseInt(sets) || 3;
    const repsNum = parseInt(reps) || 12;
    const restNum = parseInt(restSeconds) || 60;
    if (setsNum < 1 || repsNum < 1 || restNum < 0) {
      Alert.alert('Erro', 'Por favor, insira valores válidos.');
      return;
    }
    setSaving(true);
    try {
      const result: SelectedExercise = {
        id: exercise.id,
        name: exercise.name,
        muscle_group: exercise.muscle_group || '',
        sets: setsNum,
        reps: repsNum,
        weight: weight,
        rest_seconds: restNum,
        video_url: videoUrl.trim() || undefined,
      };
      onSave(result);
      onClose();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }, [sets, reps, restSeconds, weight, videoUrl, exercise, onSave, onClose]);

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide" 
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/80 justify-end"
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="bg-card rounded-t-3xl p-6 max-h-[90%]"
          style={{ paddingBottom: Math.max(insets.bottom, 24) + 16 }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-extrabold text-foreground">Configurar Exercício</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
            
            <View className="bg-muted/30 p-4 rounded-2xl mb-6 border-2 border-border">
              <Text className="text-foreground text-lg font-bold mb-1">{exercise.name}</Text>
              <Text className="text-secondary text-sm">{exercise.muscle_group}</Text>
            </View>
            
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs mb-2 font-semibold">Séries</Text>
                <TextInput
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                  className="bg-muted/30 border-2 border-border rounded-xl p-3.5 text-foreground text-lg font-bold text-center"
                />
              </View>
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs mb-2 font-semibold">Repetições</Text>
                <TextInput
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  className="bg-muted/30 border-2 border-border rounded-xl p-3.5 text-foreground text-lg font-bold text-center"
                />
              </View>
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs mb-2 font-semibold">Descanso (s)</Text>
                <TextInput
                  value={restSeconds}
                  onChangeText={setRestSeconds}
                  keyboardType="number-pad"
                  className="bg-muted/30 border-2 border-border rounded-xl p-3.5 text-foreground text-lg font-bold text-center"
                />
              </View>
            </View>
            
            <View className="mb-6">
              <Text className="text-muted-foreground text-xs mb-2 font-semibold">Carga (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="Ex: 20"
                placeholderTextColor="#5A6178"
                className="bg-muted/30 border-2 border-border rounded-xl p-3.5 text-foreground text-lg font-bold text-center"
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-muted-foreground text-xs mb-2 font-semibold">Link do Vídeo (YouTube)</Text>
              <TextInput
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder="https://youtube.com/..."
                placeholderTextColor="#5A6178"
                autoCapitalize="none"
                className="bg-muted/30 border-2 border-border rounded-xl p-4 text-foreground text-base mb-3"
              />
              {videoUrl.trim() ? <VideoPlayer videoUrl={videoUrl.trim()} height={200} /> : null}
            </View>
            
            <TouchableOpacity 
              onPress={handleSave} 
              activeOpacity={0.8} 
              disabled={saving}
              className={`bg-primary rounded-2xl py-4 items-center ${saving ? 'opacity-50' : ''}`}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-primary-foreground text-base font-bold">
                  {initialData ? 'Salvar Alterações' : 'Adicionar Exercício'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
