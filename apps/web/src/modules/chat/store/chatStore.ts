import type { ChatMessage, ConversationWithDetails } from '@meupersonal/supabase';
import { supabase } from '@meupersonal/supabase';
import { create } from 'zustand';

interface ChatState {
  conversations: ConversationWithDetails[];
  messages: Record<string, ChatMessage[]>;
  currentConversationId: string | null;
  isLoading: boolean;
  students: Array<{ id: string; full_name: string; email: string }>; // All students
  
  fetchConversations: (userId: string) => Promise<void>;
  fetchStudents: (userId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, receiverId: string, content: string) => Promise<void>;
  getOrCreateConversation: (personalId: string, studentId: string) => Promise<string>;
  markAsRead: (messageId: string) => Promise<void>;
  setCurrentConversation: (conversationId: string | null) => void;
  subscribeToConversation: (conversationId: string) => () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  currentConversationId: null,
  isLoading: false,
  students: [],

  fetchStudents: async (userId: string) => {
    try {
      // Fetch all students linked to this professional
      const { data: relationships, error } = await supabase
        .from('coachings')
        .select(`
          client_id,
          client:profiles!coachings_client_id_fkey(id, full_name, email)
        `)
        .eq('professional_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      const students = relationships?.map((rel: any) => rel.client).filter(Boolean) || [];
      set({ students: students as any });
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  },

  getOrCreateConversation: async (personalId: string, studentId: string) => {
    try {
      // Check if conversation already exists
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('personal_id', personalId)
        .eq('student_id', studentId)
        .single();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          personal_id: personalId,
          student_id: studentId,
        })
        .select('id')
        .single();

      if (createError) throw createError;

      // Refresh conversations list
      await get().fetchConversations(personalId);

      return newConv.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  fetchConversations: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          personal:profiles!conversations_personal_id_fkey(id, full_name, email),
          student:profiles!conversations_student_id_fkey(id, full_name, email)
        `)
        .or(`personal_id.eq.${userId},student_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const { data: unreadCounts } = await supabase
        .rpc('get_unread_count', { user_id: userId });

      const conversationsWithUnread = conversations?.map(conv => {
        const otherUser = conv.personal_id === userId ? conv.student : conv.personal;
        const unreadCount = unreadCounts?.find((u: any) => u.conversation_id === conv.id)?.unread_count || 0;
        
        return {
          ...conv,
          other_user: otherUser,
          unread_count: Number(unreadCount),
        };
      }) || [];

      set({ conversations: conversationsWithUnread, isLoading: false });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      set({ isLoading: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: messages || [],
        },
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  },

  sendMessage: async (conversationId: string, receiverId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          message_type: 'text',
        })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || []), message],
        },
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  markAsRead: async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  },

  setCurrentConversation: (conversationId: string | null) => {
    set({ currentConversationId: conversationId });
  },

  subscribeToConversation: (conversationId: string) => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          set(state => ({
            messages: {
              ...state.messages,
              [conversationId]: [...(state.messages[conversationId] || []), newMessage],
            },
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  reset: () => {
    set({
      conversations: [],
      messages: {},
      currentConversationId: null,
      isLoading: false,
    });
  },
}));
