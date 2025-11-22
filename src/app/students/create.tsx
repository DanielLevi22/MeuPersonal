import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#5A6178"
        keyboardType={keyboardType}
        style={{
          backgroundColor: '#141B2D',
          borderRadius: 12,
          padding: 16,
          color: '#FFFFFF',
          fontSize: 16
        }}
      />
    </View>
  );

  if (generatedCode) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(0, 255, 136, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24
            }}>
              <Ionicons name="checkmark" size={40} color="#00FF88" />
            </View>

            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>
              Aluno Cadastrado!
            </Text>
            <Text style={{ fontSize: 16, color: '#8B92A8', textAlign: 'center', marginBottom: 32 }}>
              Envie o código abaixo para {name} acessar o app.
            </Text>

            <View style={{
              backgroundColor: '#141B2D',
              paddingHorizontal: 32,
              paddingVertical: 24,
              borderRadius: 16,
              marginBottom: 32,
              borderWidth: 2,
              borderColor: '#00FF88',
              borderStyle: 'dashed',
              width: '100%',
              alignItems: 'center'
            }}>
              <Text style={{ 
                fontSize: 40, 
                fontWeight: '800', 
                color: '#00FF88',
                letterSpacing: 4,
                fontFamily: 'monospace'
              }}>
                {generatedCode}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={handleShare}
              activeOpacity={0.8}
              style={{ width: '100%', marginBottom: 16 }}
            >
              <LinearGradient
                colors={['#00FF88', '#00CC6E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row'
                }}
              >
                <Ionicons name="share-social" size={20} color="#0A0E1A" style={{ marginRight: 8 }} />
                <Text style={{ color: '#0A0E1A', fontSize: 18, fontWeight: '700' }}>
                  Compartilhar Código
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ padding: 16 }}
            >
              <Text style={{ color: '#8B92A8', fontSize: 16 }}>Voltar para Lista</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 24, paddingBottom: 16 }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{
                backgroundColor: '#141B2D',
                padding: 10,
                borderRadius: 12,
                marginRight: 16
              }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF' }}>
              Novo Aluno
            </Text>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 24, marginBottom: 24 }}>
            {['personal', 'measurements', 'skinfolds'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab as any)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === tab ? '#00D9FF' : 'transparent'
                }}
              >
                <Text style={{ 
                  color: activeTab === tab ? '#00D9FF' : '#5A6178',
                  fontWeight: '700',
                  fontSize: 14
                }}>
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
                
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                    Observações
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Objetivos, lesões, etc..."
                    placeholderTextColor="#5A6178"
                    multiline
                    numberOfLines={4}
                    style={{
                      backgroundColor: '#141B2D',
                      borderRadius: 12,
                      padding: 16,
                      color: '#FFFFFF',
                      fontSize: 16,
                      height: 100,
                      textAlignVertical: 'top'
                    }}
                  />
                </View>
              </View>
            )}

            {activeTab === 'measurements' && (
              <View>
                <Text style={{ color: '#00D9FF', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
                  Circunferências (cm)
                </Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>{renderInput('Pescoço', neck, setNeck, '0', 'numeric')}</View>
                  <View style={{ flex: 1 }}>{renderInput('Ombro', shoulder, setShoulder, '0', 'numeric')}</View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>{renderInput('Peito', chest, setChest, '0', 'numeric')}</View>
                  <View style={{ flex: 1 }}>{renderInput('Antebraço', forearm, setForearm, '0', 'numeric')}</View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>{renderInput('Braço Dir. (Rel)', armRightRelaxed, setArmRightRelaxed, '0', 'numeric')}</View>
                  <View style={{ flex: 1 }}>{renderInput('Braço Esq. (Rel)', armLeftRelaxed, setArmLeftRelaxed, '0', 'numeric')}</View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>{renderInput('Braço Dir. (Con)', armRightContracted, setArmRightContracted, '0', 'numeric')}</View>
                  <View style={{ flex: 1 }}>{renderInput('Braço Esq. (Con)', armLeftContracted, setArmLeftContracted, '0', 'numeric')}</View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>{renderInput('Cintura', waist, setWaist, '0', 'numeric')}</View>
                  <View style={{ flex: 1 }}>{renderInput('Abdômen', abdomen, setAbdomen, '0', 'numeric')}</View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>{renderInput('Quadril', hips, setHips, '0', 'numeric')}</View>
                  <View style={{ flex: 1 }}>{renderInput('Panturrilha', calf, setCalf, '0', 'numeric')}</View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>{renderInput('Coxa Proximal', thighProximal, setThighProximal, '0', 'numeric')}</View>
                  <View style={{ flex: 1 }}>{renderInput('Coxa Distal', thighDistal, setThighDistal, '0', 'numeric')}</View>
                </View>
              </View>
            )}

            {activeTab === 'skinfolds' && (
              <View>
                <Text style={{ color: '#00D9FF', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
                  Dobras Cutâneas (mm)
                </Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>{renderInput('Peitoral', skinfoldChest, setSkinfoldChest, '0', 'numeric')}</View>
                  <View style={{ flex: 1 }}>{renderInput('Abdominal', skinfoldAbdominal, setSkinfoldAbdominal, '0', 'numeric')}</View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>{renderInput('Coxa', skinfoldThigh, setSkinfoldThigh, '0', 'numeric')}</View>
                  <View style={{ flex: 1 }}>{renderInput('Tríceps', skinfoldTriceps, setSkinfoldTriceps, '0', 'numeric')}</View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>{renderInput('Supra-ilíaca', skinfoldSuprailiac, setSkinfoldSuprailiac, '0', 'numeric')}</View>
                  <View style={{ flex: 1 }}>{renderInput('Subescapular', skinfoldSubscapular, setSkinfoldSubscapular, '0', 'numeric')}</View>
                </View>
                {renderInput('Axilar Média', skinfoldMidaxillary, setSkinfoldMidaxillary, '0', 'numeric')}
              </View>
            )}

            <TouchableOpacity 
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
              style={{ marginTop: 24, marginBottom: 40 }}
            >
              <LinearGradient
                colors={['#00D9FF', '#00A6C4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                  {loading ? 'Salvando...' : 'Salvar e Gerar Código'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
