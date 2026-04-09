import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { colors as brandColors } from '@/constants/colors';

export default function ProfileScreen() {
  const { signOut, user } = useAuthStore();
  const [profile, setProfile] = useState<{
    full_name?: string;
    level?: number;
    role?: string;
    xp?: number;
  } | null>(null);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSignOut = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Background */}
        <View className="absolute top-0 w-full h-[200px]">
          <LinearGradient
            colors={[`${brandColors.primary.start}40`, 'transparent']}
            style={{ flex: 1 }}
          />
        </View>

        <View className="px-6 pt-8">
          <View className="flex-row justify-between items-start mb-8">
            <View>
              <Text className="text-4xl font-black text-white italic font-display tracking-tight">
                MEU PERFIL
              </Text>
              <Text className="text-zinc-400 font-bold uppercase text-xs tracking-widest mt-1">
                Gerencie sua conta
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSignOut}
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-full"
            >
              <Ionicons name="log-out-outline" size={20} color={brandColors.status.error} />
            </TouchableOpacity>
          </View>

          {/* Gamer Card */}
          <View
            className="rounded-[32px] p-1 border overflow-hidden mb-8"
            style={{
              backgroundColor: brandColors.background.secondary,
              borderColor: brandColors.border.dark,
            }}
          >
            <LinearGradient
              colors={[brandColors.background.surface, brandColors.background.secondary]}
              className="p-6 rounded-[28px]"
            >
              <View className="items-center mb-6">
                <View
                  className="w-[100px] h-[100px] rounded-full items-center justify-center mb-4 border-2 shadow-xl relative"
                  style={{
                    borderColor: brandColors.primary.start,
                    backgroundColor: brandColors.background.elevated,
                    shadowColor: brandColors.primary.start,
                  }}
                >
                  {/* Avatar Placeholder */}
                  <Text className="text-4xl font-black text-white">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </Text>

                  {/* Level Badge */}
                  <LinearGradient
                    colors={brandColors.gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="absolute -bottom-3 px-3 py-1 rounded-full border-2 border-[#1A1A1A]"
                  >
                    <Text className="text-white font-black text-xs italic tracking-widest">
                      LVL {profile?.level || 1}
                    </Text>
                  </LinearGradient>
                </View>

                <Text className="text-white text-2xl font-black italic font-display mt-2">
                  {profile?.full_name || 'Usuário'}
                </Text>
                <Text
                  className="text-xs font-black uppercase tracking-[2px] mt-1"
                  style={{
                    color:
                      profile?.role === 'personal'
                        ? brandColors.primary.start
                        : brandColors.secondary.main,
                  }}
                >
                  {profile?.role === 'personal' ? 'PERSONAL TRAINER' : 'ALUNO'}
                </Text>
              </View>

              {/* XP Progress Bar */}
              {profile?.role !== 'personal' && (
                <View className="w-full">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-zinc-500 text-[10px] font-black uppercase">XP ATUAL</Text>
                    <Text className="text-white text-[10px] font-black uppercase">
                      {profile?.xp || 0} / {((profile?.level || 1) * 20) ** 2}
                    </Text>
                  </View>
                  <View className="h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <LinearGradient
                      colors={brandColors.gradients.secondary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(5, ((profile?.xp || 0) * 100) / ((profile?.level || 1) * 20) ** 2))}%`,
                      }}
                    />
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Health Connect Button */}
          <TouchableOpacity
            onPress={() => router.push('/onboarding/health-connect' as never)}
            activeOpacity={0.8}
            className="mb-8 h-[100px] rounded-[32px] overflow-hidden border border-zinc-800 relative bg-zinc-900"
          >
            <LinearGradient
              colors={['#18181b', '#09090b']}
              className="absolute inset-0 flex-row items-center justify-between p-6"
            >
              <View className="flex-1 mr-4">
                <Text className="text-white text-xl font-black italic font-display">
                  SYNC SAÚDE
                </Text>
                <Text className="text-zinc-500 text-xs font-medium mt-1">
                  Conectar Apple Health / Health Connect
                </Text>
              </View>

              <View className="w-14 h-14 bg-rose-500/10 rounded-2xl items-center justify-center border border-rose-500/20">
                <Ionicons name="heart-circle-outline" size={32} color="#f43f5e" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Info Section */}
          <View className="mb-8">
            <Text className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-4 ml-2">
              DETALHES DA CONTA
            </Text>

            <View
              className="p-5 rounded-3xl border mb-3 flex-row items-center gap-4"
              style={{
                backgroundColor: brandColors.background.secondary,
                borderColor: brandColors.border.dark,
              }}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center bg-zinc-900">
                <Ionicons name="mail-outline" size={20} color={brandColors.secondary.main} />
              </View>
              <View>
                <Text className="text-zinc-500 text-[10px] font-black uppercase">Email</Text>
                <Text className="text-white font-bold">{user?.email}</Text>
              </View>
            </View>

            <View
              className="p-5 rounded-3xl border flex-row items-center gap-4"
              style={{
                backgroundColor: brandColors.background.secondary,
                borderColor: brandColors.border.dark,
              }}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center bg-zinc-900">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={brandColors.primary.start}
                />
              </View>
              <View>
                <Text className="text-zinc-500 text-[10px] font-black uppercase">Permissão</Text>
                <Text className="text-white font-bold capitalize">{profile?.role}</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full py-4 rounded-2xl flex-row items-center justify-center border border-zinc-800"
            style={{ backgroundColor: brandColors.background.primary }}
          >
            <Text className="text-white font-bold text-sm mr-2">Editar Perfil</Text>
            <Ionicons name="create-outline" size={18} color="white" />
          </TouchableOpacity>
        </View>

        <Text className="text-center text-zinc-700 font-bold text-[10px] mt-10 uppercase tracking-widest">
          MeuPersonal v1.2.0 • Energy Build
        </Text>
      </ScrollView>
    </ScreenLayout>
  );
}
