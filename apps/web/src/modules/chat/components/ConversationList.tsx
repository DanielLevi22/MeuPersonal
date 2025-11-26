'use client';

import { useAuth } from '@/modules/auth';
import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId: string | null;
}

export function ConversationList({ onSelectConversation, selectedConversationId }: ConversationListProps) {
  const { user, accountType } = useAuth();
  const { students, conversations, isLoading, fetchStudents, fetchConversations, getOrCreateConversation } = useChatStore();

  useEffect(() => {
    if (user?.id) {
      if (accountType === 'professional') {
        fetchStudents(user.id);
      }
      fetchConversations(user.id);
    }
  }, [user?.id, accountType, fetchStudents, fetchConversations]);

  const handleSelectStudent = async (studentId: string) => {
    if (!user?.id) return;
    
    try {
      const conversationId = await getOrCreateConversation(user.id, studentId);
      onSelectConversation(conversationId);
    } catch (error) {
      console.error('Error selecting student:', error);
    }
  };

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

  // Merge students with conversations
  const conversationMap = new Map(conversations.map(c => [c.student_id || c.personal_id, c]));
  
  const studentsList = students.map(student => {
    const conversation = conversationMap.get(student.id);
    return {
      id: student.id,
      name: student.full_name,
      email: student.email,
      conversationId: conversation?.id,
      lastMessage: conversation?.last_message?.content,
      lastMessageAt: conversation?.last_message_at,
      unreadCount: conversation?.unread_count || 0,
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (studentsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-4 border border-white/10">
          <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum aluno</h3>
        <p className="text-sm text-muted-foreground text-center">
          Adicione alunos para começar a conversar
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-surface to-surface-highlight">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-foreground">Conversas</h2>
          <div className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <span className="text-xs font-bold text-primary">{studentsList.length}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {studentsList.length} {studentsList.length === 1 ? 'aluno' : 'alunos'}
        </p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar aluno..."
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {studentsList.map((student, index) => (
          <button
            key={student.id}
            onClick={() => handleSelectStudent(student.id)}
            className={`w-full p-4 border-b border-white/5 hover:bg-white/5 transition-all text-left group ${
              selectedConversationId === student.conversationId ? 'bg-primary/5 border-l-4 border-l-primary' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar with gradient ring */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-full blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center">
                  <span className="text-primary text-lg font-bold">
                    {student.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                {student.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary border-2 border-surface rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-black">
                      {student.unreadCount > 9 ? '9+' : student.unreadCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-foreground font-semibold truncate group-hover:text-primary transition-colors">
                    {student.name || 'Aluno'}
                  </span>
                  {student.lastMessageAt && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatTime(student.lastMessageAt)}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground truncate">
                  {student.lastMessage || (
                    <span className="italic opacity-60">Clique para iniciar conversa</span>
                  )}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
