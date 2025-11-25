import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Animated, TouchableOpacity } from 'react-native';

export function AdminMenuButton() {
  const router = useRouter();
  const { accountType } = useAuthStore();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Debug logs
  console.log('🔍 AdminMenuButton - accountType:', accountType);
  console.log('🔍 AdminMenuButton - should render:', accountType === 'admin');

  // Only show for admins
  if (accountType !== 'admin') {
    console.log('❌ AdminMenuButton - Not rendering (not admin)');
    return null;
  }

  console.log('✅ AdminMenuButton - Rendering button!');

  const handlePress = () => {
    // Animate press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to admin panel
    router.push('/(admin)' as any);
  };

  return (
    <Animated.View 
      style={{ 
        transform: [{ scale: scaleAnim }],
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 999,
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        className="shadow-2xl"
      >
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{
            shadowColor: '#8B5CF6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
