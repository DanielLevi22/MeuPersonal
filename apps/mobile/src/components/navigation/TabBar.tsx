import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../modules/auth/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 80;
const NOTCH_WIDTH = 160;
const NOTCH_CURVE = 44;

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { accountType, isMasquerading } = useAuthStore();
  const router = useRouter();
  
  const routeOrder = ['index', 'workouts', 'nutrition', 'progress', 'students'];
  
  const sortedRoutes = state.routes
    .filter((r: any) => {
      if (!routeOrder.includes(r.name)) return false;
      if (accountType === 'professional' && !isMasquerading) {
        if (r.name === 'progress') return false;
      }
      if (accountType === 'managed_student' || accountType === 'autonomous_student' || isMasquerading) {
        if (r.name === 'students') return false;
      }
      return true;
    })
    .sort((a: any, b: any) => {
      return routeOrder.indexOf(a.name) - routeOrder.indexOf(b.name);
    });
    
  const displayRoutes = sortedRoutes.slice(0, 4);

  const getPath = () => {
    const w = SCREEN_WIDTH * 0.92 - 2; 
    const h = TAB_BAR_HEIGHT - 2;
    const r = 40; 
    const mx = 1; 
    const my = 1; 
    const centerX = w / 2;
    const notchHalfWidth = NOTCH_WIDTH / 2;
    const smoothFactor = 15; 

    return `
      M ${mx} ${r + my}
      Q ${mx} ${my} ${r + mx} ${my}
      H ${centerX - notchHalfWidth - NOTCH_CURVE / 2 + mx}
      C ${centerX - notchHalfWidth + mx} ${my}, ${centerX - notchHalfWidth + smoothFactor + mx} ${NOTCH_CURVE + my}, ${centerX + mx} ${NOTCH_CURVE + my}
      C ${centerX + notchHalfWidth - smoothFactor + mx} ${NOTCH_CURVE + my}, ${centerX + notchHalfWidth + mx} ${my}, ${centerX + notchHalfWidth + NOTCH_CURVE / 2 + mx} ${my}
      H ${w - r + mx}
      Q ${w + mx} ${my} ${w + mx} ${r + my}
      V ${h - r + my}
      Q ${w + mx} ${h + my} ${w - r + mx} ${h + my}
      H ${r + mx}
      Q ${mx} ${h + my} ${mx} ${h - r + my}
      Z
    `;
  };

  const renderTab = (route: any) => {
    const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };
    const onLongPress = () => { navigation.emit({ type: 'tabLongPress', target: route.key }); };

    let iconName: any = 'help';
    const iconColor = isFocused ? colors.primary.solid : colors.text.muted;

    switch (route.name) {
      case 'index': iconName = isFocused ? 'home' : 'home-outline'; break;
      case 'workouts': iconName = isFocused ? 'dumbbell' : 'dumbbell'; break;
      case 'nutrition': iconName = isFocused ? 'silverware-fork-knife' : 'silverware-fork-knife'; break;
      case 'progress': iconName = isFocused ? 'chart-line' : 'chart-line-variant'; break;
      case 'students': iconName = isFocused ? 'account-group' : 'account-group-outline'; break;
    }

    return (
      <TouchableOpacity key={route.key} onPress={onPress} onLongPress={onLongPress} style={styles.tabButton}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={iconName} size={28} color={iconColor} />
          {isFocused && <View style={styles.activeIndicator} />}
        </View>
      </TouchableOpacity>
    );
  };
  
  // Define the shared values for the Analog-Joystick logic
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(0); // 0 = false, 1 = true
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const triggerAction = (action: string) => {
    switch (action) {
      case 'workout': router.push('/(tabs)/workouts'); break;
      case 'meal': router.push('/(tabs)/nutrition'); break;
      case 'water': router.push('/(tabs)/nutrition'); break;
    }
    setActiveAction(null);
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = 1;
    })
    .onUpdate((event) => {
      const maxDistance = 50;
      const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
      
      if (distance < maxDistance) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      } else {
        const angle = Math.atan2(event.translationY, event.translationX);
        translateX.value = Math.cos(angle) * maxDistance;
        translateY.value = Math.sin(angle) * maxDistance;
      }

      let currentAction = null;
      if (translateY.value < -30) currentAction = 'workout';
      else if (translateX.value < -30) currentAction = 'meal';
      else if (translateX.value > 30) currentAction = 'water';
      
      if (currentAction !== activeAction) {
        runOnJS(setActiveAction)(currentAction);
      }
    })
    .onEnd(() => {
      isDragging.value = 0;
      const x = translateX.value;
      const y = translateY.value;

      if (y < -35) runOnJS(triggerAction)('workout');
      else if (x < -35) runOnJS(triggerAction)('meal');
      else if (x > 35) runOnJS(triggerAction)('water');

      translateX.value = withSpring(0, { damping: 15, stiffness: 120 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      runOnJS(setActiveAction)(null);
    });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: withSpring(isDragging.value ? 1.15 : 1) }
      ],
    };
  });

  const actionIndicatorStyle = (action: string) => useAnimatedStyle(() => {
    const isActive = activeAction === action;
    
    // Base visibility triggers as soon as dragging (pressing) starts
    const baseOpacity = withSpring(isDragging.value === 1 ? 0.8 : 0, { damping: 20 });
    
    // If specific action is active, give it 100% opacity and extra scale
    return {
      opacity: isActive ? 1 : baseOpacity,
      transform: [
        { scale: isActive ? withSpring(1.5) : withSpring(1) },
        { translateY: isActive ? -5 : 0 }
      ],
    };
  });

  const renderPlusButton = () => (
    <View key="plus-button" style={styles.centerButtonContainer}>
      {/* Action Indicators */}
      <Animated.View style={[styles.actionIndicator, { top: -45 }, actionIndicatorStyle('workout')]}>
        <MaterialCommunityIcons name="dumbbell" size={20} color={activeAction === 'workout' ? "#FF6B35" : "white"} />
      </Animated.View>
      <Animated.View style={[styles.actionIndicator, { left: -45 }, actionIndicatorStyle('meal')]}>
        <MaterialCommunityIcons name="food-apple" size={20} color={activeAction === 'meal' ? "#FF2E63" : "white"} />
      </Animated.View>
      <Animated.View style={[styles.actionIndicator, { right: -45 }, actionIndicatorStyle('water')]}>
        <MaterialCommunityIcons name="water" size={20} color={activeAction === 'water' ? "#00D9FF" : "white"} />
      </Animated.View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.centerButton, animatedButtonStyle]}>
          <LinearGradient
            colors={colors.gradients.primary}
            style={styles.centerButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="gamepad-variant" size={32} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 10 }]}>
      {/* Background layer */}
      <View style={styles.backgroundContainer}>
        <BlurView 
          intensity={Platform.OS === 'ios' ? 45 : 85} 
          tint="dark" 
          style={[StyleSheet.absoluteFill, { borderRadius: 40, overflow: 'hidden' }]} 
        />
        <Svg width={SCREEN_WIDTH * 0.92} height={TAB_BAR_HEIGHT} style={styles.svgBackground}>
          <Path 
            d={getPath()} 
            fill="rgba(24, 24, 27, 0.45)" 
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={1}
          />
        </Svg>
      </View>
      
      {/* Interactive content layer */}
      <View style={styles.content}>
        {displayRoutes.slice(0, 2).map((route) => renderTab(route))}
        {renderPlusButton()}
        {displayRoutes.slice(2, 4).map((route) => renderTab(route))}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  backgroundContainer: {
    position: 'absolute',
    width: '92%',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '92%',
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24, // Keep it circular by default
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.solid,
    position: 'absolute',
    bottom: -2,
  },
  centerButtonContainer: {
    width: 68,
    height: 68,
    marginTop: -32, 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  centerButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  actionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionIndicator: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
