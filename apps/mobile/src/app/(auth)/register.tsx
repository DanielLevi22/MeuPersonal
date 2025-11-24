import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuthStore();

  async function handleRegister() {
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, 'professional');

    if (!result.success) {
      Alert.alert('Erro no Cadastro', result.error || 'Erro desconhecido');
    } else {
      Alert.alert('Sucesso!', 'Conta criada com sucesso! Faça login para continuar.');
      router.replace('/(auth)/login');
    }
    setLoading(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 40 }}>
            <View style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              backgroundColor: 'rgba(0, 255, 136, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20
            }}>
              <Ionicons name="fitness" size={40} color="#00FF88" />
            </View>
            
            <Text style={{ 
              fontSize: 36, 
              fontWeight: '800', 
              color: '#FFFFFF',
              marginBottom: 8,
              letterSpacing: -1,
              textAlign: 'center'
            }}>
              Cadastro de Professional
            </Text>
            
            <Text style={{ 
              fontSize: 16, 
              color: '#8B92A8',
              textAlign: 'center',
              lineHeight: 24
            }}>
              Crie sua conta profissional e gerencie seus alunos 🚀
            </Text>
          </View>

          {/* Register Form */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                E-mail
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#5A6178"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  backgroundColor: '#141B2D',
                  borderWidth: 2,
                  borderColor: '#1E2A42',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  color: '#FFFFFF',
                  fontSize: 16,
                  height: 56
                }}
              />
            </View>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Senha
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#5A6178"
                secureTextEntry
                style={{
                  backgroundColor: '#141B2D',
                  borderWidth: 2,
                  borderColor: '#1E2A42',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  color: '#FFFFFF',
                  fontSize: 16,
                  height: 56
                }}
              />
            </View>

            <View style={{ marginBottom: 32 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Confirmar Senha
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Digite a senha novamente"
                placeholderTextColor="#5A6178"
                secureTextEntry
                style={{
                  backgroundColor: '#141B2D',
                  borderWidth: 2,
                  borderColor: '#1E2A42',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  color: '#FFFFFF',
                  fontSize: 16,
                  height: 56
                }}
              />
            </View>

            <TouchableOpacity 
              onPress={handleRegister} 
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00FF88', '#00CC6E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#00FF88',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <Text style={{ color: '#0A0E1A', fontSize: 18, fontWeight: '700' }}>
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#1E2A42' }} />
            <Text style={{ color: '#5A6178', paddingHorizontal: 16, fontSize: 14 }}>ou</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#1E2A42' }} />
          </View>

          {/* Login Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#8B92A8', fontSize: 15 }}>Já tem uma conta? </Text>
            <Link href={'/(auth)/login' as any} asChild>
              <TouchableOpacity>
                <Text style={{ color: '#00FF88', fontSize: 15, fontWeight: '700' }}>
                  Faça login
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Footer */}
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="shield-checkmark" size={16} color="#00FF88" />
              <Text style={{ color: '#5A6178', fontSize: 12, marginLeft: 6 }}>100% Seguro e Privado</Text>
            </View>
            <Text style={{ color: '#5A6178', fontSize: 12 }}>
              Ao criar uma conta, você concorda com nossos Termos
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
