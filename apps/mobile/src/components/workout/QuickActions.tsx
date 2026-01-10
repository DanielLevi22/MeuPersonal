import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface QuickActionsProps {
  onDownload: () => void;
  onStudentView: () => void;
  onEvolution: () => void;
  onAiPrescription: () => void;
}

export function QuickActions({
  onDownload,
  onStudentView,
  onEvolution,
  onAiPrescription,
}: QuickActionsProps) {
  const actions = [
    {
      label: 'Baixar\ntreino',
      icon: 'download-outline',
      onPress: onDownload,
      gradient: ['#00D9FF', '#00B8D9'], // Blue
    },
    {
      label: 'Visão do\naluno',
      icon: 'eye-outline',
      onPress: onStudentView,
      gradient: ['#00D9FF', '#00B8D9'], // Blue
    },
    {
      label: 'Evolução\nGeral',
      icon: 'stats-chart-outline',
      onPress: onEvolution,
      gradient: ['#00D9FF', '#00B8D9'], // Blue
    },
    {
      label: 'Prescrever\ncom IA',
      icon: 'sparkles-outline', // Changed icon for AI
      onPress: onAiPrescription,
      gradient: ['#9D4EDD', '#8338C9'],
    },
  ];

  return (
    <View className="flex-row justify-between px-4 py-2">
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          onPress={action.onPress}
          activeOpacity={0.7}
          className="items-center w-[23%]"
        >
          {/* Circular Button */}
          <View className="mb-2">
             <View
                className="w-16 h-16 rounded-full items-center justify-center border border-zinc-800 bg-zinc-900 shadow-sm"
                style={{
                    backgroundColor: index === 3 ? 'rgba(157, 78, 221, 0.1)' : 'rgba(0, 217, 255, 0.1)', // Subtle tint
                    borderColor: index === 3 ? 'rgba(157, 78, 221, 0.3)' : 'rgba(0, 217, 255, 0.3)',
                }}
              >
                 <Ionicons 
                    name={action.icon as any} 
                    size={26} 
                    color={index === 3 ? '#C084FC' : '#00D9FF'} 
                 />
              </View>
          </View>
          
          {/* Label */}
          <Text className="text-zinc-400 text-[11px] font-bold text-center leading-4 font-sans max-w-[80px]">
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
