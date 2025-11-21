import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 24 }}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>
              Meu Perfil
            </Text>
            <Text style={{ fontSize: 16, color: '#8B92A8' }}>
              Gerencie suas informações
            </Text>
          </View>

          {/* Profile Avatar */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(0, 217, 255, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              borderWidth: 4,
              borderColor: '#1E2A42'
            }}>
              <Ionicons name="person" size={60} color="#00D9FF" />
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
              {profile?.full_name || 'Usuário'}
            </Text>
            <View style={{
              backgroundColor: profile?.role === 'personal' ? 'rgba(255, 107, 53, 0.15)' : 'rgba(0, 217, 255, 0.15)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12
            }}>
              <Text style={{
                color: profile?.role === 'personal' ? '#FF6B35' : '#00D9FF',
                fontSize: 14,
                fontWeight: '700'
              }}>
                {profile?.role === 'personal' ? '🏋️ Personal Trainer' : '💪 Aluno'}
              </Text>
            </View>
          </View>

          {/* Info Cards */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#8B92A8', fontSize: 14, fontWeight: '600', marginBottom: 12, marginLeft: 4 }}>
              INFORMAÇÕES
            </Text>
            
            {/* Email */}
            <View style={{
              backgroundColor: '#141B2D',
              borderRadius: 16,
              padding: 20,
              marginBottom: 12,
              borderWidth: 2,
              borderColor: '#1E2A42',
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <View style={{
                backgroundColor: 'rgba(0, 217, 255, 0.15)',
                padding: 12,
                borderRadius: 12,
                marginRight: 16
              }}>
                <Ionicons name="mail" size={24} color="#00D9FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#8B92A8', fontSize: 12, marginBottom: 4 }}>E-mail</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  {user?.email || 'Não informado'}
                </Text>
              </View>
            </View>

            {/* Role */}
            <View style={{
              backgroundColor: '#141B2D',
              borderRadius: 16,
              padding: 20,
              borderWidth: 2,
              borderColor: '#1E2A42',
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <View style={{
                backgroundColor: 'rgba(255, 107, 53, 0.15)',
                padding: 12,
                borderRadius: 12,
                marginRight: 16
              }}>
                <Ionicons name="shield-checkmark" size={24} color="#FF6B35" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#8B92A8', fontSize: 12, marginBottom: 4 }}>Tipo de Conta</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  {profile?.role === 'personal' ? 'Personal Trainer' : 'Aluno'}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: '#8B92A8', fontSize: 14, fontWeight: '600', marginBottom: 12, marginLeft: 4 }}>
              AÇÕES
            </Text>

            {/* Edit Profile Button */}
            <TouchableOpacity 
              activeOpacity={0.8}
              style={{
                backgroundColor: '#141B2D',
                borderRadius: 16,
                padding: 18,
                marginBottom: 12,
                borderWidth: 2,
                borderColor: '#1E2A42',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 12 }}>
                  Editar Perfil
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#5A6178" />
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
                style={{
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FF3B3B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: 12 }}>
                  Sair da Conta
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={{ color: '#5A6178', textAlign: 'center', fontSize: 12, marginBottom: 24 }}>
            MeuPersonal v1.0.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
