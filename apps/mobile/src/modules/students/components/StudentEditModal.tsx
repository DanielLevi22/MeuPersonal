import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface StudentEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  student: any;
}

export function StudentEditModal({ visible, onClose, onSave, student }: StudentEditModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'measurements' | 'skinfolds'>('personal');
  const [loading, setLoading] = useState(false);

  // Personal
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Measurements
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

  useEffect(() => {
    if (student) {
      setName(student.full_name || '');
      setPhone(student.phone || '');
      setNotes(student.notes || '');
      
      // Load assessment data
      const assessment = student.assessment || {};
      setWeight(student.weight?.toString() || assessment.weight?.toString() || '');
      setHeight(student.height?.toString() || assessment.height?.toString() || '');
      
      setNeck(assessment.neck?.toString() || '');
      setShoulder(assessment.shoulder?.toString() || '');
      setChest(assessment.chest?.toString() || '');
      setArmRightRelaxed(assessment.arm_right_relaxed?.toString() || '');
      setArmLeftRelaxed(assessment.arm_left_relaxed?.toString() || '');
      setArmRightContracted(assessment.arm_right_contracted?.toString() || '');
      setArmLeftContracted(assessment.arm_left_contracted?.toString() || '');
      setForearm(assessment.forearm?.toString() || '');
      setWaist(assessment.waist?.toString() || '');
      setAbdomen(assessment.abdomen?.toString() || '');
      setHips(assessment.hips?.toString() || '');
      setThighProximal(assessment.thigh_proximal?.toString() || '');
      setThighDistal(assessment.thigh_distal?.toString() || '');
      setCalf(assessment.calf?.toString() || '');
      
      setSkinfoldChest(assessment.skinfold_chest?.toString() || '');
      setSkinfoldAbdominal(assessment.skinfold_abdominal?.toString() || '');
      setSkinfoldThigh(assessment.skinfold_thigh?.toString() || '');
      setSkinfoldTriceps(assessment.skinfold_triceps?.toString() || '');
      setSkinfoldSuprailiac(assessment.skinfold_suprailiac?.toString() || '');
      setSkinfoldSubscapular(assessment.skinfold_subscapular?.toString() || '');
      setSkinfoldMidaxillary(assessment.skinfold_midaxillary?.toString() || '');
    }
  }, [student]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({
        name,
        phone,
        notes,
        weight,
        height,
        neck,
        shoulder,
        chest,
        arm_right_relaxed: armRightRelaxed,
        arm_left_relaxed: armLeftRelaxed,
        arm_right_contracted: armRightContracted,
        arm_left_contracted: armLeftContracted,
        forearm,
        waist,
        abdomen,
        hips,
        thigh_proximal: thighProximal,
        thigh_distal: thighDistal,
        calf,
        skinfold_chest: skinfoldChest,
        skinfold_abdominal: skinfoldAbdominal,
        skinfold_thigh: skinfoldThigh,
        skinfold_triceps: skinfoldTriceps,
        skinfold_suprailiac: skinfoldSuprailiac,
        skinfold_subscapular: skinfoldSubscapular,
        skinfold_midaxillary: skinfoldMidaxillary,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: string, onChange: (text: string) => void, placeholder: string, keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default') => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: '#8B92A8', fontSize: 14, marginBottom: 8 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#5A6178"
        keyboardType={keyboardType}
        style={{
          backgroundColor: '#0A0E1A',
          borderRadius: 12,
          padding: 16,
          color: '#FFFFFF',
          fontSize: 16,
          borderWidth: 1,
          borderColor: '#1E2A42'
        }}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#141B2D', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#1E2A42' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>Editar Aluno</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {student?.id && (
                <Link href={`/students/${student.id}/history` as any} asChild>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons name="time-outline" size={24} color="#00D9FF" />
                  </TouchableOpacity>
                </Link>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#8B92A8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 24, marginTop: 16 }}>
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

          <ScrollView contentContainerStyle={{ padding: 24 }}>
            {activeTab === 'personal' && (
              <View>
                {renderInput('Nome Completo', name, setName, 'Ex: João Silva')}
                {renderInput('Telefone', phone, setPhone, 'Ex: (11) 99999-9999', 'phone-pad')}
                {renderInput('Peso (kg)', weight, setWeight, 'Ex: 75.5', 'numeric')}
                {renderInput('Altura (cm)', height, setHeight, 'Ex: 175', 'numeric')}
                
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#8B92A8', fontSize: 14, marginBottom: 8 }}>
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
                      backgroundColor: '#0A0E1A',
                      borderRadius: 12,
                      padding: 16,
                      color: '#FFFFFF',
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#1E2A42',
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

            <TouchableOpacity onPress={handleSave} disabled={loading} style={{ marginTop: 24, marginBottom: 40 }}>
              <LinearGradient
                colors={['#00FF88', '#00CC6E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#0A0E1A', fontSize: 16, fontWeight: '700' }}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
