'use client';

import { supabase } from '@meupersonal/supabase';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserDetails {
  id: string;
  email: string;
  full_name: string | null;
  account_type: string;
  created_at: string;
  last_login_at: string | null;
  is_super_admin: boolean;
  admin_notes: string | null;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  async function loadUser() {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser(data);
      setEditedNotes(data.admin_notes || '');
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveNotes() {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ admin_notes: editedNotes })
        .eq('id', userId);

      if (error) throw error;

      setUser((prev) => prev ? { ...prev, admin_notes: editedNotes } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Falha ao salvar notas');
    }
  }

  async function changeAccountType(newType: string) {
    if (!confirm(`Mudar tipo de conta para ${newType}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_type: newType })
        .eq('id', userId);

      if (error) throw error;

      setUser((prev) => prev ? { ...prev, account_type: newType } : null);
      alert('Tipo de conta atualizado com sucesso');
    } catch (error) {
      console.error('Error updating account type:', error);
      alert('Falha ao atualizar tipo de conta');
    }
  }

  const getAccountTypeBadge = (accountType: string, isSuperAdmin: boolean) => {
    const badges = {
      admin: { label: isSuperAdmin ? 'Super Admin' : 'Admin', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
      professional: { label: 'Profissional', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
      managed_student: { label: 'Aluno (Gerenciado)', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
      autonomous_student: { label: 'Aluno (Autônomo)', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
    };

    const badge = badges[accountType as keyof typeof badges] || { label: accountType, color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' };

    return (
      <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando usuário...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground mb-2">Usuário não encontrado</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="text-primary hover:text-primary/80"
          >
            ← Voltar para usuários
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/users')}
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
        >
          ← Voltar para usuários
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {user.full_name || 'Sem nome'}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          {getAccountTypeBadge(user.account_type, user.is_super_admin)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID do Usuário</label>
                <p className="text-foreground font-mono text-sm mt-1">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                <p className="text-foreground mt-1">{user.full_name || 'Não definido'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Conta</label>
                <div className="mt-2">
                  {getAccountTypeBadge(user.account_type, user.is_super_admin)}
                </div>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Atividade</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                <p className="text-foreground mt-1">
                  {new Date(user.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Último Login</label>
                <p className="text-foreground mt-1">
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Nunca'}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Notas do Admin</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Editar
                </button>
              )}
            </div>
            {isEditing ? (
              <div>
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Adicionar notas internas sobre este usuário..."
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={saveNotes}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setEditedNotes(user.admin_notes || '');
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {user.admin_notes || 'Nenhuma nota ainda'}
              </p>
            )}
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Change Account Type */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Mudar Tipo de Conta</h3>
            <div className="space-y-2">
              {['admin', 'professional', 'managed_student', 'autonomous_student'].map((type) => (
                <button
                  key={type}
                  onClick={() => changeAccountType(type)}
                  disabled={user.account_type === type}
                  className={`w-full px-4 py-2 rounded-lg font-medium text-left transition-colors ${
                    user.account_type === type
                      ? 'bg-primary/20 text-primary cursor-not-allowed'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          {!user.is_super_admin && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4">Zona de Perigo</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.')) {
                      // TODO: Implement delete
                      alert('Funcionalidade de deletar em breve');
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-medium"
                >
                  Deletar Usuário
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
