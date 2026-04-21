import { createAuthService, type ServiceType } from '@elevapro/shared';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { ServiceSelectionCard } from '@/components/ui/ServiceSelectionCard';
import { supabase } from '../../../lib/supabase';

const authService = createAuthService(supabase);

type Step = 'services' | 'personal_data';

export function RegisterScreen() {
  const [step, setStep] = useState<Step>('services');
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleService = (service: ServiceType) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleServicesNext = () => {
    if (selectedServices.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um serviço que você oferece');
      return;
    }
    setStep('personal_data');
  };

  const handleRegister = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      Alert.alert('Erro', 'Digite seu nome completo');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authService.signUpSpecialist({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        service_types: selectedServices,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Erro ao criar usuário');

      router.replace('/(tabs)' as never);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido. Tente novamente.';
      // Mensagem amigável para email já cadastrado
      if (message.toLowerCase().includes('already registered')) {
        Alert.alert('E-mail já cadastrado', 'Este e-mail já possui uma conta. Faça login.');
      } else {
        Alert.alert('Erro no Cadastro', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center mt-12 mb-8">
          <View className="w-24 h-24 rounded-full bg-primary/15 items-center justify-center mb-6 border-2 border-primary/30">
            <Ionicons name="person-add" size={48} color="#A3E635" />
          </View>
          <Text className="text-4xl font-extrabold text-foreground mb-3 tracking-tight text-center">
            Criar Conta
          </Text>
          <Text className="text-base text-muted text-center leading-6 px-4">
            {step === 'services' ? 'Quais serviços você oferece?' : 'Complete seu cadastro'}
          </Text>
        </View>

        {/* Step 1: Seleção de serviços */}
        {step === 'services' && (
          <View className="flex-1">
            <Text className="text-muted text-sm mb-6">
              Selecione um ou mais serviços (pode alterar depois)
            </Text>

            <ServiceSelectionCard
              service="personal_training"
              selected={selectedServices.includes('personal_training')}
              onToggle={() => toggleService('personal_training')}
            />

            <ServiceSelectionCard
              service="nutrition_consulting"
              selected={selectedServices.includes('nutrition_consulting')}
              onToggle={() => toggleService('nutrition_consulting')}
            />

            <Button label="Continuar" onPress={handleServicesNext} className="mt-6" />
          </View>
        )}

        {/* Step 2: Dados pessoais */}
        {step === 'personal_data' && (
          <View className="flex-1">
            <View className="mb-6 gap-y-5">
              <Input
                label="Nome Completo"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Seu nome"
                autoCapitalize="words"
              />
              <Input
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Input
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
              />
              <Input
                label="Confirmar Senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Digite a senha novamente"
                secureTextEntry
              />
            </View>

            <View className="flex-row gap-3">
              <Button
                label="Voltar"
                onPress={() => setStep('services')}
                variant="outline"
                className="flex-1"
              />
              <Button
                label="Criar Conta"
                onPress={handleRegister}
                isLoading={loading}
                size="lg"
                className="flex-1"
              />
            </View>
          </View>
        )}

        {/* Footer */}
        <View className="mt-auto">
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-[1px] bg-white/10" />
            <Text className="text-muted px-4 text-sm">ou</Text>
            <View className="flex-1 h-[1px] bg-white/10" />
          </View>

          <View className="flex-row justify-center items-center mb-6">
            <Text className="text-muted text-base">Já tem uma conta? </Text>
            <Link href={'/(auth)/login' as never} asChild>
              <TouchableOpacity>
                <Text className="text-primary text-base font-bold">Faça login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
