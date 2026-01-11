import { BodyHeatmap3D } from '@/components/gamification/BodyHeatmap3D';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function BodyHeatmapScreen() {
  const router = useRouter();

  return (
    <ScreenLayout>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-6 flex-row items-center justify-between">
            <TouchableOpacity 
                onPress={() => router.back()}
                className="w-10 h-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800"
            >
                <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-black italic text-xl uppercase tracking-widest">
                Mapa Corporal
            </Text>
            <View className="w-10" />
        </View>

        {/* 3D Content */}
        <View className="flex-1 px-4 pb-8">
            <View className="flex-1 bg-zinc-900/30 rounded-[32px] border border-zinc-800 overflow-hidden relative">
                 <BodyHeatmap3D />
            </View>
            
            <View className="mt-6 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                <View className="flex-row items-center gap-3 mb-2">
                    <Ionicons name="information-circle-outline" size={24} color="#f97316" />
                    <Text className="text-white font-bold text-lg">Mapa de Calor</Text>
                </View>
                <Text className="text-zinc-400 leading-relaxed">
                    Rotacione o modelo 3D para ver todos os ângulos! As áreas brilhantes indicam os músculos que você mais treinou nos últimos 30 dias. Quanto mais laranja, mais você trabalhou aquele grupo muscular!
                </Text>
            </View>
        </View>
      </View>
    </ScreenLayout>
  );
}
