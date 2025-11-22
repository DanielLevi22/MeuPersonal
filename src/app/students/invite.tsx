import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InviteStudentScreen() {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const { generateInviteCode } = useStudentStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const handleGenerateCode = async (force = false) => {
    if (!user?.id) return;
    const code = await generateInviteCode(user.id, force);
    setInviteCode(code);
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Olá! 💪\n\nUse o código ${inviteCode} para se cadastrar no MeuPersonal e acessar seus treinos personalizados!\n\nBaixe o app e comece sua transformação hoje!`,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24
        }}>
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
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>
            Convidar Aluno
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{
            backgroundColor: '#141B2D',
            padding: 32,
            borderRadius: 24,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#1E2A42'
          }}>
            {/* Icon */}
            <LinearGradient
              colors={['rgba(0, 217, 255, 0.2)', 'rgba(0, 217, 255, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 20,
                borderRadius: 50,
                marginBottom: 24
              }}
            >
              <Ionicons name="qr-code-outline" size={64} color="#00D9FF" />
            </LinearGradient>
            
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 24, 
              fontWeight: '800', 
              marginBottom: 8,
              textAlign: 'center'
            }}>
              Gerar Código de Convite
            </Text>
            <Text style={{ 
              color: '#8B92A8', 
              fontSize: 15, 
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 22,
              paddingHorizontal: 16
            }}>
              Envie este código para seu aluno se cadastrar e vincular ao seu perfil.
            </Text>

            {inviteCode ? (
              <View style={{ width: '100%', alignItems: 'center' }}>
                {/* Code Display */}
                <View style={{
                  backgroundColor: '#0A0E1A',
                  paddingHorizontal: 24,
                  paddingVertical: 20,
                  borderRadius: 16,
                  marginBottom: 24,
                  borderWidth: 2,
                  borderColor: '#FF6B35',
                  borderStyle: 'dashed',
                  width: '100%',
                  alignItems: 'center'
                }}>
                  <Text style={{ 
                    fontSize: 36, 
                    fontWeight: '800', 
                    color: '#FF6B35',
                    letterSpacing: 4,
                    fontFamily: 'monospace'
                  }}>
                    {inviteCode}
                  </Text>
                </View>
                
                {/* Share Button */}
                <TouchableOpacity 
                  onPress={handleShare}
                  activeOpacity={0.8}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  <LinearGradient
                    colors={['#00FF88', '#00CC6E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      paddingVertical: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row'
                    }}
                  >
                    <Ionicons name="share-social" size={20} color="#0A0E1A" style={{ marginRight: 8 }} />
                    <Text style={{ 
                      color: '#0A0E1A', 
                      fontSize: 16, 
                      fontWeight: '700'
                    }}>
                      Compartilhar Código
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Generate New Button */}
                <TouchableOpacity 
                  onPress={() => handleGenerateCode(true)}
                  activeOpacity={0.8}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderColor: '#00D9FF',
                    borderRadius: 16,
                    paddingVertical: 14,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#00D9FF', fontSize: 16, fontWeight: '700' }}>
                    Gerar Novo Código
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => handleGenerateCode(false)}
                activeOpacity={0.8}
                style={{ width: '100%' }}
              >
                <LinearGradient
                  colors={['#FF6B35', '#E85A2A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row'
                  }}
                >
                  <Ionicons name="add-circle" size={22} color="white" style={{ marginRight: 8 }} />
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontSize: 18, 
                    fontWeight: '700'
                  }}>
                    Gerar Código
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Info Card */}
          <View style={{
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            padding: 16,
            borderRadius: 16,
            marginTop: 24,
            borderWidth: 1,
            borderColor: 'rgba(0, 217, 255, 0.3)',
            flexDirection: 'row',
            alignItems: 'flex-start'
          }}>
            <Ionicons name="information-circle" size={24} color="#00D9FF" style={{ marginRight: 12, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#00D9FF', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>
                Como funciona?
              </Text>
              <Text style={{ color: '#8B92A8', fontSize: 13, lineHeight: 20 }}>
                O aluno deve usar este código durante o cadastro para se vincular automaticamente ao seu perfil de Personal Trainer.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
