import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
    <ScreenLayout>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center mt-6 mb-10">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6 border border-primary/20">
            <Ionicons name="fitness" size={40} color="#CCFF00" />
          </View>
          
          <Text className="text-3xl font-bold text-foreground mb-2 tracking-tighter text-center font-display">
            Cadastro de Professional
          </Text>
          
          <Text className="text-base text-muted-foreground text-center leading-6 font-sans">
            Crie sua conta profissional e gerencie seus alunos 🚀
          </Text>
        </View>

        {/* Register Form */}
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
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
          />

          <Input
            label="Confirmar Senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Digite a senha novamente"
            secureTextEntry
          />

          <Button 
            label="Criar Conta"
            onPress={handleRegister}
            isLoading={loading}
            className="mt-4"
          />
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-8">
          <View className="flex-1 h-[1px] bg-border" />
          <Text className="text-muted-foreground px-4 text-sm">ou</Text>
          <View className="flex-1 h-[1px] bg-border" />
        </View>

        {/* Login Link */}
        <View className="flex-row justify-center items-center mb-8">
          <Text className="text-muted-foreground text-base">Já tem uma conta? </Text>
          <Link href={'/(auth)/login' as any} asChild>
            <TouchableOpacity>
              <Text className="text-primary text-base font-bold">
                Faça login
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Footer */}
        <View className="mt-auto items-center">
          <View className="flex-row items-center mb-2">
            <Ionicons name="shield-checkmark" size={16} color="#CCFF00" />
            <Text className="text-muted-foreground text-xs ml-2">100% Seguro e Privado</Text>
          </View>
          <Text className="text-muted-foreground text-xs text-center">
            Ao criar uma conta, você concorda com nossos Termos
          </Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
