import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentLoginScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithCode } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!code.trim()) {
      Alert.alert('Erro', 'Por favor, digite o código de convite.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithCode(code.trim());
      
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Erro', result.error || 'Código inválido ou não encontrado.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, padding: 24 }}>
              {/* Header */}
              <TouchableOpacity 
                onPress={() => router.back()}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#141B2D',
                  padding: 10,
                  borderRadius: 12,
                  marginBottom: 32
                }}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>

              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ alignItems: 'center', marginBottom: 40 }}>
                  <View style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: 'rgba(0, 217, 255, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24
                  }}>
                    <Ionicons name="school" size={56} color="#00D9FF" />
                  </View>
                  
                  <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 12, textAlign: 'center' }}>
                    Área do Aluno
                  </Text>
                  <Text style={{ fontSize: 16, color: '#8B92A8', textAlign: 'center', lineHeight: 24 }}>
                    Insira o código fornecido pelo seu Personal Trainer para acessar seus treinos.
                  </Text>
                </View>

                <View style={{ marginBottom: 24 }}>
                  <Text style={{ color: '#8B92A8', fontSize: 14, marginBottom: 8, fontWeight: '600', marginLeft: 4 }}>
                    CÓDIGO DE CONVITE
                  </Text>
                  <TextInput
                    value={code}
                    onChangeText={(text) => setCode(text.toUpperCase())}
                    placeholder="EX: AB12CD"
                    placeholderTextColor="#5A6178"
                    autoCapitalize="characters"
                    maxLength={6}
                    style={{
                      backgroundColor: '#141B2D',
                      borderWidth: 2,
                      borderColor: '#1E2A42',
                      borderRadius: 16,
                      padding: 20,
                      color: '#FFFFFF',
                      fontSize: 24,
                      fontWeight: '700',
                      textAlign: 'center',
                      letterSpacing: 4
                    }}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading || code.length < 6}
                  activeOpacity={0.8}
                  style={{ opacity: (loading || code.length < 6) ? 0.5 : 1 }}
                >
                  <LinearGradient
                    colors={['#00D9FF', '#00A6C4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      paddingVertical: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#00D9FF',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                        Acessar Treinos
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
