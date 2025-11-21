import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Erro no Login', error.message);
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
          {/* Header with Gradient Icon */}
          <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 50 }}>
            <View style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 50, 
              backgroundColor: 'rgba(255, 107, 53, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24
            }}>
              <Ionicons name="barbell" size={56} color="#FF6B35" />
            </View>
            
            <Text style={{ 
              fontSize: 48, 
              fontWeight: '800', 
              color: '#FFFFFF',
              marginBottom: 12,
              letterSpacing: -1
            }}>
              MeuPersonal
            </Text>
            
            <Text style={{ 
              fontSize: 16, 
              color: '#8B92A8',
              textAlign: 'center',
              paddingHorizontal: 32,
              lineHeight: 24
            }}>
              Transforme seu corpo,{'\n'}transforme sua vida 💪
            </Text>
          </View>

          {/* Login Form */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 14, 
                fontWeight: '600',
                marginBottom: 8
              }}>
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
            
            <View style={{ marginBottom: 24 }}>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 14, 
                fontWeight: '600',
                marginBottom: 8
              }}>
                Senha
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
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

            {/* Login Button */}
            <TouchableOpacity 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
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
                  shadowColor: '#FF6B35',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: 18, 
                  fontWeight: '700'
                }}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Link href={'/(auth)/forgot-password' as any} asChild>
              <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: '#00D9FF', fontSize: 15, fontWeight: '600' }}>
                  Esqueci minha senha
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 32 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#1E2A42' }} />
            <Text style={{ color: '#5A6178', paddingHorizontal: 16, fontSize: 14 }}>ou</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#1E2A42' }} />
          </View>

          {/* Register Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#8B92A8', fontSize: 15 }}>Não tem uma conta? </Text>
            <Link href={'/(auth)/register' as any} asChild>
              <TouchableOpacity>
                <Text style={{ color: '#FF6B35', fontSize: 15, fontWeight: '700' }}>
                  Cadastre-se grátis
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Footer */}
          <Text style={{ 
            color: '#5A6178', 
            textAlign: 'center', 
            fontSize: 12,
            marginTop: 40,
            lineHeight: 18
          }}>
            Junte-se a milhares de pessoas{'\n'}alcançando seus objetivos
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Temporary TextInput import
import { TextInput } from 'react-native';
