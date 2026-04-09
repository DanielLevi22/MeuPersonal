import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface CameraOverlayGuidesProps {
  step: 'front' | 'side_right' | 'back' | 'side_left';
  width: number;
  height: number;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const CameraOverlayGuides: React.FC<CameraOverlayGuidesProps> = ({
  step,
  width,
  height,
}) => {
  const isFrontOrBack = step === 'front' || step === 'back';

  // Animation for the "glow" effect
  const strokeOpacity = useSharedValue(0.5);

  useEffect(() => {
    strokeOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [strokeOpacity]);

  const animatedProps = useAnimatedProps(() => ({
    strokeOpacity: strokeOpacity.value,
  }));

  // Simplified paths for body outlines
  // These are standard "T-pose" like outlines but more relaxed
  const frontPath = `
    M ${width / 2} ${height * 0.12} 
    C ${width / 2 + 30} ${height * 0.12} ${width / 2 + 30} ${height * 0.18} ${width / 2} ${height * 0.18}
    C ${width / 2 - 30} ${height * 0.18} ${width / 2 - 30} ${height * 0.12} ${width / 2} ${height * 0.12}
    M ${width / 2} ${height * 0.18} 
    L ${width / 2} ${height * 0.22}
    L ${width * 0.25} ${height * 0.25} 
    L ${width * 0.2} ${height * 0.45}
    M ${width / 2} ${height * 0.22}
    L ${width * 0.75} ${height * 0.25}
    L ${width * 0.8} ${height * 0.45}
    M ${width / 2} ${height * 0.22}
    L ${width / 2} ${height * 0.5}
    L ${width * 0.35} ${height * 0.55}
    L ${width * 0.35} ${height * 0.85}
    M ${width / 2} ${height * 0.5}
    L ${width * 0.65} ${height * 0.55}
    L ${width * 0.65} ${height * 0.85}
  `;

  const sidePath = `
    M ${width / 2} ${height * 0.12}
    C ${width / 2 + 25} ${height * 0.12} ${width / 2 + 25} ${height * 0.18} ${width / 2} ${height * 0.18}
    C ${width / 2 - 25} ${height * 0.18} ${width / 2 - 25} ${height * 0.12} ${width / 2} ${height * 0.12}
    M ${width / 2} ${height * 0.18}
    L ${width / 2 + 5} ${height * 0.22}
    L ${width / 2 + 10} ${height * 0.5}
    L ${width / 2 + 5} ${height * 0.85}
    M ${width / 2 + 5} ${height * 0.22}
    L ${width / 2 + 15} ${height * 0.35}
    L ${width / 2 + 10} ${height * 0.45}
  `;

  const pathData = isFrontOrBack ? frontPath : sidePath;

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#00d9ff" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0.2" />
          </LinearGradient>
        </Defs>

        {/* Main Skeleton Outline */}
        <AnimatedPath
          d={pathData}
          stroke="url(#grad)" // Use gradient
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={animatedProps}
        />

        {/* Guide Dots (Joints) */}
        {isFrontOrBack ? (
          <>
            <Circle cx={width / 2} cy={height * 0.15} r="4" fill="#00d9ff" opacity="0.6" />
            <Circle cx={width * 0.25} cy={height * 0.25} r="3" fill="#00d9ff" opacity="0.5" />
            <Circle cx={width * 0.75} cy={height * 0.25} r="3" fill="#00d9ff" opacity="0.5" />
          </>
        ) : (
          <Circle cx={width / 2} cy={height * 0.15} r="4" fill="#00d9ff" opacity="0.6" />
        )}
      </Svg>
    </View>
  );
};
