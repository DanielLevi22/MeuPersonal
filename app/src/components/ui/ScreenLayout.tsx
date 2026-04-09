import { StatusBar } from 'expo-status-bar';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

interface ScreenLayoutProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
  useSafeArea?: boolean;
}

export function ScreenLayout({
  className,
  children,
  useSafeArea = true,
  ...props
}: ScreenLayoutProps) {
  const Wrapper = useSafeArea ? SafeAreaView : View;

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <Wrapper className={cn('flex-1', className)} {...props}>
        {children}
      </Wrapper>
    </View>
  );
}
