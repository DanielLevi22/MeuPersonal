import { useAuthStore } from '@/modules/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '../store/chatStore';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const conversationId = params.id as string;
  
  const { user } = useAuthStore();
  const { 
    conversations, 
    messages, 
    fetchMessages, 
    sendMessage, 
    subscribeToConversation,
    unsubscribeFromConversation,
    markAsRead 
  } = useChatStore();
  
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const conversation = conversations.find(c => c.id === conversationId);
  const conversationMessages = messages[conversationId] || [];
  const receiverId = conversation?.personal_id === user?.id 
    ? conversation?.student_id 
    : conversation?.personal_id;

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      const unsubscribe = subscribeToConversation(conversationId);
      
      return () => {
        unsubscribe();
        unsubscribeFromConversation(conversationId);
      };
    }
  }, [conversationId]);

  // Mark messages as read
  useEffect(() => {
    conversationMessages
      .filter(msg => msg.receiver_id === user?.id && !msg.read_at)
      .forEach(msg => markAsRead(msg.id));
  }, [conversationMessages, user?.id]);

  const handleSend = async () => {
    if (!messageText.trim() || !receiverId || sending) return;

    setSending(true);
    try {
      await sendMessage(conversationId, receiverId, messageText.trim());
      setMessageText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === user?.id;
    
    return (
      <View className={`mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
        {isMe ? (
          <LinearGradient
            colors={['#FF6B35', '#FF2E63']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3"
          >
            <Text className="text-base font-sans text-white">
              {item.content}
            </Text>
            <Text className="text-xs mt-1 font-sans text-white/70 text-right">
              {formatTime(item.created_at)}
            </Text>
          </LinearGradient>
        ) : (
          <View className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 bg-zinc-800 border border-zinc-700">
            <Text className="text-base font-sans text-white">
              {item.content}
            </Text>
            <Text className="text-xs mt-1 font-sans text-zinc-400">
              {formatTime(item.created_at)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!conversation) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0A] items-center justify-center">
        <ActivityIndicator size="large" color="#00D9FF" />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Header */}
          <View className="flex-row items-center px-4 py-3 border-b border-zinc-800 bg-[#0A0A0A]">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="bg-zinc-900 p-2.5 rounded-xl mr-3 border border-zinc-800"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View className="w-10 h-10 rounded-full bg-cyan-400/15 items-center justify-center mr-3 border border-cyan-400/20">
              <Text className="text-cyan-400 text-base font-bold font-display">
                {conversation.other_user?.full_name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            
            <View className="flex-1">
              <Text className="text-white text-lg font-bold font-display">
                {conversation.other_user?.full_name || 'Usuário'}
              </Text>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={conversationMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />

          {/* Input */}
          <View className="flex-row items-center px-4 py-3 border-t border-zinc-800 bg-zinc-900/50 pb-8">
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Digite uma mensagem..."
              placeholderTextColor="#71717A"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white font-sans mr-3"
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity
              onPress={handleSend}
              disabled={!messageText.trim() || sending}
              activeOpacity={0.8}
            >
              {messageText.trim() && !sending ? (
                <LinearGradient
                  colors={['#00D9FF', '#00B8D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-12 h-12 rounded-full items-center justify-center"
                >
                  <Ionicons name="send" size={20} color="#000" />
                </LinearGradient>
              ) : (
                <View className="w-12 h-12 rounded-full items-center justify-center bg-zinc-800 border border-zinc-700">
                  {sending ? (
                    <ActivityIndicator size="small" color="#71717A" />
                  ) : (
                    <Ionicons name="send" size={20} color="#71717A" />
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
