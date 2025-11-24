import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import type { AccountType } from '@meupersonal/supabase';
import { supabase } from '@meupersonal/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelectionScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { session, initializeSession } = useAuthStore();

  async function selectRole(accountType: AccountType) {
    if (!session?.user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          account_type: accountType,
          full_name: session.user.user_metadata?.full_name || '',
        });

      if (error) throw error;

      // Reinitialize session to load new account type and abilities
      await initializeSession(session);
      
      // Navigate based on role
      if (accountType === 'professional') {
        router.replace('/(professional)' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background p-6 justify-center">
      <View className="items-center mb-12">
        <Text className="text-3xl font-bold text-white mb-4">Quem é você?</Text>
        <Text className="text-muted text-center text-lg">
          Escolha seu perfil para começarmos.
        </Text>
      </View>

      <View className="space-y-6">
        <Button
          label="Sou Profissional"
          variant="primary"
          size="lg"
          onPress={() => selectRole('professional')}
          isLoading={loading}
        />
        
        <View className="items-center">
          <Text className="text-muted mb-2">ou</Text>
        </View>

        <Button
          label="Sou Aluno Autônomo"
          variant="secondary"
          size="lg"
          onPress={() => selectRole('autonomous_student')}
          isLoading={loading}
        />
      </View>
    </SafeAreaView>
  );
}
