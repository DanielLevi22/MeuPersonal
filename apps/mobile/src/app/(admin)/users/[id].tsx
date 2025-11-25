import { AccountTypeBadge } from '@/components/admin/AccountTypeBadge';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import type { AccountType } from '@meupersonal/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserDetails {
  id: string;
  email: string;
  full_name: string;
  account_type: AccountType;
  is_super_admin?: boolean;
  subscription_tier?: string;
  subscription_status?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export default function UserDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  async function loadUser() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setUser(data);
      setAdminNotes(data.admin_notes || '');
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('Error', 'Failed to load user details');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveAdminNotes() {
    if (!user) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ admin_notes: adminNotes })
        .eq('id', user.id);

      if (error) throw error;
      Alert.alert('Success', 'Admin notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  }

  async function changeAccountType(newType: AccountType) {
    if (!user) return;

    Alert.alert(
      'Change Account Type',
      `Change ${user.email} to ${newType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ account_type: newType })
                .eq('id', user.id);

              if (error) throw error;
              Alert.alert('Success', 'Account type changed');
              loadUser();
            } catch (error) {
              console.error('Error changing account type:', error);
              Alert.alert('Error', 'Failed to change account type');
            }
          },
        },
      ]
    );
  }

  async function deleteUser() {
    if (!user) return;

    if (user.is_super_admin) {
      Alert.alert('Error', 'Cannot delete super admin');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.email}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

              if (error) throw error;
              Alert.alert('Success', 'User deleted');
              router.back();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-white mt-4">Loading user...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Ionicons name="person-outline" size={64} color="#4B5563" />
        <Text className="text-white mt-4">User not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6">
        {/* User Info Card */}
        <View className="bg-surface border border-white/10 rounded-2xl p-6 mt-6 mb-4">
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-purple-500/20 items-center justify-center mb-4">
              <Ionicons name="person" size={40} color="#8B5CF6" />
            </View>
            <Text className="text-white text-2xl font-bold mb-2">
              {user.full_name || 'No name'}
            </Text>
            <Text className="text-muted mb-3">{user.email}</Text>
            <AccountTypeBadge 
              accountType={user.account_type} 
              isSuperAdmin={user.is_super_admin}
              size="md"
            />
          </View>

          <View className="space-y-3">
            <View className="flex-row items-center py-2 border-b border-white/5">
              <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
              <Text className="text-muted text-sm ml-2 flex-1">Created</Text>
              <Text className="text-white text-sm">
                {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>

            {user.last_login_at && (
              <View className="flex-row items-center py-2 border-b border-white/5">
                <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                <Text className="text-muted text-sm ml-2 flex-1">Last Login</Text>
                <Text className="text-white text-sm">
                  {new Date(user.last_login_at).toLocaleDateString()}
                </Text>
              </View>
            )}

            {user.subscription_tier && (
              <View className="flex-row items-center py-2">
                <Ionicons name="card-outline" size={16} color="#9CA3AF" />
                <Text className="text-muted text-sm ml-2 flex-1">Subscription</Text>
                <Text className="text-purple-400 text-sm font-semibold">
                  {user.subscription_tier}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Admin Notes */}
        <View className="bg-surface border border-white/10 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Admin Notes</Text>
          <TextInput
            value={adminNotes}
            onChangeText={setAdminNotes}
            placeholder="Add internal notes about this user..."
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={4}
            className="bg-background border border-white/10 rounded-xl p-3 text-white mb-3"
            textAlignVertical="top"
          />
          <TouchableOpacity
            onPress={saveAdminNotes}
            disabled={isSaving}
            className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-3 items-center"
          >
            <Text className="text-purple-400 font-semibold">
              {isSaving ? 'Saving...' : 'Save Notes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Admin Actions */}
        <View className="bg-surface border border-white/10 rounded-2xl p-4 mb-8">
          <Text className="text-white font-semibold mb-4">Admin Actions</Text>

          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Change Account Type',
                'Select new account type:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Admin', onPress: () => changeAccountType('admin') },
                  { text: 'Professional', onPress: () => changeAccountType('professional') },
                  { text: 'Managed Student', onPress: () => changeAccountType('managed_student') },
                  { text: 'Autonomous Student', onPress: () => changeAccountType('autonomous_student') },
                ]
              );
            }}
            className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 mb-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Ionicons name="swap-horizontal" size={20} color="#60A5FA" />
              <Text className="text-blue-400 font-semibold ml-3">Change Account Type</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#60A5FA" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={deleteUser}
            disabled={user.is_super_admin}
            className={`rounded-xl p-4 flex-row items-center justify-between ${
              user.is_super_admin
                ? 'bg-gray-500/10 border border-gray-500/30'
                : 'bg-red-500/20 border border-red-500/50'
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name="trash-outline" 
                size={20} 
                color={user.is_super_admin ? '#6B7280' : '#EF4444'} 
              />
              <Text className={`font-semibold ml-3 ${
                user.is_super_admin ? 'text-gray-400' : 'text-red-400'
              }`}>
                Delete User
              </Text>
            </View>
            {user.is_super_admin && (
              <Text className="text-gray-400 text-xs">Protected</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
