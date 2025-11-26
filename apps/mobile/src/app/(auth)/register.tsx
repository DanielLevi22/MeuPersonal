import { useAuthStore } from '@/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { ServiceSelectionCard } from '@/components/ui/ServiceSelectionCard';
import { Ionicons } from '@expo/vector-icons';
import type { AccountType, ServiceCategory } from '@meupersonal/supabase';
import { supabase } from '@meupersonal/supabase';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type Step = 'account_type' | 'services' | 'personal_data';

export default function RegisterScreen() {
  const [step, setStep] = useState<Step>('account_type');
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [selectedServices, setSelectedServices] = useState<ServiceCategory[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuthStore();

  const toggleService = (service: ServiceCategory) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type);
    if (type === 'professional') {
      setStep('services');
    } else {
      setStep('personal_data');
    }
  };

  const handleServicesNext = () => {
    if (selectedServices.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um serviço que você oferece');
      return;
    }
    setStep('personal_data');
  };

  async function handleRegister() {
    if (!fullName.trim()) {
      Alert.alert('Erro', 'Digite seu nome completo');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // 1. Criar conta no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            account_type: accountType,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Erro ao criar usuário');

      // 2. Aguardar um pouco para o trigger criar o perfil
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Se profissional, criar registros de serviços
      if (accountType === 'professional' && selectedServices.length > 0) {
        const services = selectedServices.map((category) => ({
          user_id: data.user.id,
          service_category: category,
          is_active: true,
        }));

        // Tentar criar serviços com retry
        let retries = 3;
        let servicesError = null;
        
        while (retries > 0) {
          const { error } = await supabase
            .from('professional_services')
            .insert(services);

          if (!error) {
            break; // Sucesso!
          }
          
          servicesError = error;
          retries--;
          
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (servicesError) {
          console.error('Erro ao criar serviços:', servicesError);
          Alert.alert(
            'Atenção',
            'Conta criada, mas houve um erro ao registrar seus serviços. Entre em contato com o suporte.'
          );
        }
      }

      // 3. Redirecionar
      if (accountType === 'professional') {
        router.replace('/(auth)/pending-approval' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (error: any) {
      Alert.alert('Erro no Cadastro', error.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenLayout>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center mt-12 mb-8">
          <View className="w-24 h-24 rounded-full bg-primary/15 items-center justify-center mb-6 border-2 border-primary/30 shadow-lg shadow-primary/20">
            <Ionicons name="person-add" size={48} color="#A3E635" />
          </View>

          <Text className="text-4xl font-extrabold text-foreground mb-3 tracking-tight text-center">
            Criar Conta
          </Text>

          <Text className="text-base text-zinc-400 text-center leading-6 px-4">
            {step === 'account_type' && 'Escolha o tipo de conta'}
            {step === 'services' && 'Selecione seus serviços'}
            {step === 'personal_data' && 'Complete seu cadastro'}
          </Text>
        </View>

        {/* Step 1: Account Type Selection */}
        {step === 'account_type' && (
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => handleAccountTypeSelect('professional')}
              activeOpacity={0.7}
              className="mb-4"
            >
              <View className="bg-card border-2 border-zinc-700 rounded-2xl p-5 flex-row items-center">
                <View className="w-16 h-16 rounded-xl bg-primary/20 items-center justify-center mr-4 border border-primary/30">
                  <Ionicons name="barbell" size={32} color="#A3E635" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold mb-1">Sou Profissional</Text>
                  <Text className="text-zinc-400 text-sm">
                    Personal Trainer, Nutricionista, etc.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#A3E635" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAccountTypeSelect('autonomous_student')}
              activeOpacity={0.7}
            >
              <View className="bg-card border-2 border-zinc-700 rounded-2xl p-5 flex-row items-center">
                <View className="w-16 h-16 rounded-xl bg-cyan-400/20 items-center justify-center mr-4 border border-cyan-400/30">
                  <Ionicons name="person" size={32} color="#22D3EE" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold mb-1">Sou Aluno</Text>
                  <Text className="text-zinc-400 text-sm">
                    Treinar e acompanhar meu progresso
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#22D3EE" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Service Selection (Professional only) */}
        {step === 'services' && (
          <View className="flex-1">
            <Text className="text-white text-lg font-bold mb-4">
              Quais serviços você oferece?
            </Text>
            <Text className="text-zinc-400 text-sm mb-6">
              Selecione um ou mais serviços (você pode alterar depois)
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

            <View className="mt-6 flex-row gap-3">
              <Button
                label="Voltar"
                onPress={() => setStep('account_type')}
                variant="outline"
                className="flex-1"
              />
              <Button
                label="Continuar"
                onPress={handleServicesNext}
                className="flex-1"
              />
            </View>
          </View>
        )}

        {/* Step 3: Personal Data */}
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

              <View className="flex-row gap-3 mt-3">
                <Button
                  label="Voltar"
                  onPress={() => setStep(accountType === 'professional' ? 'services' : 'account_type')}
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
          </View>
        )}

        {/* Footer */}
        <View className="mt-auto">
          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-[1px] bg-white/10" />
            <Text className="text-zinc-500 px-4 text-sm font-medium">ou</Text>
            <View className="flex-1 h-[1px] bg-white/10" />
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center items-center mb-6">
            <Text className="text-zinc-400 text-base">Já tem uma conta? </Text>
            <Link href={'/(auth)/login' as any} asChild>
              <TouchableOpacity>
                <Text className="text-primary text-base font-bold">Faça login</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Security Badge */}
          <View className="items-center mb-8">
            <View className="flex-row items-center mb-2">
              <Ionicons name="shield-checkmark" size={18} color="#A3E635" />
              <Text className="text-zinc-400 text-sm ml-2">100% Seguro e Privado</Text>
            </View>
            <Text className="text-zinc-500 text-xs text-center px-8">
              Ao criar uma conta, você concorda com nossos Termos
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
