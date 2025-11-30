import { Modal } from 'react-native';
import FoodSearchScreen from '../screens/FoodSearchScreen';

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (food: any, quantity?: number) => void;
  mealId?: string;
  initialData?: {
    name: string;
    time: string;
    type: string;
    order: number;
  };
  onSave?: (items: any[]) => Promise<void>;
  dailyTotals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  mealTime?: string;
  onTimeChange?: (time: string) => void;
}

export function FoodSearchModal({ visible, onClose, onSelect, mealId, initialData, onSave, dailyTotals, mealTime, onTimeChange }: FoodSearchModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <FoodSearchScreen 
        onSelect={onSelect || (() => {})} 
        onClose={onClose} 
        mealId={mealId}
        initialData={initialData}
        onSave={onSave}
        dailyTotals={dailyTotals}
        mealTime={mealTime}
        onTimeChange={onTimeChange}
      />
    </Modal>
  );
}
