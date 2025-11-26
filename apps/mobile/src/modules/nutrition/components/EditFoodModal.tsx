import { DietMealItem } from '@/modules/nutrition/routes/index';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
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
        className="flex-1 bg-black/80 justify-center p-6"
      >
        <View className="bg-card rounded-3xl p-6 border border-border">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-xl font-bold text-foreground">Editar Quantidade</Text>
            <TouchableOpacity onPress={handleClose} className="p-1">
              <Ionicons name="close" size={24} color="#FAFAFA" />
            </TouchableOpacity>
          </View>

          {/* Food Info */}
          <View className="mb-6 bg-muted/30 p-4 rounded-xl">
            <Text className="text-base font-semibold text-foreground mb-1">{item.food?.name}</Text>
            <Text className="text-xs text-muted-foreground">
              {item.food?.calories} kcal por {item.food?.serving_size}{item.food?.serving_unit}
            </Text>
          </View>

          {/* Input */}
          <View className="mb-6">
            <Text className="text-sm text-muted-foreground mb-2">Quantidade ({item.unit})</Text>
            <View className="flex-row items-center bg-muted/30 rounded-xl border-2 border-border px-4">
              <TextInput
                className="flex-1 text-foreground text-lg font-semibold py-3"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#A1A1AA"
                autoFocus={true}
                selectTextOnFocus={true}
              />
              <Text className="text-muted-foreground text-base font-semibold ml-2">{item.unit}</Text>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 py-3.5 rounded-xl bg-muted items-center" 
              onPress={handleClose}
            >
              <Text className="text-foreground font-semibold text-base">Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 py-3.5 rounded-xl bg-primary items-center" 
              onPress={handleSave}
            >
              <Text className="text-primary-foreground font-bold text-base">Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}