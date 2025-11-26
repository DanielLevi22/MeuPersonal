import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Text, View } from 'react-native';

export default function CreateDietScreen() {
  return (
    <ScreenLayout>
      <View className="flex-1 justify-center items-center">
        <Text className="text-foreground">Create Diet Screen</Text>
      </View>
    </ScreenLayout>
  );
}
