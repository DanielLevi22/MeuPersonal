import { useAuthStore } from '@/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStudentStore } from '../store/studentStore';

export default function CreateStudentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createStudentInvite } = useStudentStore();
  
  // Personal Data
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // Anthropometric Measurements
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [neck, setNeck] = useState('');
  const [shoulder, setShoulder] = useState('');
  const [chest, setChest] = useState('');
  const [armRightRelaxed, setArmRightRelaxed] = useState('');
  const [armLeftRelaxed, setArmLeftRelaxed] = useState('');
  const [armRightContracted, setArmRightContracted] = useState('');
  const [armLeftContracted, setArmLeftContracted] = useState('');
  const [forearm, setForearm] = useState('');
  const [waist, setWaist] = useState('');
  const [abdomen, setAbdomen] = useState('');
  const [hips, setHips] = useState('');
  const [thighProximal, setThighProximal] = useState('');
  const [thighDistal, setThighDistal] = useState('');
  const [calf, setCalf] = useState('');

  // Skinfolds
  const [skinfoldChest, setSkinfoldChest] = useState('');
  const [skinfoldAbdominal, setSkinfoldAbdominal] = useState('');
  const [skinfoldThigh, setSkinfoldThigh] = useState('');
  const [skinfoldTriceps, setSkinfoldTriceps] = useState('');
  const [skinfoldSuprailiac, setSkinfoldSuprailiac] = useState('');
  const [skinfoldSubscapular, setSkinfoldSubscapular] = useState('');
  const [skinfoldMidaxillary, setSkinfoldMidaxillary] = useState('');

  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'measurements' | 'skinfolds'>('personal');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome do aluno é obrigatório.');
      return;
    }

    if (!user?.id) return;

    setLoading(true);

    const assessmentData = {
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      neck: neck ? parseFloat(neck) : null,
      shoulder: shoulder ? parseFloat(shoulder) : null,
      chest: chest ? parseFloat(chest) : null,
      arm_right_relaxed: armRightRelaxed ? parseFloat(armRightRelaxed) : null,
      arm_left_relaxed: armLeftRelaxed ? parseFloat(armLeftRelaxed) : null,
      arm_right_contracted: armRightContracted ? parseFloat(armRightContracted) : null,
      arm_left_contracted: armLeftContracted ? parseFloat(armLeftContracted) : null,
      forearm: forearm ? parseFloat(forearm) : null,
      waist: waist ? parseFloat(waist) : null,
      abdomen: abdomen ? parseFloat(abdomen) : null,
      hips: hips ? parseFloat(hips) : null,
      thigh_proximal: thighProximal ? parseFloat(thighProximal) : null,
      thigh_distal: thighDistal ? parseFloat(thighDistal) : null,
      calf: calf ? parseFloat(calf) : null,
      skinfold_chest: skinfoldChest ? parseFloat(skinfoldChest) : null,
      skinfold_abdominal: skinfoldAbdominal ? parseFloat(skinfoldAbdominal) : null,
      skinfold_thigh: skinfoldThigh ? parseFloat(skinfoldThigh) : null,
      skinfold_triceps: skinfoldTriceps ? parseFloat(skinfoldTriceps) : null,
      skinfold_suprailiac: skinfoldSuprailiac ? parseFloat(skinfoldSuprailiac) : null,
      skinfold_subscapular: skinfoldSubscapular ? parseFloat(skinfoldSubscapular) : null,
      skinfold_midaxillary: skinfoldMidaxillary ? parseFloat(skinfoldMidaxillary) : null,
    };

    const result = await createStudentInvite({
      personal_id: user.id,
      name,
      phone,
      weight,
      height,
      notes,
      initial_assessment: assessmentData
    });

    setLoading(false);

    if (result.success && result.code) {
      setGeneratedCode(result.code);
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível cadastrar o aluno.');
    }
  };

  const handleShare = async () => {
    if (!generatedCode) return;
    try {
      await Share.share({
        message: `Olá ${name}! 💪\n\nJá cadastrei seu perfil no MeuPersonal.\nUse o código *${generatedCode}* para acessar seus treinos!\n\nBaixe o app agora!`,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  };

  const renderInput = (label: string, value: string, onChange: (text: string) => void, placeholder: string, keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default') => (
    <View className="mb-4">
      <Text className="text-foreground text-sm font-semibold mb-2 font-sans">
        {label}
      </Text>
      <Input
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );

  if (generatedCode) {
    return (
      <ScreenLayout>
        <View className="flex-1 px-6 justify-center items-center">
          <View className="w-20 h-20 rounded-full bg-green-500/15 items-center justify-center mb-6">
            <Ionicons name="checkmark" size={40} color="#00FF88" />
          </View>

          <Text className="text-2xl font-bold text-foreground mb-2 text-center font-display">
            Aluno Cadastrado!
          </Text>
          <Text className="text-base text-muted-foreground text-center mb-8 font-sans">
            Envie o código abaixo para {name} acessar o app.
          </Text>

          <View className="bg-surface px-8 py-6 rounded-2xl mb-8 border-2 border-dashed border-green-500 w-full items-center">
            <Text className="text-4xl font-bold text-green-500 tracking-widest font-mono">
              {generatedCode}
            </Text>
          </View>

          <Button
            onPress={handleShare}
            className="w-full mb-4"
            variant="primary"
            label="Compartilhar Código"
            icon={<Ionicons name="share-social" size={20} color="#000000" />}
          />

          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-4"
          >
            <Text className="text-muted-foreground text-base font-sans">Voltar para Lista</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-surface p-2.5 rounded-xl mr-4 border border-border"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground font-display">
            Novo Aluno
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row px-6 mb-6">
          {['personal', 'measurements', 'skinfolds'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 items-center border-b-2 ${activeTab === tab ? 'border-primary' : 'border-transparent'}`}
            >
              <Text className={`font-bold text-sm font-display ${activeTab === tab ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab === 'personal' ? 'Dados' : tab === 'measurements' ? 'Medidas' : 'Dobras'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 0 }}>
          {activeTab === 'personal' && (
            <View>
              {renderInput('Nome Completo *', name, setName, 'Ex: João Silva')}
              {renderInput('Telefone', phone, setPhone, 'Ex: (11) 99999-9999', 'phone-pad')}
              {renderInput('Peso (kg)', weight, setWeight, 'Ex: 75.5', 'numeric')}
              {renderInput('Altura (cm)', height, setHeight, 'Ex: 175', 'numeric')}
              
              <View className="mb-4">
                <Text className="text-foreground text-sm font-semibold mb-2 font-sans">
                  Observações
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Objetivos, lesões, etc..."
                  placeholderTextColor="#71717A"
                  multiline
                  numberOfLines={4}
                  className="bg-surface rounded-xl p-4 text-foreground text-base h-24 border border-border"
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {activeTab === 'measurements' && (
            <View>
              <Text className="text-primary text-base font-bold mb-4 font-display">
                Circunferências (cm)
              </Text>
              <View className="flex-row gap-4">
                <View className="flex-1">{renderInput('Pescoço', neck, setNeck, '0', 'numeric')}</View>
                <View className="flex-1">{renderInput('Ombro', shoulder, setShoulder, '0', 'numeric')}</View>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">{renderInput('Peito', chest, setChest, '0', 'numeric')}</View>
                <View className="flex-1">{renderInput('Antebraço', forearm, setForearm, '0', 'numeric')}</View>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">{renderInput('Braço Dir. (Rel)', armRightRelaxed, setArmRightRelaxed, '0', 'numeric')}</View>
                <View className="flex-1">{renderInput('Braço Esq. (Rel)', armLeftRelaxed, setArmLeftRelaxed, '0', 'numeric')}</View>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">{renderInput('Braço Dir. (Con)', armRightContracted, setArmRightContracted, '0', 'numeric')}</View>
                <View className="flex-1">{renderInput('Braço Esq. (Con)', armLeftContracted, setArmLeftContracted, '0', 'numeric')}</View>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">{renderInput('Cintura', waist, setWaist, '0', 'numeric')}</View>
                <View className="flex-1">{renderInput('Abdômen', abdomen, setAbdomen, '0', 'numeric')}</View>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">{renderInput('Quadril', hips, setHips, '0', 'numeric')}</View>
                <View className="flex-1">{renderInput('Panturrilha', calf, setCalf, '0', 'numeric')}</View>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">{renderInput('Coxa Proximal', thighProximal, setThighProximal, '0', 'numeric')}</View>
                <View className="flex-1">{renderInput('Coxa Distal', thighDistal, setThighDistal, '0', 'numeric')}</View>
              </View>
            </View>
          )}

          {activeTab === 'skinfolds' && (
            <View>
              <Text className="text-primary text-base font-bold mb-4 font-display">
                Dobras Cutâneas (mm)
              </Text>
              <View className="flex-row gap-4">
                <View className="flex-1">{renderInput('Peitoral', skinfoldChest, setSkinfoldChest, '0', 'numeric')}</View>
                <View className="flex-1">{renderInput('Abdominal', skinfoldAbdominal, setSkinfoldAbdominal, '0', 'numeric')}</View>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">{renderInput('Coxa', skinfoldThigh, setSkinfoldThigh, '0', 'numeric')}</View>
                <View className="flex-1">{renderInput('Tríceps', skinfoldTriceps, setSkinfoldTriceps, '0', 'numeric')}</View>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">{renderInput('Supra-ilíaca', skinfoldSuprailiac, setSkinfoldSuprailiac, '0', 'numeric')}</View>
                <View className="flex-1">{renderInput('Subescapular', skinfoldSubscapular, setSkinfoldSubscapular, '0', 'numeric')}</View>
              </View>
              {renderInput('Axilar Média', skinfoldMidaxillary, setSkinfoldMidaxillary, '0', 'numeric')}
            </View>
          )}

          <Button 
            onPress={handleSave}
            disabled={loading}
            className="mt-6 mb-10"
            variant="primary"
            label={loading ? 'Salvando...' : 'Salvar e Gerar Código'}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
