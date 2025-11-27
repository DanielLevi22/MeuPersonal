import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useAuthStore } from '@/modules/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useChatStore } from '../store/chatStore';

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { conversations, isLoading, fetchConversations } = useChatStore();

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchConversations(user.id);
      }
    }, [user?.id, fetchConversations])
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/chat/${item.id}` as any)}
      className="mb-3"
    >
      <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex-row items-center">
        {/* Avatar */}
        <View className="w-12 h-12 rounded-full bg-cyan-400/15 items-center justify-center mr-3 border border-cyan-400/20">
          <Text className="text-cyan-400 text-lg font-bold font-display">
            {item.other_user?.full_name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-white text-base font-bold font-display">
              {item.other_user?.full_name || 'Usuário'}
            </Text>
            <Text className="text-zinc-500 text-xs font-sans">
              {formatTime(item.last_message_at)}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between">
            <Text 
              className="text-zinc-400 text-sm font-sans flex-1 mr-2" 
              numberOfLines={1}
            >
              {item.last_message?.content || 'Sem mensagens'}
            </Text>
            
            {item.unread_count > 0 && (
              <LinearGradient
                colors={['#FF6B35', '#FF2E63']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-full w-6 h-6 items-center justify-center"
              >
                <Text className="text-white text-xs font-bold font-display">
                  {item.unread_count > 9 ? '9+' : item.unread_count}
                </Text>
              </LinearGradient>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
      {/* Header */}
      <View className="px-6 pt-4 pb-6">
        <Text className="text-3xl font-extrabold text-white mb-1 font-display">
          Conversas
        </Text>
        <Text className="text-base text-zinc-400 font-sans">
          {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'}
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00D9FF" />
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-zinc-900 p-8 rounded-full mb-6 border border-zinc-800">
            <Ionicons name="chatbubbles-outline" size={64} color="#52525B" />
          </View>
          <Text className="text-white text-2xl font-bold mb-2 text-center font-display">
            Nenhuma conversa
          </Text>
          <Text className="text-zinc-500 text-center px-8 text-base font-sans">
            Suas conversas com alunos e personal trainers aparecerão aqui
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenLayout>
  );
}
