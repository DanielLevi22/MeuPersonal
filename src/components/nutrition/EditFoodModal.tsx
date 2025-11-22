import { DietMealItem } from '@/store/nutritionStore';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface EditFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (itemId: string, quantity: number) => void;
  item: DietMealItem | null;
}

export function EditFoodModal({ visible, onClose, onSave, item }: EditFoodModalProps) {
  const [quantity, setQuantity] = useState('');

  // Initialize quantity when item changes
  if (item && quantity === '' && visible) {
    setQuantity(item.quantity.toString());
  }

  const handleSave = () => {
    if (!item) return;
    
    const newQuantity = parseFloat(quantity);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      return; // Invalid input
    }

    onSave(item.id, newQuantity);
    setQuantity(''); // Reset for next time
    onClose();
  };

  const handleClose = () => {
    setQuantity('');
    onClose();
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Editar Quantidade</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Food Info */}
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>{item.food?.name}</Text>
            <Text style={styles.foodDetails}>
              {item.food?.calories} kcal por {item.food?.serving_size}{item.food?.serving_unit}
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Quantidade ({item.unit})</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#5A6178"
                autoFocus={true}
                selectTextOnFocus={true}
              />
              <Text style={styles.unitText}>{item.unit}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#141B2D',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E2A42',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  foodInfo: {
    marginBottom: 24,
    backgroundColor: '#0A0E1A',
    padding: 16,
    borderRadius: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  foodDetails: {
    fontSize: 12,
    color: '#8B92A8',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#8B92A8',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0E1A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 12,
  },
  unitText: {
    color: '#8B92A8',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1E2A42',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#00FF88',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#0A0E1A',
    fontWeight: '700',
    fontSize: 16,
  },
});
