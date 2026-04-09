import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

const MetricCard = ({
  label,
  value,
  unit,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  unit: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  trend?: { value: string; positive: boolean };
}) => (
  <View className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 mb-4">
    <View className="flex-row justify-between items-start mb-2">
      <View className="p-2 rounded-xl" style={{ backgroundColor: `${color}20` }}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      {trend && (
        <View
          className={`flex-row items-center px-2 py-1 rounded-full ${trend.positive ? 'bg-green-500/20' : 'bg-red-500/20'}`}
        >
          <Ionicons
            name={trend.positive ? 'arrow-up' : 'arrow-down'}
            size={10}
            color={trend.positive ? '#4ade80' : '#f87171'}
          />
          <Text
            className={`text-[10px] ml-1 font-bold ${trend.positive ? 'text-green-400' : 'text-red-400'}`}
          >
            {trend.value}
          </Text>
        </View>
      )}
    </View>
    <Text className="text-zinc-400 text-xs uppercase font-medium tracking-wider mb-1">{label}</Text>
    <View className="flex-row items-baseline">
      <Text className="text-white text-2xl font-black">{value}</Text>
      <Text className="text-zinc-500 text-sm ml-1">{unit}</Text>
    </View>
  </View>
);

export default function PhysicalAssessment() {
  const router = useRouter();
  const _insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-black"
      contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Date Header */}
      <View className="px-6 mb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-zinc-400 text-sm">Última atualização</Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="calendar-outline" size={14} color={colors.primary.solid} />
              <Text className="text-white text-lg font-bold ml-2">15 Jan, 2026</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/assessment/anamnesis' as never)}
            className="bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700"
          >
            <Text className="text-white font-bold text-sm">Anamnese</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Stats Grid */}
      <View className="px-6 flex-row flex-wrap justify-between">
        <View className="w-[48%]">
          <MetricCard
            label="Peso"
            value="78.5"
            unit="kg"
            icon="scale-bathroom"
            color={colors.secondary.main}
            trend={{ value: '1.2kg', positive: false }}
          />
        </View>
        <View className="w-[48%]">
          <MetricCard
            label="Altura"
            value="1.82"
            unit="m"
            icon="human-male-height"
            color={colors.primary.start}
          />
        </View>
        <View className="w-[48%]">
          <MetricCard
            label="Gordura"
            value="14.2"
            unit="%"
            icon="water-percent"
            color={colors.status.warning}
            trend={{ value: '0.5%', positive: true }}
          />
        </View>
        <View className="w-[48%]">
          <MetricCard
            label="Massa Magra"
            value="64.1"
            unit="kg"
            icon="dumbbell"
            color={colors.status.success}
            trend={{ value: '0.8kg', positive: true }}
          />
        </View>
      </View>

      {/* Circumferences Section */}
      <View className="px-6 mt-6">
        <View className="flex-row items-center mb-4">
          <View
            className="w-1 h-6 mr-3 rounded-full"
            style={{ backgroundColor: colors.accent.main }}
          />
          <Text className="text-white text-lg font-bold">Circunferências</Text>
        </View>

        <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
          {[
            { label: 'Pescoço', value: '38 cm', icon: 'human' },
            { label: 'Ombros', value: '118 cm', icon: 'human-handsup' },
            { label: 'Tórax', value: '102 cm', icon: 'human-male' },
            { label: 'Cintura', value: '82 cm', icon: 'human-male-board' },
            { label: 'Abdômen', value: '85 cm', icon: 'stomach' },
            { label: 'Quadril', value: '98 cm', icon: 'human-male' },
            { label: 'Braço Dir.', value: '38 cm', icon: 'arm-flex' },
            { label: 'Braço Esq.', value: '37.5 cm', icon: 'arm-flex' },
            { label: 'Antebraço Dir.', value: '30 cm', icon: 'arm-flex-outline' },
            { label: 'Antebraço Esq.', value: '29.5 cm', icon: 'arm-flex-outline' },
            { label: 'Coxa Prox. Dir.', value: '58 cm', icon: 'run' },
            { label: 'Coxa Prox. Esq.', value: '58 cm', icon: 'run' },
            { label: 'Panturrilha Dir.', value: '40 cm', icon: 'run-fast' },
            { label: 'Panturrilha Esq.', value: '40 cm', icon: 'run-fast' },
          ].map((item) => {
            return (
              <View
                key={item.label}
                className="flex-row items-center justify-between py-3 border-b border-white/5 last:border-0"
              >
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={18}
                    color={colors.accent.light}
                    style={{ marginRight: 12, opacity: 0.8 }}
                  />
                  <Text className="text-zinc-300 font-medium">{item.label}</Text>
                </View>
                <Text className="text-white font-bold">{item.value}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Skinfolds Section */}
      <View className="px-6 mt-6">
        <View className="flex-row items-center mb-4">
          <View
            className="w-1 h-6 mr-3 rounded-full"
            style={{ backgroundColor: colors.status.info }}
          />
          <Text className="text-white text-lg font-bold">Dobras Cutâneas (mm)</Text>
        </View>

        <View className="flex-row flex-wrap justify-between">
          {[
            { label: 'Tricipital', value: '12' },
            { label: 'Bicipital', value: '5' },
            { label: 'Subescapular', value: '15' },
            { label: 'Suprailíaca', value: '18' },
            { label: 'Abdominal', value: '22' },
            { label: 'Coxa', value: '14' },
            { label: 'Panturrilha', value: '8' },
          ].map((item) => {
            return (
              <View
                key={item.label}
                className="w-[31%] bg-white/5 border border-white/10 rounded-xl p-3 mb-3 items-center"
              >
                <Text className="text-zinc-400 text-[10px] uppercase font-bold mb-1 text-center">
                  {item.label}
                </Text>
                <Text className="text-white text-lg font-bold">{item.value}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Photos Section */}
      <View className="px-6 mt-4">
        <View className="flex-row items-center mb-4">
          <View
            className="w-1 h-6 mr-3 rounded-full"
            style={{ backgroundColor: colors.primary.solid }}
          />
          <Text className="text-white text-lg font-bold">Fotos Comparativas</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {['Frontal', 'Costas', 'Lateral Dir.', 'Lateral Esq.'].map((label) => {
            return (
              <View key={label} className="mr-3">
                <View className="w-24 h-32 bg-zinc-900/50 rounded-xl border border-white/10 items-center justify-center mb-2 overflow-hidden">
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={32}
                    color={colors.text.muted}
                  />
                </View>
                <Text className="text-center text-zinc-500 text-xs font-medium">{label}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Anamnese / Notes */}
      <View className="px-6 mt-6">
        <View className="bg-white/5 border border-white/10 p-4 rounded-2xl">
          <View className="flex-row items-center mb-3">
            <MaterialCommunityIcons
              name="notebook-outline"
              size={20}
              color={colors.secondary.main}
              style={{ marginRight: 8 }}
            />
            <Text className="text-white font-bold">Notas de Observação</Text>
          </View>
          <Text className="text-zinc-400 text-sm leading-6">
            Aluno relatou leve desconforto no ombro direito durante o supino. Recomendo
            fortalecimento de manguito rotador. Postura apresentou melhora significativa na lordose
            desde a última avaliação.
          </Text>
        </View>
      </View>

      {/* History Button */}
      <View className="px-6 mt-8">
        <TouchableOpacity activeOpacity={0.8}>
          <LinearGradient
            colors={colors.gradients.secondary as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 rounded-xl items-center flex-row justify-center"
          >
            <MaterialCommunityIcons
              name="history"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white font-bold text-base uppercase tracking-wider">
              Histórico Completo
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
