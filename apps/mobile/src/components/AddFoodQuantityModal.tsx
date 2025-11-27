import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface AddFoodQuantityModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  food: any;
  initialQuantity?: number;
}

export default function AddFoodQuantityModal({ 
  visible, 
  onClose, 
  onConfirm, 
  food,
  initialQuantity 
}: AddFoodQuantityModalProps) {
  const [quantity, setQuantity] = useState('100');

  useEffect(() => {
    if (visible) {
      setQuantity(initialQuantity ? initialQuantity.toString() : '100');
    }
  }, [visible, initialQuantity]);

  const handleConfirm = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;
    onConfirm(qty);
    setQuantity('100');
  };

  if (!food) return null;

  const ratio = (parseFloat(quantity) || 0) / (food.serving_size || 100);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        <View className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-800">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-white font-display flex-1 mr-4">
              {food.name}
            </Text>
            <TouchableOpacity onPress={onClose} className="bg-zinc-800 p-2 rounded-full">
              <Ionicons name="close" size={20} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-zinc-950 p-3 rounded-xl border border-zinc-800 items-center">
              <Text className="text-zinc-500 text-xs font-bold mb-1">CALORIAS</Text>
              <Text className="text-white font-bold">{Math.round(food.calories * ratio)}</Text>
            </View>
            <View className="flex-1 bg-zinc-950 p-3 rounded-xl border border-zinc-800 items-center">
              <Text className="text-emerald-400 text-xs font-bold mb-1">PROT</Text>
              <Text className="text-white font-bold">{Math.round(food.protein * ratio)}g</Text>
            </View>
            <View className="flex-1 bg-zinc-950 p-3 rounded-xl border border-zinc-800 items-center">
              <Text className="text-purple-400 text-xs font-bold mb-1">CARB</Text>
              <Text className="text-white font-bold">{Math.round(food.carbs * ratio)}g</Text>
            </View>
            <View className="flex-1 bg-zinc-950 p-3 rounded-xl border border-zinc-800 items-center">
              <Text className="text-amber-400 text-xs font-bold mb-1">GORD</Text>
              <Text className="text-white font-bold">{Math.round(food.fat * ratio)}g</Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-zinc-400 text-sm font-bold mb-2 ml-1">Quantidade ({food.serving_unit})</Text>
            <Input
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Ex: 100"
              autoFocus
            />
          </View>

          <Button
            onPress={handleConfirm}
            label={initialQuantity ? "Atualizar" : "Adicionar Alimento"}
            variant="primary"
          />
        </View>
      </View>
    </Modal>
  );
}
