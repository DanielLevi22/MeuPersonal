import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { StatusModal, StatusModalType } from '@/components/ui/StatusModal';
import { colors } from '@/constants/colors';
import { PlanProposal, PlanProposalCard } from '@/modules/ai/components/PlanProposalCard';
import { AiToolRegistry } from '@/modules/ai/services/AiToolRegistry';
import { AssistantService } from '@/modules/ai/services/AssistantService';
import { GENERAL_ANAMNESIS } from '@/modules/assessment/data/anamnesisQuestions';
import { AnamnesisService } from '@/modules/assessment/services/anamnesisService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
}

export default function AIChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  // Robust ID retrieval: handle both [id] dynamic route and query param
  const rawId = params.id || params.studentId;
  const studentId = (Array.isArray(rawId) ? rawId[0] : rawId) as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [studentContext, setStudentContext] = useState<string>('');
  const [pageLoading, setPageLoading] = useState(true);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: StatusModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const flatListRef = useRef<FlatList>(null);
  const messagesRef = useRef<Message[]>([]);

  const showModal = (type: StatusModalType, title: string, message: string) => {
    setModalConfig({ visible: true, type, title, message });
  };

  const hideModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  // Hide Tab Bar
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' },
    });
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: undefined, // Reset on leave
      });
    };
  }, [navigation]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadStudentData is stable — avoids useCallback refactor
  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    if (!studentId) {
      setPageLoading(false);
      return;
    }

    try {
      setPageLoading(true);

      // Promise.all for parallel fetching
      const [profileResponse, anamnesis] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', studentId).single(),
        AnamnesisService.getAnamnesis(studentId),
      ]);

      const profile = profileResponse.data;

      // Format Context - FULL ANAMNESIS
      let context = `DADOS GERAIS:\nNome: ${profile?.full_name || 'Aluno'}\nEmail: ${profile?.email}\n`;

      if (anamnesis?.responses) {
        context += `\nRESPOSTAS DA ANAMNESE:\n`;

        // Iterate through structured questions to provide clean context
        GENERAL_ANAMNESIS.forEach((section) => {
          const sectionAnswers: string[] = [];

          section.questions.forEach((q) => {
            const response = anamnesis.responses[q.id];
            if (response && response.value !== undefined && response.value !== '') {
              let val = response.value;
              if (Array.isArray(val)) val = val.join(', ');
              if (typeof val === 'boolean') val = val ? 'Sim' : 'Não';
              sectionAnswers.push(`- ${q.text}: ${val}`);
            }
          });

          if (sectionAnswers.length > 0) {
            context += `\n[${section.title}]\n${sectionAnswers.join('\n')}\n`;
          }
        });
      } else {
        context += '\n⚠️ Anamnese não preenchida pelo aluno.\n';
      }

      console.log('AI Context Loaded. Size:', context.length);
      setStudentContext(context);

      // Initial Greeting
      if (messages.length === 0) {
        setMessages([
          {
            id: '1',
            role: 'model',
            text: `Olá! Analisei o perfil completo de ${profile?.full_name?.split(' ')[0] || 'Aluno'}. Estou com todos os dados da anamnese (lesões, rotina, dieta...). Como posso ajudar?`,
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading student context:', error);
      setMessages([
        { id: 'err', role: 'model', text: 'Erro ao carregar dados do aluno. Tente reabrir.' },
      ]);
    } finally {
      setPageLoading(false);
    }
  };

  // Keep ref in sync with state for closures
  const updateMessages = (updater: React.SetStateAction<Message[]>) => {
    setMessages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      messagesRef.current = next;
      return next;
    });
  };

  const triggerStage2 = async (periodizationId: string) => {
    const approvalMsg: Message = {
      id: (Date.now() + 10).toString(),
      role: 'user',
      text: `[PERIODIZAÇÃO APROVADA] ID: ${periodizationId}. A periodização e as fases foram criadas com sucesso. Agora prossiga para o Estágio 2: pergunte ao professor sobre a divisão de treino e os exercícios.`,
    };

    const stage2MsgId = (Date.now() + 11).toString();

    updateMessages((prev) => [
      ...prev,
      approvalMsg,
      { id: stage2MsgId, role: 'model' as const, text: '' },
    ]);
    setIsLoading(true);

    try {
      // Build history from the ref (always fresh)
      const currentMessages = messagesRef.current;
      const history = currentMessages
        .filter(
          (m) =>
            m.text &&
            !m.text.startsWith('[SISTEMA]:') &&
            !m.text.startsWith('[PERIODIZAÇÃO APROVADA]')
        )
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text ?? '' }],
        }));
      history.push({ role: 'user', parts: [{ text: approvalMsg.text ?? '' }] });

      const res = await AssistantService.streamChatWithStudentContext(
        history,
        studentContext,
        (chunk) => {
          updateMessages((prev) =>
            prev.map((m) => (m.id === stage2MsgId ? { ...m, text: (m.text || '') + chunk } : m))
          );
        }
      );

      if (res.type === 'function_call' && res.functionCall) {
        updateMessages((prev) =>
          prev.map((m) =>
            m.id === stage2MsgId
              ? { ...m, text: undefined, functionCall: res.functionCall as never }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Stage 2 trigger error:', error);
      updateMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 12).toString(),
          role: 'model',
          text: 'Ótimo, periodização criada! Agora me diga: qual divisão de treino você prefere? (ex: ABC, ABCD, Upper/Lower)',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || pageLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputText };
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsgPlaceholder: Message = { id: aiMsgId, role: 'model', text: '' };

    setMessages((prev) => [...prev, userMsg, aiMsgPlaceholder]);
    setInputText('');
    setIsLoading(true);

    try {
      // Prepare history for API
      const history = messages
        .filter((m) => m.text) // Only text messages for now
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text ?? '' }],
        }));

      // Append current user message
      history.push({ role: 'user', parts: [{ text: userMsg.text ?? '' }] });

      const response = await AssistantService.streamChatWithStudentContext(
        history,
        studentContext,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, text: (m.text || '') + chunk } : m))
          );
        }
      );

      if (response.type === 'function_call') {
        const functionCall = response.functionCall as {
          name: string;
          args: Record<string, unknown>;
        };
        const toolName = functionCall.name;

        // Convert the placeholder to a function call message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, text: undefined, functionCall: functionCall as never } : m
          )
        );

        // Let the registry handle the tool execution
        const toolResult = await AiToolRegistry.executeTool(toolName, functionCall.args || {});

        if (toolResult.nextSystemMessage) {
          const systemContextMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'user',
            text: toolResult.nextSystemMessage,
          };

          setMessages((prev) => [...prev, systemContextMsg]);

          const nextAiMsgId = (Date.now() + 3).toString();
          setMessages((prev) => [...prev, { id: nextAiMsgId, role: 'model', text: '' }]);

          // Trigger another AI pass immediately to answer the user now that it has the info
          setIsLoading(true);
          const nextHistory = [
            ...history,
            // biome-ignore lint/suspicious/noExplicitAny: function call structure for Gemini API
            { role: 'model', parts: [{ functionCall: response.functionCall as any }] } as any,
            { role: 'user', parts: [{ text: systemContextMsg.text ?? '' }] },
          ];

          const secondResponse = await AssistantService.streamChatWithStudentContext(
            nextHistory,
            studentContext,
            (chunk) => {
              setMessages((prev) =>
                prev.map((m) => (m.id === nextAiMsgId ? { ...m, text: (m.text || '') + chunk } : m))
              );
            }
          );

          if (secondResponse.type === 'function_call') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === nextAiMsgId
                  ? { ...m, text: undefined, functionCall: secondResponse.functionCall as never }
                  : m
              )
            );
          }
          setIsLoading(false);
          return;
        }

        // If renderComponent is true, the card will automatically render based on the tool name in the UI
        setIsLoading(false);
      } else {
        // Text stream already saved incrementally, just stop loading
        setIsLoading(false);
      }
    } catch (_error) {
      setMessages((prev) => [
        ...prev,
        { id: 'err', role: 'model', text: 'Desculpe, tive um erro ao processar. Tente novamente.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    if (
      item.functionCall &&
      (item.functionCall.name === 'query_exercises' ||
        item.functionCall.name === 'generate_workouts')
    ) {
      // Don't render internal tool calls to the user
      return null;
    }

    if (
      item.text &&
      (item.text.startsWith('[SISTEMA]:') || item.text.startsWith('[PERIODIZAÇÃO APROVADA]'))
    ) {
      // Don't render system messages back to tool calls
      return null;
    }

    // If it's a Tool Call (Plan Proposal)
    if (item.functionCall && item.functionCall.name === 'propose_periodization') {
      return (
        <View style={{ alignSelf: 'flex-start', width: '90%' }}>
          <PlanProposalCard
            proposal={item.functionCall.args as unknown as PlanProposal}
            studentId={studentId}
            onApproved={(periodizationId: string) => {
              triggerStage2(periodizationId);
            }}
            onError={(msg) => showModal('error', 'Ops!', msg)}
          />
        </View>
      );
    }

    // Don't render empty AI message bubbles (streaming placeholder before first token)
    if (item.role === 'model' && (!item.text || item.text.trim() === '')) {
      return null;
    }

    // Normal Text Message
    return (
      <View
        style={{
          alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
          backgroundColor: item.role === 'user' ? colors.primary.solid : '#27272A',
          maxWidth: '85%',
          padding: 12,
          borderRadius: 16,
          borderBottomRightRadius: item.role === 'user' ? 4 : 16,
          borderBottomLeftRadius: item.role === 'model' ? 4 : 16,
        }}
      >
        <Text className="text-white text-base leading-6">{item.text}</Text>
      </View>
    );
  };

  if (pageLoading) {
    return (
      <ScreenLayout className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary.solid} />
        <Text className="text-zinc-500 mt-4">Carregando dados do aluno...</Text>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-white/10 flex-row items-center justify-between bg-zinc-900/50">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text className="text-white font-bold text-center">Assistente I.A.</Text>
            <Text className="text-zinc-500 text-xs text-center">Consultor de Prescrição</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Chat List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          extraData={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={renderMessageItem}
        />

        {/* Constructing... Indicator */}
        {isLoading && (
          <View className="ml-4 mb-2 flex-row items-center gap-2">
            <ActivityIndicator size="small" color={colors.primary.solid} />
            <Text className="text-zinc-500 text-xs">Digitando...</Text>
          </View>
        )}

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <View className="p-4 bg-zinc-900 border-t border-white/10 flex-row items-center gap-3">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Pergunte sobre o treino..."
              placeholderTextColor="#71717A"
              className="flex-1 bg-black text-white p-4 rounded-xl border border-zinc-800 max-h-32"
              multiline
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={isLoading || !inputText.trim()}
              className={`w-12 h-12 rounded-full items-center justify-center ${!inputText.trim() ? 'bg-zinc-800' : 'bg-orange-500'}`}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      <StatusModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={hideModal}
      />
    </ScreenLayout>
  );
}
