import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import type { WorkoutFeedback } from '@meupersonal/supabase';
import { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  workoutLogId: string;
  workoutName: string;
}

type Mood = 'great' | 'good' | 'ok' | 'tired' | 'exhausted';

const moodOptions: { value: Mood; label: string; emoji: string; color: string }[] = [
  { value: 'great', label: 'Ótimo', emoji: '🔥', color: '#FF6B35' },
  { value: 'good', label: 'Bom', emoji: '😊', color: '#00FF88' },
  { value: 'ok', label: 'Ok', emoji: '😐', color: '#FFD700' },
  { value: 'tired', label: 'Cansado', emoji: '😓', color: '#FF9500' },
  { value: 'exhausted', label: 'Exausto', emoji: '😵', color: '#FF3B30' },
];

export function FeedbackModal({ visible, onClose, workoutLogId, workoutName }: FeedbackModalProps) {
  const [submitting, setSubmitting] = useState(false);
  
  // Ratings (1-5)
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [satisfactionRating, setSatisfactionRating] = useState(3);
  
  // Mood
  const [mood, setMood] = useState<Mood>('good');
  
  // Notes
  const [notes, setNotes] = useState('');
  
  // RPE (1-10)
  const [perceivedExertion, setPerceivedExertion] = useState(5);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const feedback: Partial<WorkoutFeedback> = {
        workout_log_id: workoutLogId,
        student_id: user.id,
        difficulty_rating: difficultyRating,
        energy_level: energyLevel,
        satisfaction_rating: satisfactionRating,
        mood,
        notes: notes.trim() || undefined,
        perceived_exertion: perceivedExertion,
      };

      const { error } = await supabase
        .from('workout_feedback')
        .insert(feedback);

      if (error) throw error;

      // Reset form
      setDifficultyRating(3);
      setEnergyLevel(3);
      setSatisfactionRating(3);
      setMood('good');
      setNotes('');
      setPerceivedExertion(5);
      
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, setRating: (value: number) => void) => (
    <View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={32}
            color={star <= rating ? '#FFB800' : '#71717A'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRPEScale = () => (
    <View className="flex-row flex-wrap gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
        <TouchableOpacity
          key={value}
          onPress={() => setPerceivedExertion(value)}
          className={`w-12 h-12 rounded-xl items-center justify-center border-2 ${
            value === perceivedExertion
              ? 'bg-primary border-primary'
              : 'bg-surface border-border'
          }`}
        >
          <Text className={`text-lg font-bold ${value === perceivedExertion ? 'text-black' : 'text-foreground'}`}>
            {value}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-20 bg-background rounded-t-3xl">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="p-6 border-b border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl font-bold text-foreground font-display">
                  Feedback do Treino
                </Text>
                <TouchableOpacity onPress={onClose} className="p-2">
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              <Text className="text-muted-foreground font-sans">{workoutName}</Text>
            </View>

            <View className="p-6 space-y-6">
              {/* Difficulty */}
              <View>
                <Text className="text-lg font-semibold text-foreground mb-3 font-display">
                  Dificuldade
                </Text>
                {renderStars(difficultyRating, setDifficultyRating)}
                <Text className="text-sm text-muted-foreground mt-2 font-sans">
                  {difficultyRating === 1 && 'Muito fácil'}
                  {difficultyRating === 2 && 'Fácil'}
                  {difficultyRating === 3 && 'Moderado'}
                  {difficultyRating === 4 && 'Difícil'}
                  {difficultyRating === 5 && 'Muito difícil'}
                </Text>
              </View>

              {/* Energy Level */}
              <View>
                <Text className="text-lg font-semibold text-foreground mb-3 font-display">
                  Nível de Energia
                </Text>
                {renderStars(energyLevel, setEnergyLevel)}
                <Text className="text-sm text-muted-foreground mt-2 font-sans">
                  {energyLevel === 1 && 'Sem energia'}
                  {energyLevel === 2 && 'Pouca energia'}
                  {energyLevel === 3 && 'Energia normal'}
                  {energyLevel === 4 && 'Muita energia'}
                  {energyLevel === 5 && 'Energia máxima'}
                </Text>
              </View>

              {/* Satisfaction */}
              <View>
                <Text className="text-lg font-semibold text-foreground mb-3 font-display">
                  Satisfação
                </Text>
                {renderStars(satisfactionRating, setSatisfactionRating)}
              </View>

              {/* Mood */}
              <View>
                <Text className="text-lg font-semibold text-foreground mb-3 font-display">
                  Como você se sente?
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {moodOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setMood(option.value)}
                      className={`px-4 py-3 rounded-xl border-2 ${
                        mood === option.value
                          ? 'bg-primary/10 border-primary'
                          : 'bg-surface border-border'
                      }`}
                    >
                      <Text className="text-2xl mb-1">{option.emoji}</Text>
                      <Text className={`text-sm font-medium ${mood === option.value ? 'text-primary' : 'text-muted-foreground'}`}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* RPE */}
              <View>
                <Text className="text-lg font-semibold text-foreground mb-2 font-display">
                  Esforço Percebido (RPE)
                </Text>
                <Text className="text-sm text-muted-foreground mb-3 font-sans">
                  1 = Muito leve | 10 = Máximo esforço
                </Text>
                {renderRPEScale()}
              </View>

              {/* Notes */}
              <View>
                <Text className="text-lg font-semibold text-foreground mb-3 font-display">
                  Observações (opcional)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Como foi o treino? Alguma dificuldade?"
                  placeholderTextColor="#71717A"
                  multiline
                  numberOfLines={4}
                  className="bg-surface border border-border rounded-xl p-4 text-foreground font-sans"
                  maxLength={500}
                />
                <Text className="text-xs text-muted-foreground mt-2 font-sans">
                  {notes.length}/500 caracteres
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View className="p-6 border-t border-border">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="bg-primary py-4 rounded-xl items-center"
            >
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-black text-lg font-bold font-display">
                  Enviar Feedback
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
