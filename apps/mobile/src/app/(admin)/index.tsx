import { AccountTypeBadge } from '@/components/admin/AccountTypeBadge';
import { StatCard } from '@/components/admin/StatCard';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProfessionals: number;
  totalStudents: number;
  recentUsers: Array<{
    id: string;
    email: string;
    full_name: string;
    account_type: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setIsLoading(true);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', sevenDaysAgo.toISOString());

      // Get professionals count
      const { count: totalProfessionals } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_type', 'professional');

      // Get students count (both types)
      const { count: totalStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('account_type', ['managed_student', 'autonomous_student']);

      // Get recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, email, full_name, account_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalProfessionals: totalProfessionals || 0,
        totalStudents: totalStudents || 0,
        recentUsers: recentUsers || [],
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-white mt-4">Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6">
        {/* Welcome Section */}
        <View className="mt-6 mb-8">
          <Text className="text-white text-2xl font-bold mb-2">
            Welcome, Admin 👋
          </Text>
          <Text className="text-muted">
            {user?.email}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="mb-8">
          <Text className="text-white text-lg font-bold mb-4">Quick Stats</Text>
          
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon="people"
            color="purple"
          />

          <StatCard
            title="Active Users (7d)"
            value={stats?.activeUsers || 0}
            icon="pulse"
            color="green"
          />

          <StatCard
            title="Professionals"
            value={stats?.totalProfessionals || 0}
            icon="briefcase"
            color="orange"
          />

          <StatCard
            title="Students"
            value={stats?.totalStudents || 0}
            icon="school"
            color="blue"
          />
        </View>

        {/* Recent Activity */}
        <View className="mb-8">
          <Text className="text-white text-lg font-bold mb-4">Recent Users</Text>
          
          {stats?.recentUsers.map((user) => (
            <TouchableOpacity
              key={user.id}
              onPress={() => router.push(`/(admin)/users/${user.id}` as any)}
              className="bg-surface border border-white/10 rounded-xl p-4 mb-3"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white font-semibold flex-1">
                  {user.full_name || 'No name'}
                </Text>
                <AccountTypeBadge 
                  accountType={user.account_type as any} 
                  size="sm"
                />
              </View>
              <Text className="text-muted text-sm mb-1">{user.email}</Text>
              <Text className="text-muted text-xs">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text className="text-white text-lg font-bold mb-4">Quick Actions</Text>
          
          <TouchableOpacity
            onPress={() => router.push('/(admin)/users' as any)}
            className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4 mb-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-purple-500/30 items-center justify-center mr-3">
                <Ionicons name="people" size={20} color="#8B5CF6" />
              </View>
              <Text className="text-white font-semibold">View All Users</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => loadStats()}
            className="bg-surface border border-white/10 rounded-xl p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center mr-3">
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
              </View>
              <Text className="text-white font-semibold">Refresh Stats</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
