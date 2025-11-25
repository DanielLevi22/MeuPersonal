import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Share, Text, TouchableOpacity, View } from 'react-native';

export default function InviteStudentScreen() {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const { generateInviteCode } = useStudentStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const handleGenerateCode = async (force = false) => {
    if (!user?.id) return;
    const code = await generateInviteCode(user.id, force);
    setInviteCode(code);
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Olá! 💪\n\nUse o código ${inviteCode} para se cadastrar no MeuPersonal e acessar seus treinos personalizados!\n\nBaixe o app e comece sua transformação hoje!`,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  };

  return (
    <ScreenLayout>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-surface p-2.5 rounded-xl mr-4 border border-border"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground font-display">
          Convidar Aluno
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center px-6">
        <Card className="p-8 items-center border-2 border-border">
          {/* Icon */}
          <LinearGradient
            colors={['rgba(204, 255, 0, 0.2)', 'rgba(204, 255, 0, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-5 rounded-full mb-6"
          >
            <Ionicons name="qr-code-outline" size={64} color="#CCFF00" />
          </LinearGradient>
          
          <Text className="text-foreground text-2xl font-bold mb-2 text-center font-display">
            Gerar Código de Convite
          </Text>
          <Text className="text-muted-foreground text-base text-center mb-8 px-4 font-sans">
            Envie este código para seu aluno se cadastrar e vincular ao seu perfil.
          </Text>

          {inviteCode ? (
            <View className="w-full items-center">
              {/* Code Display */}
              <View className="bg-background px-6 py-5 rounded-2xl mb-6 border-2 border-dashed border-primary w-full items-center">
                <Text className="text-4xl font-bold text-primary tracking-widest font-mono">
                  {inviteCode}
                </Text>
              </View>
              
              {/* Share Button */}
              <Button
                onPress={handleShare}
                className="w-full mb-3"
                variant="primary"
                label="Compartilhar Código"
                icon={<Ionicons name="share-social" size={20} color="#000000" />}
              />

              {/* Generate New Button */}
              <TouchableOpacity 
                onPress={() => handleGenerateCode(true)}
                className="w-full border-2 border-primary rounded-2xl py-3.5 items-center"
              >
                <Text className="text-primary text-base font-bold font-display">
                  Gerar Novo Código
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              onPress={() => handleGenerateCode(false)}
              className="w-full"
              variant="primary"
              label="Gerar Código"
              icon={<Ionicons name="add-circle" size={22} color="#000000" />}
            />
          )}
        </Card>

        {/* Info Card */}
        <View className="bg-secondary/10 p-4 rounded-2xl mt-6 border border-secondary/30 flex-row items-start">
          <Ionicons name="information-circle" size={24} color="#00D9FF" style={{ marginRight: 12, marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-secondary text-sm font-bold mb-1 font-display">
              Como funciona?
            </Text>
            <Text className="text-muted-foreground text-xs leading-5 font-sans">
              O aluno deve usar este código durante o cadastro para se vincular automaticamente ao seu perfil de Personal Trainer.
            </Text>
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
}
