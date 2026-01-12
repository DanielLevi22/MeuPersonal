import { useAuthStore } from '@/auth';
import { WorkoutFeedbackModal } from '@/components/workout/WorkoutFeedbackModal';
import { supabase } from '@/lib/supabase';
import { useGamificationStore } from '@/store/gamificationStore';
import { getLocalDateISOString } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutStore } from '../store/workoutStore';

const LOCATION_TASK_NAME = 'background-location-task';
const { width } = Dimensions.get('window');

// Dark Map Style (Reference Image Style)
const DARK_MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#171717" }] // Very dark grey
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#1f2937" }] // Darker green/grey for parks
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6b9a76" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#262626" }] // Dark roads
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#212a37" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9ca5b3" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#333333" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#1f2835" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#f3d19c" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#0F0F0F" }] // Almost black water
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#515c6d" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#17263c" }]
  }
];

// METs aproximados
const METS: Record<string, number> = {
  'Caminhada': 3.5,
  'Corrida': 8.0,
  'Bicicleta': 6.0,
  'Elíptico': 5.0,
  'Natação': 7.0,
  'Cardio': 5.0, // Default
};

export default function CardioSessionScreen() {
  const { id, exerciseId, exerciseName, muscleGroup } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { incrementWorkoutProgress } = useGamificationStore();
  const { saveCardioSession } = useWorkoutStore();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: undefined
      });
    };
  }, [navigation]);

  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [calories, setCalories] = useState(0);
  const [intensity, setIntensity] = useState<'Baixa' | 'Moderada' | 'Alta'>('Moderada');
  
  // Timestamp-based tracking
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [lastFeedbackTime, setLastFeedbackTime] = useState(0);

  const [targetMinutes, setTargetMinutes] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareStats, setShareStats] = useState({
    title: '',
    duration: '',
    calories: '',
    date: '',
    exerciseName: ''
  });

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [userWeight, setUserWeight] = useState(70);

  // Map State
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number, longitude: number }[]>([]);
  const [dashboardTab, setDashboardTab] = useState<'Route' | 'Charts' | 'Pulse' | 'Intervals'>('Route');

  useEffect(() => {
    async function fetchUserWeight() {
        if (!user?.id) return;
        try {
            const { data } = await supabase.from('profiles').select('weight').eq('id', user.id).single();
            if (data?.weight) setUserWeight(data.weight);
        } catch (error) { console.log('Error fetching weight:', error); }
    }
    fetchUserWeight();
  }, [user?.id]);

  const met = METS[exerciseName as string] || METS['Cardio'] || 5.0;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  // Update logic similar to before...
  useEffect(() => {
    let interval: any;
    if (isActive && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const totalSeconds = accumulatedSeconds + Math.floor((now - startTime) / 1000);
        setSeconds(totalSeconds);
        const calsPerSec = (met * userWeight) / 3600;
        setCalories(totalSeconds * calsPerSec);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime, accumulatedSeconds, met, userWeight]);

  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  const handleStart = async () => {
    setIsActive(true);
    setStartTime(Date.now());
    if (!sessionStartTime) setSessionStartTime(new Date());

    try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus === 'granted') {
             await Location.watchPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
                distanceInterval: 5,
                timeInterval: 2000
             }, (newLoc) => {
                 setLocation(newLoc);
                 if(isActive) { // Only record path if active
                     setRouteCoordinates(prev => [...prev, {
                        latitude: newLoc.coords.latitude, 
                        longitude: newLoc.coords.longitude
                     }]);
                 }
             });
        }
    } catch (e) { console.log("Error starting location:", e); }
  };

  const handlePause = () => {
    setIsActive(false);
    if (startTime) {
      setAccumulatedSeconds(prev => prev + Math.floor((Date.now() - startTime) / 1000));
      setStartTime(null);
    }
  };

  const handleFinish = () => {
      handlePause();
      setShowFeedbackModal(true);
  }

  const onFeedbackSubmit = async (intensity: number, notes: string) => {
    setShowFeedbackModal(false);
    if (!user?.id || !sessionStartTime) return;
    const finalCalories = Math.round(calories);
    const finalTime = formatTime(seconds);
    
    try {
      await saveCardioSession({
        studentId: user.id,
        exerciseName: (exerciseName as string) || 'Cardio',
        durationSeconds: seconds,
        calories: calories,
        startedAt: sessionStartTime.toISOString(),
        completedAt: new Date().toISOString(),
        intensity,
        notes
      });
      await incrementWorkoutProgress(getLocalDateISOString());
      Alert.alert('Treino Salvo!', `Tempo: ${finalTime}\nCalorias: ${finalCalories} kcal`, [
          { text: 'Sair', onPress: () => router.navigate('/(tabs)/cardio') },
      ]);
    } catch(e) { Alert.alert('Erro ao salvar'); }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours > 0 ? `${hours}:` : ''}${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View className="flex-1 bg-zinc-950 relative">
        {/* MAP BACKGROUND */}
        <View className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
            {location && (
                <MapView
                    style={{ flex: 1 }}
                    customMapStyle={DARK_MAP_STYLE}
                    provider={PROVIDER_DEFAULT}
                    showsUserLocation
                    followsUserLocation
                    initialRegion={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }}
                >
                    <Polyline 
                        coordinates={routeCoordinates}
                        strokeColor="#CCFF00" // Neon Lime
                        strokeWidth={4}
                    />
                </MapView>
            )}
            {/* Top Gradient Overlay for readability */}
            <LinearGradient
                colors={['#000000cc', 'transparent']}
                className="absolute top-0 left-0 right-0 h-40"
            />
             {/* Bottom Gradient Overlay */}
            <LinearGradient
                colors={['transparent', '#000000']}
                className="absolute bottom-0 left-0 right-0 h-64"
            />
        </View>

        {/* TOP BAR */}
        <View style={{ paddingTop: insets.top + 10 }} className="px-6 flex-row items-center justify-between z-10">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center backdrop-blur-md">
                <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold font-display tracking-widest uppercase">
                {exerciseName || 'Running'}
            </Text>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-white/10 items-center justify-center backdrop-blur-md">
                <Ionicons name="ellipsis-vertical" size={20} color="white" />
            </TouchableOpacity>
        </View>

        {/* FLOATING TAB SELECTOR */}
        <View className="mt-6 items-center z-10">
            <View className="flex-row bg-zinc-900/80 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                {['Route', 'Charts', 'Pulse', 'Intervals'].map((tab) => (
                    <TouchableOpacity 
                        key={tab} 
                        onPress={() => setDashboardTab(tab as any)}
                        className={`px-4 py-2 rounded-xl ${dashboardTab === tab ? 'bg-[#CCFF00]' : 'bg-transparent'}`}
                    >
                        <Text className={`text-xs font-bold uppercase ${dashboardTab === tab ? 'text-black' : 'text-zinc-400'}`}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* BOTTOM CONTROLS (Floating Glass Card) */}
        <View className="absolute bottom-10 left-6 right-6 z-10">
            {/* Main Stats Card */}
            <View className="bg-zinc-900/90 rounded-[32px] p-6 border border-white/10 shadow-2xl backdrop-blur-xl">
                 <View className="flex-row justify-between items-start mb-6 w-full">
                     <View>
                        <Text className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">TEMPO</Text>
                        <Text className="text-white text-4xl font-black font-mono tracking-tighter">
                            {formatTime(seconds)}
                        </Text>
                     </View>
                     <View className="items-end">
                        <Text className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">CALORIAS</Text>
                        <Text className="text-white text-4xl font-black font-mono tracking-tighter">
                            {Math.round(calories)}<Text className="text-lg text-zinc-500">kcal</Text>
                        </Text>
                     </View>
                 </View>

                 {/* Locations (Visual Only for now) */}
                 <View className="flex-row gap-4 mb-8">
                     <View className="flex-1 bg-black/40 p-3 rounded-2xl border border-white/5 flex-row items-center">
                         <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
                             <Ionicons name="navigate" size={14} color="#10B981" />
                         </View>
                         <View>
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase">Distância</Text>
                            <Text className="text-white font-bold">1.2 km</Text>
                         </View>
                     </View>
                     <View className="flex-1 bg-black/40 p-3 rounded-2xl border border-white/5 flex-row items-center">
                         <View className="w-8 h-8 rounded-full bg-orange-500/20 items-center justify-center mr-3">
                             <Ionicons name="flame" size={14} color="#F97316" />
                         </View>
                         <View>
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase">Pace</Text>
                            <Text className="text-white font-bold">5'30"</Text>
                         </View>
                     </View>
                 </View>

                 {/* Action Button */}
                 {!isActive && seconds === 0 ? (
                    <TouchableOpacity 
                        onPress={handleStart}
                        activeOpacity={0.8}
                        className="w-full bg-[#CCFF00] h-14 rounded-full items-center justify-center shadow-lg shadow-lime-500/20"
                    >
                        <Text className="text-black font-black uppercase text-base tracking-wider">Start Now</Text>
                    </TouchableOpacity>
                 ) : (
                    <View className="flex-row gap-4">
                        <TouchableOpacity 
                            onPress={isActive ? handlePause : handleStart}
                            className="flex-1 bg-zinc-800 h-14 rounded-full items-center justify-center border border-zinc-700"
                        >
                            <Text className="text-white font-bold uppercase">
                                {isActive ? 'Pausar' : 'Retomar'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={handleFinish}
                            className="h-14 w-14 rounded-full bg-red-500/20 items-center justify-center border border-red-500/50"
                        >
                             <Ionicons name="stop" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                 )}
            </View>
        </View>

        <WorkoutFeedbackModal
           visible={showFeedbackModal}
           onClose={() => setShowFeedbackModal(false)}
           onSubmit={onFeedbackSubmit}
        />
    </View>
  );
}
