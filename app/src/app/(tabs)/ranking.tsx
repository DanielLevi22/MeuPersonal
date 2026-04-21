import { createGamificationService, type LeaderboardEntry } from '@elevapro/shared';
import { supabase } from '@elevapro/supabase'; // needed for gamificationService factory
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useAuthStore } from '@/auth';
import { Podium } from '@/components/gamification/Podium';
import { RankListItem } from '@/components/gamification/RankListItem';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { colors as brandColors } from '@/constants/colors';

const gamificationService = createGamificationService(supabase);

export default function LeaderboardScreen() {
  const { user, accountType } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterScope, setFilterScope] = useState<'global' | 'my_students'>(
    accountType === 'specialist' ? 'my_students' : 'global'
  );

  // Filter State
  const [filterPeriod, setFilterPeriod] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [customDate, setCustomDate] = useState(new Date());
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null);

  const viewShotRef = useRef<View>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);

      const { accountType: currentAccountType } = useAuthStore.getState();

      const today = new Date();
      let startDate: string;

      if (filterPeriod === 'weekly') {
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(today.setDate(diff)).toISOString().split('T')[0];
      } else if (filterPeriod === 'monthly') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      } else {
        startDate = customDate.toISOString().split('T')[0];
      }

      const scope =
        currentAccountType === 'specialist' && filterScope === 'my_students'
          ? 'my_students'
          : 'global';

      const data = await gamificationService.fetchLeaderboard(startDate, scope, user?.id);
      setEntries(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterPeriod, customDate, filterScope, user?.id]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const toggleFilter = (scope: 'global' | 'my_students') => {
    setFilterScope(scope);
  };

  const handleSharePodium = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 1,
        });
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error('Error sharing podium:', error);
    }
  };

  const handleStudentPress = (student: LeaderboardEntry) => {
    setSelectedStudent(student);
  };

  const handleContactStudent = () => {
    if (selectedStudent?.phone) {
      const number = selectedStudent.phone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/${number}`);
    }
  };

  const topThree = entries.slice(0, 3);
  const _rest = entries.slice(3); // Although rest is slices, we are showing ALL entries in the list now as per previous request

  const getFilterLabel = () => {
    if (filterPeriod === 'weekly') return 'Esta Semana';
    if (filterPeriod === 'monthly') return 'Este Mês';
    return `Desde ${customDate.toLocaleDateString('pt-BR')}`;
  };

  const onDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setCustomDate(selectedDate);
      setFilterPeriod('custom');
      setShowFilterModal(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color={brandColors.primary.start} />
      </View>
    );
  }

  return (
    <ScreenLayout>
      <View className="flex-1 pt-4">
        {/* Header with Gradient Text Effect */}
        <View className="px-6 pb-6 items-center z-10 relative">
          <Text className="text-4xl font-black text-white text-center font-display italic tracking-tighter shadow-xl shadow-brand-primary/20">
            RANKING DE ELITE 🏆
          </Text>

          {/* Period Label (Badge) */}
          <View className="mt-3 bg-zinc-900/90 border border-zinc-800 px-4 py-1.5 rounded-full">
            <Text className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
              {getFilterLabel()}
            </Text>
          </View>

          {/* Share & Filter Icons (Absolute Right) */}
          <View className="absolute right-6 top-2 flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-full"
            >
              <Ionicons name="filter" size={18} color={brandColors.primary.start} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSharePodium}
              className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-full"
            >
              <Ionicons name="share-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>

          {accountType === 'specialist' && (
            <View className="flex-row bg-black p-1.5 rounded-2xl border border-zinc-800 mt-6 min-w-[280px]">
              <TouchableOpacity
                onPress={() => toggleFilter('my_students')}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${filterScope === 'my_students' ? 'bg-zinc-800' : 'transparent'}`}
              >
                <Text
                  className={`text-xs font-black uppercase tracking-widest ${filterScope === 'my_students' ? 'text-white' : 'text-zinc-500'}`}
                >
                  Meus Alunos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleFilter('global')}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${filterScope === 'global' ? 'bg-zinc-800' : 'transparent'}`}
              >
                <Text
                  className={`text-xs font-black uppercase tracking-widest ${filterScope === 'global' ? 'text-white' : 'text-zinc-500'}`}
                >
                  Global
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <FlatList
          data={entries}
          keyExtractor={(item) => item.student_id}
          ListHeaderComponent={() => (
            <View collapsable={false} ref={viewShotRef} className="mb-6 px-4 pt-4 bg-black">
              {topThree.length > 0 ? (
                <View>
                  <Podium topThree={topThree} />
                  {/* Divider */}
                  <View className="h-[1px] bg-zinc-800 mx-6 mb-4 mt-4" />
                </View>
              ) : (
                <View className="h-48 justify-center items-center opacity-50">
                  <Ionicons name="trophy-outline" size={64} color={brandColors.text.muted} />
                  <Text className="text-zinc-500 mt-4 font-bold uppercase tracking-wider text-center">
                    {filterScope === 'my_students'
                      ? 'Sem pontuações neste período.'
                      : 'Seja o primeiro a pontuar!'}
                  </Text>
                </View>
              )}
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleStudentPress(item)}>
              <RankListItem item={item} isCurrentUser={item.student_id === user?.id} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={brandColors.primary.start}
            />
          }
          ListEmptyComponent={
            topThree.length === 0 ? null : (
              <View className="items-center mt-10 opacity-50">
                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                  A competição começou
                </Text>
              </View>
            )
          }
        />

        {/* Filter Modal */}
        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="flex-1 bg-black/80 justify-end"
            onPress={() => setShowFilterModal(false)}
          >
            <View className="bg-zinc-950 rounded-t-[32px] p-6 border-t border-zinc-800 shadow-2xl shadow-black">
              <View className="items-center mb-8">
                <View className="w-12 h-1.5 bg-zinc-800 rounded-full mb-6" />
                <Text className="text-white text-2xl font-black font-display italic tracking-tighter">
                  FILTRAR RANKING
                </Text>
                <Text className="text-zinc-500 font-medium">Escolha o período de visualização</Text>
              </View>

              <View className="gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setFilterPeriod('weekly');
                    setShowFilterModal(false);
                  }}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    filterPeriod === 'weekly'
                      ? 'bg-orange-500/10 border-orange-500'
                      : 'bg-zinc-900/50 border-zinc-800'
                  }`}
                >
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                      filterPeriod === 'weekly' ? 'bg-orange-500/20' : 'bg-zinc-800'
                    }`}
                  >
                    <Ionicons
                      name="calendar"
                      size={24}
                      color={filterPeriod === 'weekly' ? '#f97316' : '#71717a'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-bold ${filterPeriod === 'weekly' ? 'text-white' : 'text-zinc-300'}`}
                    >
                      Esta Semana
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-0.5">Segunda a Domingo</Text>
                  </View>
                  {filterPeriod === 'weekly' && (
                    <Ionicons name="checkmark-circle" size={24} color="#f97316" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setFilterPeriod('monthly');
                    setShowFilterModal(false);
                  }}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    filterPeriod === 'monthly'
                      ? 'bg-orange-500/10 border-orange-500'
                      : 'bg-zinc-900/50 border-zinc-800'
                  }`}
                >
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                      filterPeriod === 'monthly' ? 'bg-orange-500/20' : 'bg-zinc-800'
                    }`}
                  >
                    <Ionicons
                      name="calendar-number"
                      size={24}
                      color={filterPeriod === 'monthly' ? '#f97316' : '#71717a'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-bold ${filterPeriod === 'monthly' ? 'text-white' : 'text-zinc-300'}`}
                    >
                      Este Mês
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-0.5">Visão geral mensal</Text>
                  </View>
                  {filterPeriod === 'monthly' && (
                    <Ionicons name="checkmark-circle" size={24} color="#f97316" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowDatePicker(true);
                  }}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    filterPeriod === 'custom'
                      ? 'bg-orange-500/10 border-orange-500'
                      : 'bg-zinc-900/50 border-zinc-800'
                  }`}
                >
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                      filterPeriod === 'custom' ? 'bg-orange-500/20' : 'bg-zinc-800'
                    }`}
                  >
                    <Ionicons
                      name="options"
                      size={24}
                      color={filterPeriod === 'custom' ? '#f97316' : '#71717a'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-bold ${filterPeriod === 'custom' ? 'text-white' : 'text-zinc-300'}`}
                    >
                      Personalizado
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-0.5">
                      {filterPeriod === 'custom'
                        ? `Desde ${customDate.toLocaleDateString('pt-BR')}`
                        : 'Selecionar data de início'}
                    </Text>
                  </View>
                  {filterPeriod === 'custom' && (
                    <Ionicons name="checkmark-circle" size={24} color="#f97316" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity className="mt-6 py-5" onPress={() => setShowFilterModal(false)}>
                <Text className="text-zinc-500 font-bold text-center uppercase tracking-widest">
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={customDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Student Details Modal */}
        <Modal
          visible={selectedStudent !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedStudent(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="flex-1 bg-black/80 justify-center items-center p-6"
            onPress={() => setSelectedStudent(null)}
          >
            <View
              className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 items-center"
              onStartShouldSetResponder={() => true}
            >
              <View className="w-24 h-24 rounded-full border-4 border-yellow-500 mb-4 items-center justify-center bg-zinc-800">
                {selectedStudent?.avatar_url ? ( // Assuming Image usage or text fallback logic here same as others
                  <Text className="text-4xl">👑</Text> // Placeholder if no avatar, real implementation uses Image if available
                ) : (
                  <Text className="text-white text-3xl font-bold">
                    {selectedStudent?.name.charAt(0)}
                  </Text>
                )}
              </View>

              <Text className="text-white text-2xl font-black font-display text-center mb-1">
                {selectedStudent?.name}
              </Text>

              <View className="flex-row items-center gap-2 mb-6">
                <View className="bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  <Text className="text-yellow-500 font-bold uppercase tracking-widest text-xs">
                    Rank #{selectedStudent?.rank}
                  </Text>
                </View>
                <View className="bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                  <Text className="text-orange-500 font-bold uppercase tracking-widest text-xs">
                    {selectedStudent?.points} pts
                  </Text>
                </View>
              </View>

              {selectedStudent?.phone && (
                <TouchableOpacity
                  onPress={handleContactStudent}
                  className="bg-green-600 w-full py-4 rounded-xl flex-row items-center justify-center gap-2 mb-3"
                >
                  <Ionicons name="logo-whatsapp" size={20} color="white" />
                  <Text className="text-white font-bold uppercase tracking-widest">
                    Enviar Mensagem
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setSelectedStudent(null)}
                className="w-full py-4 rounded-xl items-center"
              >
                <Text className="text-zinc-500 font-bold uppercase tracking-widest">Fechare</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </ScreenLayout>
  );
}
