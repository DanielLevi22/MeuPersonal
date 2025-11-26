import { useStudentStore } from '@/modules/students/store/studentStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentHistoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchStudentHistory, history, isLoading } = useStudentStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchStudentHistory(id as string);
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        style={{
          backgroundColor: '#141B2D',
          borderRadius: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isExpanded ? '#00D9FF' : '#1E2A42',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <View style={{
          padding: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
              {formatDate(item.created_at)}
            </Text>
            <Text style={{ color: '#8B92A8', fontSize: 14 }}>
              Peso: {item.weight ? `${item.weight} kg` : 'N/A'}
            </Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={isExpanded ? "#00D9FF" : "#5A6178"} 
          />
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={{ padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#1E2A42' }}>
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: '#00D9FF', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>Medidas (cm)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {item.neck && <Text style={{ color: '#8B92A8' }}>Pescoço: <Text style={{ color: '#FFF' }}>{item.neck}</Text></Text>}
                {item.shoulder && <Text style={{ color: '#8B92A8' }}>Ombro: <Text style={{ color: '#FFF' }}>{item.shoulder}</Text></Text>}
                {item.chest && <Text style={{ color: '#8B92A8' }}>Peito: <Text style={{ color: '#FFF' }}>{item.chest}</Text></Text>}
                {item.waist && <Text style={{ color: '#8B92A8' }}>Cintura: <Text style={{ color: '#FFF' }}>{item.waist}</Text></Text>}
                {item.abdomen && <Text style={{ color: '#8B92A8' }}>Abdômen: <Text style={{ color: '#FFF' }}>{item.abdomen}</Text></Text>}
                {item.hips && <Text style={{ color: '#8B92A8' }}>Quadril: <Text style={{ color: '#FFF' }}>{item.hips}</Text></Text>}
                {item.arm_right_relaxed && <Text style={{ color: '#8B92A8' }}>Braço Dir (Rel): <Text style={{ color: '#FFF' }}>{item.arm_right_relaxed}</Text></Text>}
                {item.arm_left_relaxed && <Text style={{ color: '#8B92A8' }}>Braço Esq (Rel): <Text style={{ color: '#FFF' }}>{item.arm_left_relaxed}</Text></Text>}
                {item.thigh_proximal && <Text style={{ color: '#8B92A8' }}>Coxa Prox: <Text style={{ color: '#FFF' }}>{item.thigh_proximal}</Text></Text>}
                {item.calf && <Text style={{ color: '#8B92A8' }}>Panturrilha: <Text style={{ color: '#FFF' }}>{item.calf}</Text></Text>}
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={{ color: '#00D9FF', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>Dobras (mm)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {item.skinfold_chest && <Text style={{ color: '#8B92A8' }}>Peitoral: <Text style={{ color: '#FFF' }}>{item.skinfold_chest}</Text></Text>}
                {item.skinfold_abdominal && <Text style={{ color: '#8B92A8' }}>Abdominal: <Text style={{ color: '#FFF' }}>{item.skinfold_abdominal}</Text></Text>}
                {item.skinfold_thigh && <Text style={{ color: '#8B92A8' }}>Coxa: <Text style={{ color: '#FFF' }}>{item.skinfold_thigh}</Text></Text>}
                {item.skinfold_triceps && <Text style={{ color: '#8B92A8' }}>Tríceps: <Text style={{ color: '#FFF' }}>{item.skinfold_triceps}</Text></Text>}
                {item.skinfold_suprailiac && <Text style={{ color: '#8B92A8' }}>Supra-ilíaca: <Text style={{ color: '#FFF' }}>{item.skinfold_suprailiac}</Text></Text>}
              </View>
            </View>

            {item.notes && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ color: '#00D9FF', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>Observações</Text>
                <Text style={{ color: '#FFFFFF' }}>{item.notes}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 24, paddingBottom: 16 }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{
              backgroundColor: '#141B2D',
              padding: 10,
              borderRadius: 12,
              marginRight: 16
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF' }}>
            Histórico de Avaliações
          </Text>
        </View>

        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={{ color: '#8B92A8', textAlign: 'center', marginTop: 40 }}>
                Nenhuma avaliação encontrada.
              </Text>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}
