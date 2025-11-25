import { AccountTypeBadge } from '@/components/admin/AccountTypeBadge';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface User {
  id: string;
  email: string;
  full_name: string;
  account_type: 'admin' | 'professional' | 'managed_student' | 'autonomous_student';
  is_super_admin?: boolean;
  subscription_tier?: string;
  created_at: string;
  last_login_at?: string;
}

export default function UsersListScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterType, users]);

  async function loadUsers() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, account_type, is_super_admin, subscription_tier, created_at, last_login_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function filterUsers() {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType) {
      filtered = filtered.filter(user => user.account_type === filterType);
    }

    setFilteredUsers(filtered);
  }

  const accountTypes = [
    { value: null, label: 'All' },
    { value: 'admin', label: 'Admins' },
    { value: 'professional', label: 'Professionals' },
    { value: 'managed_student', label: 'Managed' },
    { value: 'autonomous_student', label: 'Autonomous' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-white mt-4">Loading users...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-6">
        {/* Search Bar */}
        <View className="bg-surface border border-white/10 rounded-xl px-4 py-3 flex-row items-center mb-4">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or email..."
            placeholderTextColor="#6B7280"
            className="flex-1 ml-3 text-white"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {accountTypes.map((type) => (
            <TouchableOpacity
              key={type.label}
              onPress={() => setFilterType(type.value)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                filterType === type.value
                  ? 'bg-purple-500/20 border-purple-500/50'
                  : 'bg-surface border-white/10'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                filterType === type.value ? 'text-purple-400' : 'text-muted'
              }`}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results Count */}
        <Text className="text-muted text-sm mb-4">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Users List */}
      <ScrollView className="flex-1 px-6">
        {filteredUsers.map((user) => (
          <TouchableOpacity
            key={user.id}
            onPress={() => router.push(`/(admin)/users/${user.id}` as any)}
            className="bg-surface border border-white/10 rounded-xl p-4 mb-3"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1 mr-3">
                <Text className="text-white font-semibold text-base mb-1">
                  {user.full_name || 'No name'}
                </Text>
                <Text className="text-muted text-sm">{user.email}</Text>
              </View>
              <AccountTypeBadge 
                accountType={user.account_type} 
                isSuperAdmin={user.is_super_admin}
                size="sm"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                <Text className="text-muted text-xs ml-1">
                  {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </View>

              {user.last_login_at && (
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                  <Text className="text-muted text-xs ml-1">
                    Last login: {new Date(user.last_login_at).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            {user.subscription_tier && (
              <View className="mt-2 pt-2 border-t border-white/5">
                <Text className="text-muted text-xs">
                  Subscription: <Text className="text-purple-400 font-semibold">{user.subscription_tier}</Text>
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {filteredUsers.length === 0 && (
          <View className="items-center justify-center py-12">
            <Ionicons name="people-outline" size={64} color="#4B5563" />
            <Text className="text-muted text-center mt-4">
              No users found
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
