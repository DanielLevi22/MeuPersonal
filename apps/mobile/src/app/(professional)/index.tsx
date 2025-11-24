import { useAuthStore } from '@/store/authStore';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfessionalDashboard() {
  const { signOut, user } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-background p-4">
      <View className="flex-1">
        <Text className="text-2xl font-bold text-foreground mb-4">
          Painel do Profissional
        </Text>
        <Text className="text-foreground mb-8">
          Bem-vindo, {user?.email}
        </Text>
        
        <View className="bg-surface p-4 rounded-lg mb-4">
          <Text className="text-foreground font-semibold mb-2">Meus Alunos</Text>
          <Text className="text-muted-foreground">Funcionalidade em breve...</Text>
        </View>

        <TouchableOpacity 
          onPress={signOut}
          className="bg-destructive p-4 rounded-lg items-center mt-auto"
        >
          <Text className="text-destructive-foreground font-bold">Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
