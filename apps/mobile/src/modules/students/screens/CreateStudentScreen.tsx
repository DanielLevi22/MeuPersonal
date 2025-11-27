import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStudentStore } from '../store/studentStore';

export default function CreateStudentScreen() {
  const router = useRouter();
  const { createStudent, isLoading } = useStudentStore();
  const { user } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const handleCreate = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    const result = await createStudent({
      full_name: fullName,
      email: email.toLowerCase(),
      personal_id: user.id,
    });

    if (result.success) {
      Alert.alert(
        'Sucesso',
        'Aluno cadastrado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      Alert.alert('Erro', result.error || 'Falha ao cadastrar aluno');
    }
  };

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        {/* Header */}
        <View className="flex-row items-center mb-8">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="bg-zinc-900 p-3 rounded-xl mr-4 border border-zinc-800"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-extrabold text-white font-display">
              Novo Aluno
            </Text>
            <Text className="text-zinc-400 font-sans">
              Cadastre um novo aluno
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="flex-1">
          <View className="mb-6">
            <Text className="text-base font-bold text-white mb-3 font-display">
              Nome Completo
            </Text>
            <View className="bg-zinc-900 rounded-xl border-2 border-zinc-800 focus:border-orange-500 flex-row items-center px-4 h-14">
              <Ionicons name="person-outline" size={20} color="#71717A" style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-white text-base font-sans"
                placeholder="Ex: João Silva"
                placeholderTextColor="#52525B"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-base font-bold text-white mb-3 font-display">
              E-mail
            </Text>
            <View className="bg-zinc-900 rounded-xl border-2 border-zinc-800 focus:border-orange-500 flex-row items-center px-4 h-14">
              <Ionicons name="mail-outline" size={20} color="#71717A" style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-white text-base font-sans"
                placeholder="Ex: joao@email.com"
                placeholderTextColor="#52525B"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <Text className="text-zinc-500 text-xs mt-2 ml-1 font-sans">
              O aluno receberá um convite neste e-mail.
            </Text>
          </View>

          <TouchableOpacity 
            onPress={handleCreate}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF2E63']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl py-4 items-center justify-center shadow-lg shadow-orange-500/20"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-lg font-bold font-display">
                  Cadastrar Aluno
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
