import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'meupersonal://reset-password',
      });

      if (error) throw error;

      setSent(true);
      Alert.alert(
        'E-mail enviado!',
        'Verifique sua caixa de entrada para redefinir sua senha.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-6">
      <View className="flex-row items-center mb-8">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">Esqueci minha senha</Text>
      </View>

      <View className="flex-1 justify-center">
        <View className="bg-surface p-6 rounded-2xl border border-border">
          <View className="items-center mb-6">
            <View className="bg-primary/20 p-4 rounded-full mb-4">
              <Ionicons name="lock-closed-outline" size={48} color="#3b82f6" />
            </View>
            <Text className="text-white text-lg font-bold mb-2">Recuperar Senha</Text>
            <Text className="text-muted text-center text-sm">
              Digite seu e-mail e enviaremos um link para redefinir sua senha.
            </Text>
          </View>

          <Input
            label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!sent}
          />

          <Button
            label={sent ? 'E-mail Enviado' : 'Enviar Link'}
            onPress={handleResetPassword}
            isLoading={loading}
            disabled={sent}
            className="mt-6"
          />

          {sent && (
            <View className="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
              <Text className="text-green-400 text-sm text-center">
                ✓ Verifique seu e-mail para continuar
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
