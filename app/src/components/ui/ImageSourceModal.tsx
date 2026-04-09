import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ImageSourceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

export function ImageSourceModal({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
}: ImageSourceModalProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 15 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.8, { duration: 150 });
    }
  }, [visible, opacity, scale]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/80 px-6">
        <Animated.View style={[containerStyle]} className="absolute inset-0 bg-black/40" />

        <Animated.View
          style={[contentStyle]}
          className="w-full max-w-sm bg-zinc-950 rounded-[32px] border border-white/10 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <View className="items-center py-6 bg-zinc-900 border-b border-white/5">
            <View className="w-16 h-16 rounded-full bg-black/40 items-center justify-center border border-white/10 shadow-lg mb-3">
              <Ionicons name="camera-outline" size={32} color="#ffffff" />
            </View>
            <Text className="text-white text-xl font-bold font-display">Capturar Imagem</Text>
            <Text className="text-zinc-500 text-sm">Escolha como deseja adicionar a foto</Text>
          </View>

          {/* Options */}
          <View className="p-6 gap-4">
            {/* Camera Option */}
            <TouchableOpacity onPress={onSelectCamera} activeOpacity={0.8}>
              <LinearGradient
                colors={['#2563EB', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-row items-center p-4 rounded-2xl"
              >
                <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-4">
                  <Ionicons name="camera" size={20} color="white" />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">Câmera</Text>
                  <Text className="text-blue-100 text-xs">Tirar uma foto agora</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Gallery Option */}
            <TouchableOpacity onPress={onSelectGallery} activeOpacity={0.8}>
              <View className="flex-row items-center p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center mr-4 border border-zinc-700">
                  <Ionicons name="images" size={20} color="#e4e4e7" />
                </View>
                <View>
                  <Text className="text-zinc-200 font-bold text-lg">Galeria</Text>
                  <Text className="text-zinc-500 text-xs">Escolher do dispositivo</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={onClose} className="mt-2 py-3 items-center">
              <Text className="text-zinc-500 font-bold uppercase tracking-wider text-xs">
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
