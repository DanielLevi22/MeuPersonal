import { Card } from '@/components/ui/Card';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useAuthStore } from '@/auth';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { signOut, user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: signOut }
      ]
    );
  };

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-8">
          <Text className="text-4xl font-bold text-foreground mb-1 font-display">
            Meu Perfil
          </Text>
          <Text className="text-base text-muted-foreground font-sans">
            Gerencie suas informações
          </Text>
        </View>

        {/* Profile Avatar & Level */}
        <View className="items-center mb-8">
          <View className="w-[120px] h-[120px] rounded-full bg-secondary/15 items-center justify-center mb-4 border-4 border-surface-highlight relative">
            <Ionicons name="person" size={60} color="#00D9FF" />
            {/* Level Badge */}
            <View className="absolute -bottom-2.5 bg-primary px-3 py-1 rounded-xl border-2 border-background">
              <Text className="text-black font-bold text-xs font-display">
                LVL {profile?.level || 1}
              </Text>
            </View>
          </View>
          
          <Text className="text-foreground text-2xl font-bold mb-1 font-display">
            {profile?.full_name || 'Usuário'}
          </Text>
          
          <View className={`px-4 py-2 rounded-xl mb-4 ${profile?.role === 'personal' ? 'bg-primary/15' : 'bg-secondary/15'}`}>
            <Text className={`text-sm font-bold font-display ${profile?.role === 'personal' ? 'text-primary' : 'text-secondary'}`}>
              {profile?.role === 'personal' ? '🏋️ Personal Trainer' : '💪 Aluno'}
            </Text>
          </View>

          {/* XP Progress Bar */}
          {profile?.role !== 'personal' && (
            <View className="w-full px-5">
              <View className="flex-row justify-between mb-2">
                <Text className="text-muted-foreground text-xs font-semibold font-sans">
                  XP {profile?.xp || 0}
                </Text>
                <Text className="text-muted-foreground text-xs font-semibold font-sans">
                  Próximo Nível: {Math.pow((profile?.level || 1) * 20, 2)}
                </Text>
              </View>
              <View className="h-2 bg-surface-highlight rounded-full overflow-hidden">
                <LinearGradient
                  colors={['#00D9FF', '#0099FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, ((profile?.xp || 0) - Math.pow(((profile?.level || 1) - 1) * 20, 2)) / (Math.pow((profile?.level || 1) * 20, 2) - Math.pow(((profile?.level || 1) - 1) * 20, 2)) * 100))}%`
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Info Cards */}
        <View className="mb-6">
          <Text className="text-muted-foreground text-sm font-semibold mb-3 ml-1 font-sans">
            INFORMAÇÕES
          </Text>
          
          {/* Email */}
          <Card className="p-5 mb-3 flex-row items-center border-2 border-border">
            <View className="bg-secondary/15 p-3 rounded-xl mr-4">
              <Ionicons name="mail" size={24} color="#00D9FF" />
            </View>
            <View className="flex-1">
              <Text className="text-muted-foreground text-xs mb-1 font-sans">E-mail</Text>
              <Text className="text-foreground text-base font-semibold font-sans">
                {user?.email || 'Não informado'}
              </Text>
            </View>
          </Card>

          {/* Role */}
          <Card className="p-5 border-2 border-border flex-row items-center">
            <View className="bg-primary/15 p-3 rounded-xl mr-4">
              <Ionicons name="shield-checkmark" size={24} color="#CCFF00" />
            </View>
            <View className="flex-1">
              <Text className="text-muted-foreground text-xs mb-1 font-sans">Tipo de Conta</Text>
              <Text className="text-foreground text-base font-semibold font-sans">
                {profile?.role === 'personal' ? 'Personal Trainer' : 'Aluno'}
              </Text>
            </View>
          </Card>
        </View>

        {/* Actions */}
        <View className="mb-8">
          <Text className="text-muted-foreground text-sm font-semibold mb-3 ml-1 font-sans">
            AÇÕES
          </Text>

          {/* Edit Profile Button */}
          <TouchableOpacity activeOpacity={0.8} className="mb-3">
            <Card className="p-4 border-2 border-border flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
                <Text className="text-foreground text-base font-semibold ml-3 font-sans">
                  Editar Perfil
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#71717A" />
            </Card>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity 
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF3B3B', '#CC2E2E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-4 flex-row items-center justify-center shadow-lg shadow-red-500/30"
            >
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              <Text className="text-white text-base font-bold ml-3 font-display">
                Sair da Conta
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text className="text-muted-foreground text-center text-xs mb-6 font-sans">
          MeuPersonal v1.0.0
        </Text>
      </ScrollView>
    </ScreenLayout>
  );
}
