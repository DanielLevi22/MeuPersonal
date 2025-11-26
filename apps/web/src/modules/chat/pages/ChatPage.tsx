'use client';

import { useState } from 'react';
import { ChatWindow } from '../components/ChatWindow';
import { ConversationList } from '../components/ConversationList';

export default function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversationsOpen, setConversationsOpen] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
              Chat
            </h1>
            <p className="text-muted-foreground">
              Converse com seus alunos em tempo real
            </p>
          </div>
          
          {/* Toggle Conversations Button */}
          <button
            onClick={() => setConversationsOpen(!conversationsOpen)}
            className="p-3 bg-surface border border-white/10 rounded-xl hover:bg-surface-highlight transition-all shadow-lg"
            title={conversationsOpen ? 'Fechar conversas' : 'Abrir conversas'}
          >
            <svg 
              className={`w-5 h-5 text-foreground transition-transform ${conversationsOpen ? 'rotate-0' : 'rotate-180'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="h-[calc(100vh-16rem)] flex gap-6">
        {/* Conversations Sidebar (Left side) */}
        <div 
          className={`${
            conversationsOpen ? 'w-96' : 'w-0'
          } bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 flex-shrink-0 shadow-2xl shadow-primary/5`}
        >
          <ConversationList 
            onSelectConversation={setSelectedConversationId}
            selectedConversationId={selectedConversationId}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-primary/5">
          {selectedConversationId ? (
            <ChatWindow conversationId={selectedConversationId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                {/* Animated Icon */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-full blur-3xl animate-pulse" />
                  <div className="relative w-32 h-32 bg-gradient-to-br from-surface to-surface-highlight border border-white/10 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Selecione uma conversa
                </h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Escolha um aluno da lista para começar a conversar
                </p>
                
                {/* Feature Pills */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium">
                    ⚡ Tempo Real
                  </div>
                  <div className="px-3 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full text-xs text-secondary font-medium">
                    ✓ Confirmação de Leitura
                  </div>
                  <div className="px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-xs text-accent font-medium">
                    🔔 Notificações
                  </div>
                </div>

                {!conversationsOpen && (
                  <div className="mt-8">
                    <button
                      onClick={() => setConversationsOpen(true)}
                      className="px-6 py-3 bg-primary text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/50 transition-all"
                    >
                      Abrir Lista de Conversas
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
