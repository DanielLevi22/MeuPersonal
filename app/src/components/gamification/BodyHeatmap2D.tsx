import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Dimensions, type DimensionValue, Image, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'abs' | 'legs';

type MusclePosition = {
  top: DimensionValue;
  left: DimensionValue;
  width: DimensionValue;
  height: DimensionValue;
};

interface BodyHeatmap2DProps {
  intensities?: Record<MuscleGroup, number>; // 0 to 1
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Muscle overlay positions (percentage-based for responsiveness)
const MUSCLE_OVERLAYS: Record<string, Record<string, MusclePosition>> = {
  front: {
    chest: { top: '28%', left: '35%', width: '30%', height: '15%' },
    shoulders: { top: '22%', left: '25%', width: '50%', height: '10%' },
    abs: { top: '43%', left: '38%', width: '24%', height: '18%' },
    arms: { top: '28%', left: '15%', width: '70%', height: '25%' },
    legs: { top: '62%', left: '32%', width: '36%', height: '35%' },
  },
  back: {
    back: { top: '25%', left: '30%', width: '40%', height: '25%' },
    shoulders: { top: '20%', left: '25%', width: '50%', height: '12%' },
    arms: { top: '28%', left: '15%', width: '70%', height: '25%' },
    legs: { top: '55%', left: '32%', width: '36%', height: '40%' },
  },
};

const MuscleOverlay = ({
  position,
  intensity,
}: {
  position: MusclePosition;
  intensity: number;
}) => {
  if (intensity === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={['rgba(255, 107, 53, 0)', `rgba(255, 107, 53, ${intensity * 0.7})`]}
        style={{ flex: 1 }}
      />
    </View>
  );
};

export function BodyHeatmap2D({
  intensities = {
    chest: 0.8,
    back: 0.2,
    shoulders: 0.5,
    arms: 0.4,
    abs: 0.9,
    legs: 0.3,
  },
}: BodyHeatmap2DProps) {
  const [view, setView] = useState<'front' | 'back'>('front');

  // Zoom, Pan, and Rotation values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 3));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    });

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
      const maxTranslateY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

      translateX.value = Math.max(
        -maxTranslateX,
        Math.min(maxTranslateX, savedTranslateX.value + e.translationX)
      );
      translateY.value = Math.max(
        -maxTranslateY,
        Math.min(maxTranslateY, savedTranslateY.value + e.translationY)
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Double tap to reset zoom, rotation, and position
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withSpring(1);
      savedScale.value = 1;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      rotation.value = withSpring(0);
      savedRotation.value = 0;
    });

  const composed = Gesture.Simultaneous(
    Gesture.Race(doubleTap, Gesture.Simultaneous(pinchGesture, rotationGesture)),
    panGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotateZ: `${rotation.value}rad` },
    ],
  }));

  const handleViewChange = (newView: 'front' | 'back') => {
    // Reset zoom, rotation, and position when changing views
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    rotation.value = withTiming(0);
    savedRotation.value = 0;
    setView(newView);
  };

  return (
    <View className="flex-1 items-center justify-center relative">
      {/* Background Glow */}
      <View className="absolute inset-0 items-center justify-center">
        <View className="w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
      </View>

      {/* Zoomable Body Image Container */}
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
            animatedStyle,
          ]}
        >
          <View className="relative w-full h-full items-center justify-center">
            <Image
              source={
                view === 'front'
                  ? require('../../../assets/images/anatomy/body_front.png')
                  : require('../../../assets/images/anatomy/body_back.png')
              }
              style={{ width: '80%', height: '90%' }}
              resizeMode="contain"
            />

            {/* Muscle Overlays */}
            <View style={{ position: 'absolute', width: '80%', height: '90%' }}>
              {view === 'front' ? (
                <>
                  <MuscleOverlay
                    position={MUSCLE_OVERLAYS.front.chest}
                    intensity={intensities.chest || 0}
                  />
                  <MuscleOverlay
                    position={MUSCLE_OVERLAYS.front.shoulders}
                    intensity={intensities.shoulders || 0}
                  />
                  <MuscleOverlay
                    position={MUSCLE_OVERLAYS.front.abs}
                    intensity={intensities.abs || 0}
                  />
                  <MuscleOverlay
                    position={MUSCLE_OVERLAYS.front.arms}
                    intensity={intensities.arms || 0}
                  />
                  <MuscleOverlay
                    position={MUSCLE_OVERLAYS.front.legs}
                    intensity={intensities.legs || 0}
                  />
                </>
              ) : (
                <>
                  <MuscleOverlay
                    position={MUSCLE_OVERLAYS.back.back}
                    intensity={intensities.back || 0}
                  />
                  <MuscleOverlay
                    position={MUSCLE_OVERLAYS.back.shoulders}
                    intensity={intensities.shoulders || 0}
                  />
                  <MuscleOverlay
                    position={MUSCLE_OVERLAYS.back.arms}
                    intensity={intensities.arms || 0}
                  />
                  <MuscleOverlay
                    position={MUSCLE_OVERLAYS.back.legs}
                    intensity={intensities.legs || 0}
                  />
                </>
              )}
            </View>
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Zoom Hint */}
      <View className="absolute top-4 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-700">
        <Text className="text-zinc-300 text-xs">
          Pinça para zoom • Gire para rotacionar • Toque duplo para resetar
        </Text>
      </View>

      {/* View Toggle */}
      <View className="absolute bottom-4 flex-row gap-2">
        <TouchableOpacity
          onPress={() => handleViewChange('front')}
          className={`px-6 py-3 rounded-full border ${view === 'front' ? 'bg-orange-500 border-orange-500' : 'bg-zinc-900/50 border-zinc-700'}`}
        >
          <Text className={`font-bold ${view === 'front' ? 'text-white' : 'text-zinc-400'}`}>
            Frente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleViewChange('back')}
          className={`px-6 py-3 rounded-full border ${view === 'back' ? 'bg-orange-500 border-orange-500' : 'bg-zinc-900/50 border-zinc-700'}`}
        >
          <Text className={`font-bold ${view === 'back' ? 'text-white' : 'text-zinc-400'}`}>
            Costas
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
