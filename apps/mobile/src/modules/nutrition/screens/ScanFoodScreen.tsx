import { Button } from '@/components/ui/Button';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { FoodAnalysisResult, FoodRecognitionService } from '../services/FoodRecognitionService';

export default function ScanFoodScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
         const permission = await ImagePicker.requestCameraPermissionsAsync();
         if (!permission.granted) {
            Alert.alert("Permissão necessária", "Precisamos de acesso à câmera para escanear sua comida.");
            return;
         }
         result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
         });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
      }

      if (!result.canceled) {
        // Optimize image before sending (even to mock)
        const manipResult = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 800 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        setImage(manipResult.uri);
        analyze(manipResult.uri);
      }
    } catch (e) {
        Alert.alert("Erro", "Não foi possível carregar a imagem.");
    }
  };

  const analyze = async (uri: string) => {
      setAnalyzing(true);
      setResult(null);
      try {
          const analysis = await FoodRecognitionService.analyzeFoodImage(uri);
          setResult(analysis);
      } catch (e) {
          Alert.alert("Erro", "Falha na análise da imagem.");
      } finally {
          setAnalyzing(false);
      }
  };

  const handleReset = () => {
      setImage(null);
      setResult(null);
  };

  return (
    <ScreenLayout>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center border-b border-zinc-800">
           <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="close" size={24} color="#FFF" />
           </TouchableOpacity>
           <Text className="text-xl font-bold text-white">Escanear Refeição</Text>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
            {!image ? (
                <View className="flex-1 justify-center items-center gap-6 mt-10">
                    <View className="h-64 w-64 bg-zinc-900 rounded-full items-center justify-center border-2 border-dashed border-zinc-700">
                        <Ionicons name="camera-outline" size={80} color="#52525B" />
                        <Text className="text-zinc-500 mt-4 text-center px-8">
                            Tire uma foto do seu prato para identificar macros
                        </Text>
                    </View>
                    
                    <View className="w-full gap-4 mt-8">
                        <Button 
                            variant="primary" 
                            label="Tirar Foto" 
                            onPress={() => pickImage(true)}
                            icon={<Ionicons name="camera" size={20} color="black" />}
                        />
                        <Button 
                            variant="outline" 
                            label="Galeria" 
                            onPress={() => pickImage(false)}
                            icon={<Ionicons name="images" size={20} color="white" />}
                        />
                    </View>
                </View>
            ) : (
                <View className="items-center">
                    <Image source={{ uri: image }} className="w-full h-64 rounded-2xl mb-6" />
                    
                    {analyzing ? (
                        <View className="items-center py-8">
                            <ActivityIndicator size="large" color="#FF6B35" />
                            <Text className="text-white mt-4 font-bold text-lg">Analisando Alimento...</Text>
                            <Text className="text-zinc-500 text-sm">Identificando componentes e porções</Text>
                        </View>
                    ) : result ? (
                        <View className="w-full bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                            <View className="flex-row items-start justify-between mb-4">
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-xl mb-1">{result.name}</Text>
                                    <View className="bg-green-500/20 self-start px-2 py-1 rounded">
                                        <Text className="text-green-500 text-xs font-bold">
                                            {(result.confidence * 100).toFixed(0)}% Confiança
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row justify-between bg-zinc-950 p-4 rounded-xl mb-6">
                                <View className="items-center">
                                    <Text className="text-zinc-400 text-xs uppercase mb-1">Calorias</Text>
                                    <Text className="text-white font-bold text-lg">{result.calories}</Text>
                                </View>
                                <View className="w-[1px] bg-zinc-800" />
                                <View className="items-center">
                                    <Text className="text-emerald-500 text-xs uppercase mb-1">Prot</Text>
                                    <Text className="text-white font-bold text-lg">{result.protein}g</Text>
                                </View>
                                <View className="w-[1px] bg-zinc-800" />
                                <View className="items-center">
                                    <Text className="text-purple-500 text-xs uppercase mb-1">Carb</Text>
                                    <Text className="text-white font-bold text-lg">{result.carbs}g</Text>
                                </View>
                                <View className="w-[1px] bg-zinc-800" />
                                <View className="items-center">
                                    <Text className="text-amber-500 text-xs uppercase mb-1">Gord</Text>
                                    <Text className="text-white font-bold text-lg">{result.fat}g</Text>
                                </View>
                            </View>

                            <Button 
                                variant="primary" 
                                label="Adicionar à Dieta" 
                                onPress={() => {
                                    Alert.alert("Sucesso", "Alimento adicionado à sua dieta! (Simulação)");
                                    router.back();
                                }}
                            />
                             <TouchableOpacity onPress={handleReset} className="mt-4 py-2 items-center">
                                <Text className="text-zinc-500 text-sm">Escanear Outro</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                         <Button variant="outline" label="Tentar Novamente" onPress={handleReset} />
                    )}
                </View>
            )}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}
