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

// biome-ignore lint/suspicious/noExplicitAny: test mock requires loose types
export const useSharedValue = (v: any) => ({ value: v });
// biome-ignore lint/suspicious/noExplicitAny: test mock requires loose types
export const useAnimatedStyle = (cb: any) => cb();
// biome-ignore lint/suspicious/noExplicitAny: test mock requires loose types
export const withSpring = (v: any) => v;
// biome-ignore lint/suspicious/noExplicitAny: test mock requires loose types
export const withTiming = (v: any) => v;

const Animated = {
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires loose types
  createAnimatedComponent: (c: any) => c,
};

export default Animated;
