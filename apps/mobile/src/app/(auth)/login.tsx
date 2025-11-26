import { useAuthStore } from '@/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuthStore();

  async function handleLogin() {
    setLoading(true);
    const result = await signIn(email, password);

    if (!result.success) {
      Alert.alert('Erro no Login', result.error || 'Erro desconhecido');
    } else {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check account status
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_status')
          .eq('id', user.id)
          .single();

        if (profile?.account_status === 'pending') {
          router.replace('/(auth)/pending-approval' as any);
          setLoading(false);
          return;
        } else if (profile?.account_status === 'rejected' || profile?.account_status === 'suspended') {
          await supabase.auth.signOut();
          Alert.alert(
            'Acesso Negado',
            'Sua conta foi suspensa ou rejeitada. Entre em contato com o suporte.'
          );
        }
      }
    }
    setLoading(false);
  }

  return (
    <ScreenLayout>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Icon */}
        <View className="items-center mt-16 mb-12">
          <View className="w-28 h-28 rounded-full bg-primary/15 items-center justify-center mb-8 border-2 border-primary/30 shadow-lg shadow-primary/20">
            <Ionicons name="barbell" size={56} color="#A3E635" />
          </View>
          
          <Text className="text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            MeuPersonal
          </Text>
          
          <Text className="text-lg text-zinc-400 text-center px-4 leading-7">
            Transforme seu corpo,{'\n'}transforme sua vida
          </Text>
          <Text className="text-4xl mt-2">💪</Text>
        </View>

        {/* Login Form */}
        <View className="mb-6 gap-y-5">
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <Button 
            label="Entrar"
            onPress={handleLogin}
            isLoading={loading}
            className="mt-3"
            size="lg"
          />

          <Link href={'/(auth)/forgot-password' as any} asChild>
            <TouchableOpacity className="items-center py-2">
              <Text className="text-cyan-400 text-base font-semibold">
                Esqueci minha senha
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-[1px] bg-white/10" />
          <Text className="text-zinc-500 px-4 text-sm font-medium">ou</Text>
          <View className="flex-1 h-[1px] bg-white/10" />
        </View>


        {/* Student Login Button */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/student-login' as any)}
            activeOpacity={0.7}
            className="bg-cyan-400/10 border-2 border-cyan-400/40 rounded-2xl p-4 flex-row items-center justify-center shadow-lg shadow-cyan-400/10"
          >
            <View className="bg-cyan-400/20 p-3 rounded-xl mr-3 border border-cyan-400/30">
              <Ionicons name="school" size={28} color="#22D3EE" />
            </View>
            <View className="flex-1">
              <Text className="text-cyan-400 text-base font-bold">
                Sou Aluno
              </Text>
              <Text className="text-cyan-400/70 text-xs font-medium mt-0.5">
                Entrar com Código
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#22D3EE" />
          </TouchableOpacity>
        </View>


        {/* Register Link */}
        <View className="flex-row justify-center items-center mt-auto mb-8">
          <Text className="text-zinc-400 text-base">Personal Trainer? </Text>
          <Link href={'/(auth)/register' as any} asChild>
            <TouchableOpacity>
              <Text className="text-primary text-base font-bold">
                Cadastre-se grátis
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
