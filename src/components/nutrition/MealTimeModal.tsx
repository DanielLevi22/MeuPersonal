import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface MealTimeModalProps {
  visible: boolean;
  mealLabel: string;
  onClose: () => void;
  onConfirm: (mealTime?: string) => void;
}

export function MealTimeModal({ visible, mealLabel, onClose, onConfirm }: MealTimeModalProps) {
  const [mealTime, setMealTime] = useState('');

  const handleConfirm = () => {
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const validTime = mealTime && timeRegex.test(mealTime) ? mealTime : undefined;
    
    onConfirm(validTime);
    setMealTime('');
    onClose();
  };

  const handleSkip = () => {
    onConfirm(undefined);
    setMealTime('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="time" size={32} color="#00FF88" />
            <Text style={styles.title}>Horário - {mealLabel}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Digite o horário sugerido para esta refeição
          </Text>

          {/* Time Input */}
          <TextInput
            style={styles.input}
            placeholder="Ex: 08:00, 12:30, 18:00"
            placeholderTextColor="#5A6178"
            value={mealTime}
            onChangeText={setMealTime}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            autoFocus
          />

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Pular</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#141B2D',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#8B92A8',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0A0E1A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#1E2A42',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#1E2A42',
  },
  skipButtonText: {
    color: '#8B92A8',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#00FF88',
  },
  confirmButtonText: {
    color: '#0A0E1A',
    fontSize: 16,
    fontWeight: '700',
  },
});
