import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useMemo } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
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

const TabItem = memo(({ route, state, navigation, isDragging }: { 
  route: any, 
  state: any, 
  navigation: any,
  isDragging: SharedValue<number>
}) => {
  const isFocused = state.index === state.routes.findIndex((r: any) => r.key === route.key);
  const onPress = () => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };
  const onLongPress = () => { navigation.emit({ type: 'tabLongPress', target: route.key }); };

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isDragging.value ? 0 : 1),
    transform: [{ scale: withSpring(isDragging.value ? 0 : 1) }]
  }));

  let iconName: any = 'help';
  const iconColor = isFocused ? "#FF6B35" : "rgba(255, 255, 255, 0.5)";

  switch (route.name) {
    case 'index': iconName = isFocused ? 'home' : 'home-outline'; break;
    case 'workouts': iconName = isFocused ? 'dumbbell' : 'dumbbell'; break;
    case 'nutrition': iconName = isFocused ? 'silverware-fork-knife' : 'silverware-fork-knife'; break;
    case 'progress': iconName = isFocused ? 'chart-line' : 'chart-line-variant'; break;
    case 'ranking': iconName = isFocused ? 'trophy' : 'trophy-outline'; break;
    case 'students': iconName = isFocused ? 'account-group' : 'account-group-outline'; break;
  }

  return (
    <Pressable 
      key={route.key} 
      onPress={onPress} 
      onLongPress={onLongPress} 
      style={styles.tabButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={iconName} size={28} color={iconColor} />
        {isFocused && (
          <Animated.View style={[styles.activeIndicator, indicatorStyle]} />
        )}
      </View>
    </Pressable>
  );
});

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { accountType, isMasquerading } = useAuthStore();
  const router = useRouter();
  
  const routeOrder = ['index', 'workouts', 'students', 'nutrition', 'progress', 'ranking'];
  
  const sortedRoutes = useMemo(() => state.routes
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
    }), [state.routes, accountType, isMasquerading]);
    
  const displayRoutes = sortedRoutes.slice(0, 4);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(0); 
  const activeActionShared = useSharedValue<string | null>(null);

  const triggerAction = (action: string) => {
    switch (action) {
      case 'workout': router.push('/(tabs)/workouts'); break;
      case 'meal': router.push('/(tabs)/nutrition'); break;
      case 'water': router.push('/(tabs)/nutrition'); break;
    }
    activeActionShared.value = null;
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = 1;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      const maxDistance = 50;
      const attractionForce = 15;
      
      let targetX = event.translationX;
      let targetY = event.translationY;

      // Detect action zones
      let currentAction = null;
      if (targetY < -40) currentAction = 'workout';
      else if (targetX < -40) currentAction = 'meal';
      else if (targetX > 40) currentAction = 'water';

      // Haptic Trigger
      if (currentAction !== activeActionShared.value) {
        activeActionShared.value = currentAction;
        if (currentAction) {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      // Magnetic Attraction Logic
      if (currentAction === 'workout') targetY -= attractionForce;
      else if (currentAction === 'meal') targetX -= attractionForce;
      else if (currentAction === 'water') targetX += attractionForce;

      const distance = Math.sqrt(targetX ** 2 + targetY ** 2);
      if (distance < maxDistance + attractionForce) {
        translateX.value = targetX;
        translateY.value = targetY;
      } else {
        const angle = Math.atan2(targetY, targetX);
        const limit = maxDistance + (currentAction ? attractionForce : 0);
        translateX.value = Math.cos(angle) * limit;
        translateY.value = Math.sin(angle) * limit;
      }
    })
    .onEnd(() => {
      isDragging.value = 0;
      const x = translateX.value;
      const y = translateY.value;

      if (y < -42) {
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(triggerAction)('workout');
      } else if (x < -42) {
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(triggerAction)('meal');
      } else if (x > 42) {
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(triggerAction)('water');
      }

      translateX.value = withSpring(0, { damping: 15, stiffness: 120 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      activeActionShared.value = null;
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

  const tabContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(isDragging.value ? 0.15 : 1, { damping: 20 }),
      transform: [{ scale: withSpring(isDragging.value ? 0.95 : 1) }]
    };
  });

  const actionIndicatorStyle = (action: string) => useAnimatedStyle(() => {
    const isActive = activeActionShared.value === action;
    const baseOpacity = withSpring(isDragging.value === 1 ? 1 : 0, { damping: 20 });
    
    // Use solid colors for maximum visibility and brand clarity
    let activeBg = '#FFFFFF';
    if (isActive) {
      if (action === 'workout') activeBg = "#FF6B35";
      else if (action === 'meal') activeBg = "#FF2E63";
      else if (action === 'water') activeBg = "#00D9FF";
    }

    return {
      opacity: isActive ? 1 : baseOpacity,
      backgroundColor: withSpring(isActive ? activeBg : 'rgba(255, 255, 255, 0.35)'),
      transform: [
        { scale: isActive ? withSpring(1.8, { damping: 10 }) : withSpring(1.1) },
        { translateY: isActive ? -22 : 0 }
      ],
      borderWidth: isActive ? 3 : 1.5,
      borderColor: "#FFFFFF",
      zIndex: isActive ? 999 : 1,
      elevation: isActive ? 12 : 6, // Stronger elevation for pop
      pointerEvents: isDragging.value ? 'auto' : 'none',
    } as any;
  });

  const labelStyle = (action: string) => useAnimatedStyle(() => {
    const isActive = activeActionShared.value === action;
    return {
      opacity: withSpring(isActive ? 1 : 0),
      transform: [{ translateY: withSpring(isActive ? -22 : 0) }, { scale: withSpring(isActive ? 1 : 0.5) }]
    };
  });

  const renderPlusButton = () => (
    <View key="plus-button" style={styles.centerButtonContainer} pointerEvents="box-none">
      {/* Action Indicators */}
      <View style={{ position: 'absolute' }} pointerEvents="box-none">
        <Animated.View style={[styles.actionIndicator, { top: -95 }, actionIndicatorStyle('workout')]}>
          <MaterialCommunityIcons 
            name="dumbbell" 
            size={22} 
            color="white" 
          />
          <Animated.Text style={[styles.actionLabel, labelStyle('workout'), { bottom: -25 }]}>Treino</Animated.Text>
        </Animated.View>
        
        <Animated.View style={[styles.actionIndicator, { left: -105 }, actionIndicatorStyle('meal')]}>
          <MaterialCommunityIcons 
            name="food-apple" 
            size={22} 
            color="white" 
          />
          <Animated.Text style={[styles.actionLabel, labelStyle('meal'), { bottom: -25 }]}>Dieta</Animated.Text>
        </Animated.View>
        
        <Animated.View style={[styles.actionIndicator, { right: -105 }, actionIndicatorStyle('water')]}>
          <MaterialCommunityIcons 
            name="water" 
            size={22} 
            color="white" 
          />
          <Animated.Text style={[styles.actionLabel, labelStyle('water'), { bottom: -25 }]}>Água</Animated.Text>
        </Animated.View>
      </View>

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
      <Animated.View style={[styles.content, tabContainerStyle]}>
        {displayRoutes.slice(0, 2).map((route) => (
          <TabItem 
            key={route.key} 
            route={route} 
            state={state} 
            navigation={navigation} 
            isDragging={isDragging} 
          />
        ))}
        {renderPlusButton()}
        {displayRoutes.slice(2, 4).map((route) => (
          <TabItem 
            key={route.key} 
            route={route} 
            state={state} 
            navigation={navigation} 
            isDragging={isDragging} 
          />
        ))}
      </Animated.View>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  actionLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 80,
    textAlign: 'center',
  },
});
