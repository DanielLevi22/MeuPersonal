import { DailyNutrition } from '@/components/nutrition/DailyNutrition';
import { supabase } from '@meupersonal/supabase';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [hasPersonal, setHasPersonal] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [user])
  );

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(profileData);

      if (profileData?.role === 'student') {
        // Check if student has a personal
        const { data: personalLink } = await supabase
          .from('students_personals')
          .select('id')
          .eq('student_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        setHasPersonal(!!personalLink);

        const { data: workoutData } = await supabase
          .from('workouts')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });
        
        setWorkouts(workoutData || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderWorkoutItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/student/workout-detail?id=${item.id}` as any)}
      activeOpacity={0.8}
      style={{ marginBottom: 16 }}
    >
      <LinearGradient
        colors={['#FF6B35', '#E85A2A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 20,
          shadowColor: '#FF6B35',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 }} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
          <View style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.2)', 
            padding: 10, 
            borderRadius: 12 
          }}>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ 
          backgroundColor: 'rgba(255, 107, 53, 0.15)', 
          padding: 20, 
          borderRadius: 50,
          marginBottom: 16
        }}>
          <Ionicons name="barbell" size={48} color="#FF6B35" />
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>Carregando...</Text>
      </View>
    );
  }

  // Student Dashboard
  if (profile?.role === 'student') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <FlatList
            data={workouts}
            renderItem={renderWorkoutItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={fetchProfile} tintColor="#FF6B35" />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24 }}
            ListHeaderComponent={
              <View style={{ marginBottom: 24 }}>
                {/* Nutrition Section */}
                <DailyNutrition />

                {/* Workouts Section Header */}
                <View style={{ marginTop: 8, marginBottom: 16 }}>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>
                    Seus Treinos 💪
                  </Text>
                  <Text style={{ fontSize: 16, color: '#8B92A8' }}>
                    Vamos treinar hoje?
                  </Text>
                </View>

                {workouts.length === 0 && (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                    <View style={{ 
                      backgroundColor: '#141B2D', 
                      padding: 32, 
                      borderRadius: 50,
                      marginBottom: 24
                    }}>
                      <Ionicons name={hasPersonal ? "barbell-outline" : "person-add-outline"} size={80} color="#5A6178" />
                    </View>
                    <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
                      {hasPersonal ? 'Nenhum treino ainda' : 'Sem Personal Trainer'}
                    </Text>
                    <Text style={{ color: '#8B92A8', textAlign: 'center', paddingHorizontal: 32, fontSize: 15, marginBottom: 32 }}>
                      {hasPersonal 
                        ? 'Aguarde seu personal criar treinos personalizados para você' 
                        : 'Vincule-se a um personal para receber seus treinos personalizados'}
                    </Text>

                    {!hasPersonal && (
                      <TouchableOpacity 
                        onPress={() => router.push('/student/join-personal' as any)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#FF6B35', '#E85A2A']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            borderRadius: 16,
                            paddingVertical: 16,
                            paddingHorizontal: 32,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                        >
                          <Ionicons name="link" size={20} color="#FFF" style={{ marginRight: 8 }} />
                          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                            Vincular Personal
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            }
          />
        </SafeAreaView>
      </View>
    );
  }

  // Personal Trainer Dashboard
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: 24 }}>
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 }}>
              Dashboard 🔥
            </Text>
            <Text style={{ fontSize: 16, color: '#8B92A8' }}>
              Gerencie seus alunos e treinos
            </Text>
          </View>

          <View>
            {/* Stats Card - Students */}
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/students')}
              activeOpacity={0.8}
              style={{ marginBottom: 16 }}
            >
              <LinearGradient
                colors={['#00D9FF', '#00B8D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 24,
                  shadowColor: '#00D9FF',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
                      ALUNOS ATIVOS
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 48, fontWeight: '800' }}>
                      0
                    </Text>
                  </View>
                  <View style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    padding: 16, 
                    borderRadius: 20 
                  }}>
                    <Ionicons name="people" size={40} color="white" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Stats Card - Workouts */}
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/workouts')}
              activeOpacity={0.8}
              style={{ marginBottom: 24 }}
            >
              <LinearGradient
                colors={['#00FF88', '#00CC6E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 24,
                  shadowColor: '#00FF88',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: 'rgba(10, 14, 26, 0.8)', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
                      TREINOS CRIADOS
                    </Text>
                    <Text style={{ color: '#0A0E1A', fontSize: 48, fontWeight: '800' }}>
                      0
                    </Text>
                  </View>
                  <View style={{ 
                    backgroundColor: 'rgba(10, 14, 26, 0.2)', 
                    padding: 16, 
                    borderRadius: 20 
                  }}>
                    <Ionicons name="barbell" size={40} color="#0A0E1A" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Quick Action */}
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/students')}
              activeOpacity={0.8}
            >
              <View style={{
                backgroundColor: '#141B2D',
                borderWidth: 2,
                borderColor: '#FF6B35',
                borderRadius: 20,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Ionicons name="add-circle" size={28} color="#FF6B35" />
                <Text style={{ color: '#FF6B35', fontSize: 18, fontWeight: '700', marginLeft: 12 }}>
                  Adicionar Novo Aluno
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
