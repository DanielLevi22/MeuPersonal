'use client';

import { useAuth } from '@/modules/auth';
import type { ChatMessage } from '@meupersonal/supabase';
import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/chatStore';

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { user } = useAuth();
  const { conversations, messages, fetchMessages, sendMessage, markAsRead, subscribeToConversation } = useChatStore();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find(c => c.id === conversationId);
  const conversationMessages = messages[conversationId] || [];
  const receiverId = conversation?.personal_id === user?.id 
    ? conversation?.student_id 
    : conversation?.personal_id;

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      const unsubscribe = subscribeToConversation(conversationId);
      return unsubscribe;
    }
  }, [conversationId, fetchMessages, subscribeToConversation]);

  // Mark messages as read
  useEffect(() => {
    conversationMessages
      .filter(msg => msg.receiver_id === user?.id && !msg.read_at)
      .forEach(msg => markAsRead(msg.id));
  }, [conversationMessages, user?.id, markAsRead]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !receiverId || sending) return;

    setSending(true);
    try {
      await sendMessage(conversationId, receiverId, messageText.trim());
      setMessageText('');
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

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Selecione uma conversa</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b border-white/10 bg-gradient-to-r from-surface to-surface-highlight">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-full blur-sm opacity-50" />
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center">
            <span className="text-primary text-lg font-bold">
              {conversation.other_user?.full_name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground">
            {conversation.other_user?.full_name || 'Usuário'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {conversation.other_user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-background/50 to-background">
        {conversationMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 border border-white/10">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-muted-foreground text-center">
              Nenhuma mensagem ainda.<br />
              <span className="text-sm">Envie a primeira mensagem!</span>
            </p>
          </div>
        ) : (
          <>
            {conversationMessages.map((message: ChatMessage, index: number) => {
              const isMe = message.sender_id === user?.id;
              const showTime = index === 0 || 
                new Date(message.created_at).getTime() - new Date(conversationMessages[index - 1].created_at).getTime() > 60000;
              
              return (
                <div key={message.id}>
                  {showTime && (
                    <div className="flex justify-center mb-4">
                      <span className="text-xs text-muted-foreground bg-surface px-3 py-1 rounded-full border border-white/10">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-lg ${
                        isMe 
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-black rounded-br-sm' 
                          : 'bg-surface border border-white/10 rounded-bl-sm'
                      }`}
                    >
                      <p className={`text-sm leading-relaxed ${isMe ? 'text-black' : 'text-foreground'}`}>
                        {message.content}
                      </p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-xs ${isMe ? 'text-black/60' : 'text-muted-foreground'}`}>
                          {new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <svg className={`w-3 h-3 ${message.read_at ? 'text-black' : 'text-black/40'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-5 border-t border-white/10 bg-surface">
        <div className="flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-background border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            disabled={sending}
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all disabled:hover:shadow-none"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {messageText.length}/1000 caracteres
        </p>
      </form>
    </div>
  );
}
