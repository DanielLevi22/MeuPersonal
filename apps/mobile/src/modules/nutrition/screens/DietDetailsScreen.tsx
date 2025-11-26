import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function DietDetailsScreen() {
  const { id } = useLocalSearchParams();
  return (
    <ScreenLayout>
      <View className="flex-1 justify-center items-center">
        <Text className="text-foreground">Diet Details Screen: {id}</Text>
      </View>
    </ScreenLayout>
  );
}
