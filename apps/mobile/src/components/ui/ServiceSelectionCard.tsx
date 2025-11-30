import { cn } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import type { ServiceCategory } from '@meupersonal/supabase';
import { Text, TouchableOpacity, View } from 'react-native';

interface ServiceSelectionCardProps {
  service: ServiceCategory;
  title: string;
  description: string;
  icon: string; // emoji
  selected: boolean;
  onToggle: () => void;
}

const SERVICE_INFO: Record<ServiceCategory, { title: string; description: string; icon: string }> = {
  personal_training: {
    title: 'Personal Trainer',
    description: 'Treinos e periodização',
    icon: '🏋️',
  },
  nutrition_consulting: {
    title: 'Nutricionista',
    description: 'Dietas e nutrição',
    icon: '🥗',
  },
  physiotherapy: {
    title: 'Fisioterapeuta',
    description: 'Reabilitação e prevenção',
    icon: '💆',
  },
  sports_psychology: {
    title: 'Psicólogo Esportivo',
    description: 'Saúde mental e performance',
    icon: '🧠',
  },
};

export function ServiceSelectionCard({
  service,
  selected,
  onToggle,
}: Omit<ServiceSelectionCardProps, 'title' | 'description' | 'icon'>) {
  const info = SERVICE_INFO[service];

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.7} className="mb-3">
      <View
        className={cn(
          'bg-card border-2 rounded-2xl p-4 flex-row items-center',
          selected ? 'border-primary bg-primary/5' : 'border-zinc-700'
        )}
      >
        {/* Icon */}
        <View
          className={cn(
            'w-14 h-14 rounded-xl items-center justify-center mr-4',
            selected ? 'bg-primary/20 border border-primary/30' : 'bg-zinc-800'
          )}
        >
          <Text className="text-3xl">{info.icon}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className={cn(
              'text-lg font-bold mb-1',
              selected ? 'text-primary' : 'text-white'
            )}
          >
            {info.title}
          </Text>
          <Text className="text-zinc-400 text-sm">{info.description}</Text>
        </View>

        {/* Checkmark */}
        {selected && <Ionicons name="checkmark-circle" size={28} color="#A3E635" />}
      </View>
    </TouchableOpacity>
  );
}

export { SERVICE_INFO };
