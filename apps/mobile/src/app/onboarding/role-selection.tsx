import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useAuthStore } from '@/auth';
import { Ionicons } from '@expo/vector-icons';
import type { AccountType } from '@meupersonal/supabase';
import { supabase } from '@meupersonal/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export default function RoleSelectionScreen() {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AccountType | null>(null);
  const router = useRouter();
  const { session, initializeSession } = useAuthStore();

  async function handleContinue() {
    if (!session?.user || !selectedRole) return;

    // Prevent manual admin role selection
    if (selectedRole === 'admin') {
      Alert.alert('Acesso Restrito', 'Contas de administrador são criadas apenas por convite.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          account_type: selectedRole,
          full_name: session.user.user_metadata?.full_name || '',
        });

      if (error) throw error;

      // Reinitialize session to load new account type and abilities
      await initializeSession(session);
      
      // Navigate based on role
      if (selectedRole === 'professional') {
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

  const RoleCard = ({ 
    type, 
    title, 
    description, 
    icon 
  }: { 
    type: AccountType, 
    title: string, 
    description: string, 
    icon: keyof typeof Ionicons.glyphMap 
  }) => (
    <TouchableOpacity 
      onPress={() => setSelectedRole(type)}
      activeOpacity={0.9}
      className="mb-4"
    >
      <Card 
        variant={selectedRole === type ? 'highlight' : 'default'}
        className={`p-6 flex-row items-center ${selectedRole === type ? 'border-primary' : ''}`}
      >
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
          selectedRole === type ? 'bg-primary' : 'bg-surface-highlight'
        }`}>
          <Ionicons 
            name={icon} 
            size={24} 
            color={selectedRole === type ? '#000000' : '#FFFFFF'} 
          />
        </View>
        <View className="flex-1">
          <Text className={`text-lg font-bold mb-1 font-display ${
            selectedRole === type ? 'text-primary' : 'text-foreground'
          }`}>
            {title}
          </Text>
          <Text className="text-muted-foreground text-sm font-sans">
            {description}
          </Text>
        </View>
        {selectedRole === type && (
          <Ionicons name="checkmark-circle" size={24} color="#CCFF00" />
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
      <View className="flex-1 p-6">
        <View className="items-center mt-10 mb-12">
          <Text className="text-3xl font-bold text-foreground mb-4 text-center font-display">
            Quem é você?
          </Text>
          <Text className="text-muted-foreground text-center text-lg font-sans">
            Escolha seu perfil para personalizarmos sua experiência.
          </Text>
        </View>

        <View className="flex-1">
          <RoleCard
            type="professional"
            title="Sou Profissional"
            description="Personal Trainer gerenciando alunos e treinos."
            icon="fitness"
          />
          
          <RoleCard
            type="autonomous_student"
            title="Sou Aluno Autônomo"
            description="Quero treinar e acompanhar meu progresso sozinho."
            icon="person"
          />
        </View>

        <View className="mt-auto">
          <Button
            label="Continuar"
            onPress={handleContinue}
            disabled={!selectedRole}
            isLoading={loading}
            className="mb-4"
          />
          
          <Text className="text-muted-foreground text-center text-xs mb-8">
            💼 Contas de administrador são criadas apenas por convite
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
}
