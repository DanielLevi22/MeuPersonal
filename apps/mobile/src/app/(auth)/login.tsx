import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useAuthStore } from '@/store/authStore';
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
        <View className="items-center mt-10 mb-12">
          <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-6 border border-primary/20">
            <Ionicons name="barbell" size={48} color="#CCFF00" />
          </View>
          
          <Text className="text-5xl font-bold text-foreground mb-3 tracking-tighter font-display">
            MeuPersonal
          </Text>
          
          <Text className="text-base text-muted-foreground text-center px-8 leading-6 font-sans">
            Transforme seu corpo,{'\n'}transforme sua vida 💪
          </Text>
        </View>

        {/* Login Form */}
        <View className="mb-6 gap-y-4">
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
            className="mt-2"
          />

          <Link href={'/(auth)/forgot-password' as any} asChild>
            <TouchableOpacity className="mt-4 items-center">
              <Text className="text-secondary text-base font-semibold">
                Esqueci minha senha
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-[1px] bg-border" />
          <Text className="text-muted-foreground px-4 text-sm">ou</Text>
          <View className="flex-1 h-[1px] bg-border" />
        </View>

        {/* Student Login Button */}
        <View className="mb-8">
          <Button
            label="Sou Aluno (Entrar com Código)"
            onPress={() => router.push('/(auth)/student-login' as any)}
            variant="outline"
            icon={<Ionicons name="school-outline" size={20} color="#CCFF00" />}
            className="border-secondary/30 bg-secondary/5"
          />
        </View>

        {/* Register Link */}
        <View className="flex-row justify-center items-center mt-auto mb-8">
          <Text className="text-muted-foreground text-base">Personal Trainer? </Text>
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
