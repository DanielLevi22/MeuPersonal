import { Button } from '@/components/ui/Button';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useNutritionStore } from '@/modules/nutrition/routes';
import { ShoppingCategory, ShoppingListService } from '@/modules/nutrition/services/ShoppingListService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  'Hortifruti': { icon: 'leaf', color: '#4ADE80', bg: 'bg-green-500/10' }, // Green
  'Carnes & Proteínas': { icon: 'restaurant', color: '#F87171', bg: 'bg-red-500/10' }, // Red
  'Laticínios & Frios': { icon: 'water', color: '#60A5FA', bg: 'bg-blue-500/10' }, // Blue
  'Mercearia': { icon: 'basket', color: '#FBBF24', bg: 'bg-amber-500/10' }, // Amber
  'Bebidas': { icon: 'wine', color: '#A78BFA', bg: 'bg-violet-500/10' }, // Violet
  'Suplementos': { icon: 'flash', color: '#22D3EE', bg: 'bg-cyan-500/10' }, // Cyan
  'Outros': { icon: 'cart', color: '#A1A1AA', bg: 'bg-zinc-500/10' } // Zinc
};

export default function ShoppingListScreen() {
  const router = useRouter();
  const { currentDietPlan, meals, mealItems } = useNutritionStore();
  
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [duration, setDuration] = useState(7); // Default 7 days

  /* AI Assistant State */
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantResult, setAssistantResult] = useState<string | null>(null);

  /* Shopping Mode State */
  const [isShoppingMode, setIsShoppingMode] = useState(false);

  const handleAskAssistant = async (type: 'recipes' | 'analysis' | 'tips' | 'meal_prep' | 'cooking_guide') => {
      setAssistantLoading(true);
      setAssistantResult(null);
      try {
          const result = await ShoppingListService.askAssistant(categories, type);
          setAssistantResult(result);
      } catch (error) {
          setAssistantResult("Desculpe, não consegui processar seu pedido.");
      } finally {
          setAssistantLoading(false);
      }
  };

  const AIAssistantModal = () => (
      <View className="absolute inset-0 bg-black/80 z-50 justify-end">
          <TouchableOpacity className="flex-1" onPress={() => setShowAssistant(false)} />
          <View className="bg-zinc-900 rounded-t-3xl border-t border-zinc-800 p-6 h-[80%]">
              <View className="flex-row items-center justify-between mb-6">
                  <View className="flex-row items-center gap-2">
                       <View className="bg-purple-500/20 p-2 rounded-full">
                          <Ionicons name="sparkles" size={20} color="#A855F7" />
                       </View>
                       <Text className="text-white text-xl font-bold font-display">Assistente Inteligente</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowAssistant(false)}>
                      <Ionicons name="close-circle" size={24} color="#52525B" />
                  </TouchableOpacity>
              </View>

              <Text className="text-zinc-400 mb-6 font-medium">
                  Use a IA para te ajudar com sua lista de compras. O que você deseja saber?
              </Text>

              <View className="flex-row gap-3 mb-6 flex-wrap">
                  {[
                      { id: 'recipes', label: 'Receitas', icon: 'restaurant' as const },
                      { id: 'analysis', label: 'Análise', icon: 'stats-chart' as const },
                      { id: 'tips', label: 'Dicas', icon: 'bulb' as const },
                      { id: 'meal_prep', label: 'Meal Prep', icon: 'calendar' as const },
                      { id: 'cooking_guide', label: 'Aprender a Cozinhar', icon: 'school' as const }
                  ].map((opt) => (
                      <TouchableOpacity 
                          key={opt.id}
                          onPress={() => handleAskAssistant(opt.id as any)}
                          className={`items-center justify-center p-3 rounded-xl border flex-1 min-w-[80px] ${assistantResult ? 'bg-zinc-800 border-zinc-700' : 'bg-purple-900/10 border-purple-500/30'}`}
                      >
                          <Ionicons name={opt.icon} size={20} color="#DDD" className="mb-1" />
                          <Text className="text-zinc-300 text-[10px] font-bold text-center">{opt.label}</Text>
                      </TouchableOpacity>
                  ))}
              </View>

              <ScrollView className="flex-1 bg-zinc-950/50 rounded-xl p-4 border border-zinc-800">
                  {assistantLoading ? (
                      <View className="items-center justify-center py-10">
                          <ActivityIndicator color="#A855F7" size="large" />
                          <Text className="text-zinc-500 mt-4 text-sm animate-pulse">Consultando a IA...</Text>
                      </View>
                  ) : assistantResult ? (
                      <Text className="text-zinc-300 leading-6">{assistantResult}</Text>
                  ) : (
                      <View className="items-center justify-center py-10 opacity-50">
                           <Ionicons name="chatbubbles-outline" size={40} color="#52525B" />
                           <Text className="text-zinc-600 mt-2 text-center">Selecione uma opção acima para iniciar</Text>
                      </View>
                  )}
              </ScrollView>
          </View>
      </View>
  );

  const ShoppingModeOverlay = () => (
      <View className="absolute inset-0 bg-black z-50 p-6">
          <View className="flex-row items-center justify-between mb-8 mt-4">
              <Text className="text-white text-3xl font-bold font-display text-emerald-400">Modo Mercado</Text>
              <TouchableOpacity onPress={() => setIsShoppingMode(false)} className="bg-zinc-800 px-4 py-2 rounded-full border border-zinc-700">
                  <Text className="text-zinc-300 font-bold">SAIR</Text>
              </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((cat, catIdx) => (
                    <View key={catIdx} className="mb-8">
                        <Text className="text-zinc-500 font-bold mb-4 uppercase text-sm tracking-widest border-b border-zinc-800 pb-2">
                            {cat.category}
                        </Text>
                        <View className="gap-4">
                            {cat.items.map((item, itemIdx) => (
                                <TouchableOpacity 
                                    key={itemIdx}
                                    onPress={() => toggleItem(catIdx, itemIdx)}
                                    className="flex-row items-center"
                                    activeOpacity={0.8}
                                >
                                    <View className={`w-10 h-10 rounded-lg border-2 mr-4 items-center justify-center ${item.checked ? 'bg-emerald-600 border-emerald-600' : 'border-zinc-600 bg-zinc-900'}`}>
                                        {item.checked && <Ionicons name="checkmark" size={28} color="white" />}
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`text-2xl font-bold ${item.checked ? 'text-zinc-600 line-through' : 'text-zinc-100'}`}>
                                            {item.name}
                                        </Text>
                                        <Text className="text-zinc-500 text-lg">{item.quantity}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
              ))}
              <View className="h-20" />
          </ScrollView>
      </View>
  );

  const generateList = async () => {
    // ...

    if (!currentDietPlan) {
        Alert.alert("Erro", "Nenhum plano de dieta ativo.");
        return;
    }
    
    setLoading(true);
    try {
        // Pass duration to service
        const result = await ShoppingListService.generateShoppingList(meals, mealItems, duration);
        setCategories(result);
        setHasGenerated(true);
    } catch (e) {
        Alert.alert("Erro", "Falha ao gerar lista.");
    } finally {
        setLoading(false);
    }
  };

  const toggleItem = (catIndex: number, itemIndex: number) => {
    const newCats = [...categories];
    newCats[catIndex].items[itemIndex].checked = !newCats[catIndex].items[itemIndex].checked;
    setCategories(newCats);
  };

  const shareList = async () => {
    const text = categories.map(cat => {
        const items = cat.items.map(i => `[${i.checked ? 'x' : ' '}] ${i.name} (${i.quantity})`).join('\n');
        return `*${cat.category}*\n${items}`;
    }).join('\n\n');

    await Share.share({
        message: `Minha Lista de Compras (${duration} dias):\n\n${text}`
    });
  };

  const DurationOption = ({ days }: { days: number }) => (
    <TouchableOpacity 
       onPress={() => setDuration(days)}
       className={`flex-1 items-center justify-center py-3 rounded-xl border ${duration === days ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-zinc-900 border-zinc-700'}`}
    >
        <Text className={`font-bold text-lg ${duration === days ? 'text-white' : 'text-zinc-400'}`}>
            {days}
        </Text>
        <Text className={`text-xs ${duration === days ? 'text-orange-100' : 'text-zinc-500'}`}>
            Dias
        </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-zinc-800 bg-zinc-900">
         <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white font-display">Lista de Compras</Text>
         </View>
         {hasGenerated && (
             <View className="flex-row gap-2">
                 {/* AI Button */}
                 <TouchableOpacity onPress={() => setShowAssistant(true)} className="bg-purple-500/10 p-2 rounded-full border border-purple-500/50">
                     <Ionicons name="sparkles" size={20} color="#A855F7" />
                 </TouchableOpacity>

                 <TouchableOpacity onPress={shareList} className="bg-zinc-800 p-2 rounded-full border border-zinc-700">
                     <Ionicons name="share-outline" size={20} color="#FF6B35" />
                 </TouchableOpacity>
             </View>
         )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
         {!hasGenerated ? (
             <View className="mt-8">
                 <View className="items-center mb-10">
                     <View className="bg-orange-500/10 p-6 rounded-full mb-6 border-4 border-orange-500/20 shadow-xl shadow-orange-500/10">
                        <Ionicons name="cart" size={48} color="#FF6B35" />
                     </View>
                     <Text className="text-white text-2xl font-bold font-display text-center mb-2">
                        Planejar Compras
                     </Text>
                     <Text className="text-zinc-400 text-center px-4 leading-6">
                        Selecione o período e geraremos sua lista de compras automaticamente baseada no seu plano alimentar.
                     </Text>
                 </View>

                 <Text className="text-white font-bold mb-4 ml-1">Período</Text>
                 <View className="flex-row gap-3 mb-4">
                    <DurationOption days={3} />
                    <DurationOption days={7} />
                    <DurationOption days={15} />
                    <DurationOption days={30} />
                 </View>

                 {/* Custom Input */}
                 <View className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 mb-8 flex-row items-center justify-between">
                    <Text className="text-zinc-400 font-medium">Outro período:</Text>
                    <View className="flex-row items-center bg-zinc-900 rounded-lg border border-zinc-600 px-4 py-2 w-32">
                        <TextInput 
                            value={String(duration)}
                            onChangeText={(text) => {
                                const num = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                                setDuration(num);
                            }}
                            keyboardType="numeric"
                            className="text-white font-bold text-lg flex-1 text-right mr-2"
                            placeholder="0"
                            placeholderTextColor="#52525B"
                        />
                        <Text className="text-zinc-500 font-bold">Dias</Text>
                    </View>
                 </View>

                 <Button 
                    label="Gerar Lista" 
                    onPress={generateList} 
                    isLoading={loading}
                    variant="primary"
                    className="shadow-lg shadow-orange-500/20"
                 />
             </View>
         ) : (
             <View className="gap-6">
                <View className="flex-row justify-between items-center mb-2">
                    <View>
                        <Text className="text-zinc-400 text-sm">Lista gerada para</Text>
                        <Text className="text-white font-bold text-xl">{duration} Dias</Text>
                    </View>
                    <View className="flex-row gap-2">
                        <TouchableOpacity 
                            onPress={() => setIsShoppingMode(true)}
                            className="bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/30 flex-row items-center gap-2"
                        >
                            <Ionicons name="scan-outline" size={16} color="#34D399" />
                            <Text className="text-emerald-400 font-bold text-xs uppercase">Modo Mercado</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => setHasGenerated(false)}
                            className="bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-700"
                        >
                            <Text className="text-zinc-300 font-bold text-xs">NOVA LISTA</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {categories.map((cat, catIdx) => {
                    const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG['Outros'];
                    
                    return (
                        <View key={catIdx} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                            {/* Category Header */}
                            <View className={`flex-row items-center p-4 border-b border-zinc-800/50 ${config.bg}`}>
                                <View className="p-2 bg-zinc-950/30 rounded-lg mr-3">
                                    <Ionicons name={config.icon as any} size={20} color={config.color} />
                                </View>
                                <Text className="text-white font-bold text-lg flex-1 font-display">
                                    {cat.category}
                                </Text>
                                <View className="bg-zinc-950/30 px-2 py-1 rounded">
                                    <Text className="text-zinc-400 text-xs font-bold">{cat.items.length} itens</Text>
                                </View>
                            </View>

                            {/* Items */}
                            <View className="p-2">
                                {cat.items.map((item, itemIdx) => (
                                    <TouchableOpacity 
                                        key={itemIdx}
                                        onPress={() => toggleItem(catIdx, itemIdx)}
                                        activeOpacity={0.7}
                                        className={`flex-row items-center p-3 rounded-xl mb-1 ${item.checked ? 'opacity-50' : 'bg-transparent'}`}
                                    >
                                        <View className={`w-6 h-6 rounded-full border mr-3 items-center justify-center ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700 bg-zinc-950'}`}>
                                            {item.checked && <Ionicons name="checkmark" size={14} color="white" />}
                                        </View>
                                        
                                        <View className="flex-1">
                                            <Text className={`text-base font-medium ${item.checked ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                                {item.name}
                                            </Text>
                                        </View>
                                        
                                        <View className="bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                                            <Text className="text-zinc-400 text-xs font-bold font-mono">{item.quantity}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    );
                })}
            </View>
         )}
      </ScrollView>

      {/* Overlays */}
      {showAssistant && <AIAssistantModal />}
      {isShoppingMode && <ShoppingModeOverlay />}

    </ScreenLayout>
  );
}
