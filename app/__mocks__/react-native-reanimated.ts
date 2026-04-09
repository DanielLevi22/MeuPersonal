
const mockAnim = {
  delay: jest.fn().mockReturnThis(),
  springify: jest.fn().mockReturnThis(),
  timing: jest.fn().mockReturnThis(),
  duration: jest.fn().mockReturnThis(),
};

export const FadeIn = mockAnim;
export const FadeInDown = mockAnim;
export const FadeInUp = mockAnim;
export const FadeInLeft = mockAnim;
export const FadeInRight = mockAnim;
export const Layout = mockAnim;

export const useSharedValue = (v: any) => ({ value: v });
export const useAnimatedStyle = (cb: any) => cb();
export const withSpring = (v: any) => v;
export const withTiming = (v: any) => v;

const Animated = {
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  createAnimatedComponent: (c: any) => c,
};

export default Animated;
