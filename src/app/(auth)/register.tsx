import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Erro no Cadastro', error.message);
    } else {
      Alert.alert('Sucesso!', 'Conta criada com sucesso! Faça login para continuar.');
      router.replace('/(auth)/login');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-6 justify-center">
        {/* Header */}
        <View className="items-center mb-10">
          <View className="bg-accent/20 p-5 rounded-full mb-4">
            <Ionicons name="fitness" size={56} color="#00FF88" />
          </View>
          <Text className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
            Comece Agora
          </Text>
          <Text className="text-muted text-center text-base">
            Crie sua conta e alcance seus objetivos 🚀
          </Text>
        </View>

        {/* Register Form */}
        <View className="space-y-4">
          <Input
            label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Input
            label="Confirmar Senha"
            placeholder="Digite a senha novamente"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-muted px-4">ou</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {/* Login Link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-muted">Já tem uma conta? </Text>
          <Link href={'/(auth)/login' as any} asChild>
            <TouchableOpacity>
              <Text className="text-primary font-bold">Faça login</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Footer */}
        <View className="mt-10 space-y-2">
          <View className="flex-row items-center justify-center">
            <Ionicons name="shield-checkmark" size={16} color="#00FF88" />
            <Text className="text-muted-dark text-xs ml-2">100% Seguro e Privado</Text>
          </View>
          <Text className="text-muted-dark text-center text-xs">
            Ao criar uma conta, você concorda com nossos Termos
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
