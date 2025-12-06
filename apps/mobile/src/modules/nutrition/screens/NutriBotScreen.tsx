import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useNutritionStore } from '@/modules/nutrition/routes';
import { ChatMessage, NutriBotService } from '@/modules/nutrition/services/NutriBotService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function NutriBotScreen() {
  const router = useRouter();
  const { currentDietPlan, meals } = useNutritionStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: '1',
        role: 'assistant',
        content: `Olá! Sou seu assistente nutricional. Posso tirar dúvidas sobre sua dieta "${currentDietPlan?.name || 'Atual'}". O que manda?`,
        createdAt: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input.trim(),
        createdAt: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        const responseText = await NutriBotService.sendMessage(
            messages, 
            userMsg.content, 
            currentDietPlan, 
            meals
        );

        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseText,
            createdAt: Date.now()
        };
        setMessages(prev => [...prev, aiMsg]);
        
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

    } catch (error) {
        // Error handled in service mostly
    } finally {
        setLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center border-b border-zinc-800 bg-zinc-950">
           <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#FFF" />
           </TouchableOpacity>
           <View>
               <Text className="text-xl font-bold text-white">NutriBot 🤖</Text>
               <Text className="text-zinc-500 text-xs">Assistente Nutricional</Text>
           </View>
        </View>

        {/* Chat List */}
        <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, gap: 16 }}
            renderItem={({ item }) => (
                <View className={`max-w-[80%] rounded-2xl p-4 ${
                    item.role === 'user' 
                        ? 'bg-orange-600 self-end rounded-tr-sm' 
                        : 'bg-zinc-800 self-start rounded-tl-sm'
                }`}>
                    <Text className="text-white text-base leading-6">{item.content}</Text>
                </View>
            )}
        />

        {/* Input Area */}
        <View className="p-4 bg-zinc-900 border-t border-zinc-800 flex-row items-center">
            <TextInput
                className="flex-1 bg-zinc-950 text-white rounded-full px-4 py-3 mr-3 border border-zinc-800"
                placeholder="Pergunte sobre sua dieta..."
                placeholderTextColor="#71717A"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
            />
            <TouchableOpacity 
                onPress={handleSend}
                disabled={loading || !input.trim()}
                className={`w-12 h-12 rounded-full items-center justify-center ${
                    !input.trim() ? 'bg-zinc-800' : 'bg-orange-500'
                }`}
            >
                {loading ? (
                    <ActivityIndicator color="white" size="small" />
                ) : (
                    <Ionicons name="send" size={20} color={!input.trim() ? '#52525B' : 'white'} />
                )}
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
