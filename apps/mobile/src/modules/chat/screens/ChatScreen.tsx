import { useAuthStore } from '@/modules/auth';
import { Ionicons } from '@expo/vector-icons';
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
        <View 
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            isMe 
              ? 'bg-primary rounded-br-sm' 
              : 'bg-surface border border-border rounded-bl-sm'
          }`}
        >
          <Text className={`text-base font-sans ${isMe ? 'text-black' : 'text-foreground'}`}>
            {item.content}
          </Text>
          <Text className={`text-xs mt-1 font-sans ${isMe ? 'text-black/60' : 'text-muted-foreground'}`}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (!conversation) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#CCFF00" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-surface p-2.5 rounded-xl mr-3 border border-border"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
            <Text className="text-primary text-base font-bold font-display">
              {conversation.other_user?.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-foreground text-lg font-bold font-display">
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
        <View className="flex-row items-center px-4 py-3 border-t border-border bg-surface">
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#71717A"
            className="flex-1 bg-background border border-border rounded-2xl px-4 py-3 text-foreground font-sans mr-2"
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              messageText.trim() && !sending ? 'bg-primary' : 'bg-surface border border-border'
            }`}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons 
                name="send" 
                size={20} 
                color={messageText.trim() ? '#000' : '#71717A'} 
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
