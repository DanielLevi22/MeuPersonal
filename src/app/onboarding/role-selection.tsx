import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelectionScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { session, setSession } = useAuthStore();

  async function selectRole(role: 'personal' | 'student') {
    if (!session?.user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          email: session.user.email,
          role: role,
          full_name: session.user.user_metadata?.full_name || '',
        });

      if (error) throw error;

      // Refresh session or update store if needed
      // For now, navigate to tabs
      router.replace('/(tabs)');
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
          label="Sou Personal Trainer"
          variant="primary"
          size="lg"
          onPress={() => selectRole('personal')}
          isLoading={loading}
        />
        
        <View className="items-center">
          <Text className="text-muted mb-2">ou</Text>
        </View>

        <Button
          label="Sou Aluno"
          variant="secondary"
          size="lg"
          onPress={() => selectRole('student')}
          isLoading={loading}
        />
      </View>
    </SafeAreaView>
  );
}
