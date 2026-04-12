# Guia de Migração: StyleSheet para Tailwind

Este guia mostra como migrar código existente que usa `StyleSheet` ou estilos inline para Tailwind (NativeWind).

---

## 🔄 Padrões de Migração

### 1. Cores

```tsx
// ❌ ANTES
style={{ backgroundColor: '#141B2D' }}
style={{ backgroundColor: '#0A0E1A' }}
style={{ color: '#FFFFFF' }}
style={{ color: '#8B92A8' }}
style={{ borderColor: '#1E2A42' }}

// ✅ DEPOIS
className="bg-surface"
className="bg-background"
className="text-foreground"
className="text-muted"
className="border-border"
```

### 2. Espaçamento

```tsx
// ❌ ANTES
style={{ padding: 16 }}
style={{ paddingHorizontal: 24 }}
style={{ paddingVertical: 12 }}
style={{ margin: 8 }}
style={{ marginTop: 16 }}
style={{ marginBottom: 24 }}
style={{ gap: 12 }}

// ✅ DEPOIS
className="p-4"
className="px-6"
className="py-3"
className="m-2"
className="mt-4"
className="mb-6"
className="gap-3"
```

### 3. Layout

```tsx
// ❌ ANTES
style={{ flex: 1 }}
style={{ flexDirection: 'row' }}
style={{ alignItems: 'center' }}
style={{ justifyContent: 'space-between' }}
style={{ flexWrap: 'wrap' }}

// ✅ DEPOIS
className="flex-1"
className="flex-row"
className="items-center"
className="justify-between"
className="flex-wrap"
```

### 4. Bordas e Raio

```tsx
// ❌ ANTES
style={{ borderRadius: 16 }}
style={{ borderRadius: 12 }}
style={{ borderWidth: 2 }}
style={{ borderWidth: 1 }}

// ✅ DEPOIS
className="rounded-2xl"
className="rounded-xl"
className="border-2"
className="border"
```

### 5. Tamanhos de Texto

```tsx
// ❌ ANTES
style={{ fontSize: 18 }}
style={{ fontSize: 16 }}
style={{ fontSize: 14 }}
style={{ fontSize: 12 }}

// ✅ DEPOIS
className="text-lg"
className="text-base"
className="text-sm"
className="text-xs"
```

### 6. Font Weight

```tsx
// ❌ ANTES
style={{ fontWeight: '700' }}
style={{ fontWeight: '600' }}
style={{ fontWeight: '400' }}

// ✅ DEPOIS
className="font-bold"
className="font-semibold"
className="font-normal"
```

### 7. Opacidade

```tsx
// ❌ ANTES
style={{ opacity: 0.5 }}

// ✅ DEPOIS
className="opacity-50"
```

---

## 📝 Exemplos Completos

### Exemplo 1: Card de Exercício

```tsx
// ❌ ANTES
<View
  style={{
    backgroundColor: '#141B2D',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
  }}
>
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
    <View
      style={{
        backgroundColor: '#FF6B35',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
        {index + 1}
      </Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
        {exercise.name}
      </Text>
      <View
        style={{
          backgroundColor: 'rgba(0, 217, 255, 0.15)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          alignSelf: 'flex-start',
        }}
      >
        <Text style={{ color: '#00D9FF', fontSize: 11, fontWeight: '600' }}>
          {exercise.muscle_group}
        </Text>
      </View>
    </View>
  </View>
</View>

// ✅ DEPOIS
<View className="bg-surface p-4 rounded-2xl mb-3 border-2 border-border">
  <View className="flex-row items-center mb-2">
    <View className="bg-primary w-7 h-7 rounded-full items-center justify-center mr-3">
      <Text className="text-foreground text-sm font-bold">
        {index + 1}
      </Text>
    </View>
    <View className="flex-1">
      <Text className="text-foreground text-base font-bold mb-1">
        {exercise.name}
      </Text>
      <View className="bg-secondary/15 px-2 py-1 rounded-md self-start">
        <Text className="text-secondary text-xs font-semibold">
          {exercise.muscle_group}
        </Text>
      </View>
    </View>
  </View>
</View>
```

### Exemplo 2: Botão com Gradiente

```tsx
// ❌ ANTES
<TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
  <LinearGradient
    colors={['#00FF88', '#00CC6E']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ color: '#0A0E1A', fontSize: 18, fontWeight: '700' }}>
      Salvar Treino
    </Text>
  </LinearGradient>
</TouchableOpacity>

// ✅ DEPOIS (mantém LinearGradient, mas usa Tailwind para o container)
<TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
  <LinearGradient
    colors={['#00FF88', '#00CC6E']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    className="rounded-2xl py-4.5 items-center justify-center"
  >
    <Text className="text-background text-lg font-bold">
      Salvar Treino
    </Text>
  </LinearGradient>
</TouchableOpacity>
```

### Exemplo 3: Input Field

```tsx
// ❌ ANTES
<View style={{ marginBottom: 20 }}>
  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
    Título do Treino
  </Text>
  <TextInput
    value={title}
    onChangeText={setTitle}
    placeholder="Ex: Treino A - Peito e Tríceps"
    placeholderTextColor="#5A6178"
    style={{
      backgroundColor: '#141B2D',
      borderWidth: 2,
      borderColor: '#1E2A42',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
      color: '#FFFFFF',
      fontSize: 16,
      minHeight: 56,
    }}
  />
</View>

// ✅ DEPOIS
<View className="mb-5">
  <Text className="text-foreground text-sm font-semibold mb-2">
    Título do Treino
  </Text>
  <TextInput
    value={title}
    onChangeText={setTitle}
    placeholder="Ex: Treino A - Peito e Tríceps"
    placeholderTextColor="#5A6178"
    className="bg-surface border-2 border-border rounded-2xl px-4 py-4 text-foreground text-base"
    style={{ minHeight: 56 }}
  />
</View>
```

---

## 🎯 Checklist de Migração

Ao migrar um componente:

- [ ] Substituir todas as cores hardcoded por tokens do Tailwind
- [ ] Converter todos os `style={{ ... }}` para `className="..."`
- [ ] Remover imports de `StyleSheet` se não estiver mais sendo usado
- [ ] Verificar se `cn()` está sendo usado para classes condicionais
- [ ] Testar visualmente para garantir que ficou igual
- [ ] Verificar responsividade se aplicável

---

## ⚠️ Casos Especiais

### LinearGradient

`LinearGradient` do `expo-linear-gradient` não suporta `className` diretamente. Use `style` para propriedades que não são suportadas pelo Tailwind, ou envolva em um `View`:

```tsx
// ✅ CORRETO
<View className="rounded-2xl overflow-hidden">
  <LinearGradient
    colors={['#00FF88', '#00CC6E']}
    className="p-4"
  >
    <Text className="text-background">Texto</Text>
  </LinearGradient>
</View>
```

### SafeAreaView

`SafeAreaView` também pode usar `className`:

```tsx
// ✅ CORRETO
<SafeAreaView className="flex-1 bg-background">
  {/* conteúdo */}
</SafeAreaView>
```

### ScrollView e FlatList

Ambos suportam `className` e `contentContainerStyle`:

```tsx
// ✅ CORRETO
<ScrollView 
  className="flex-1"
  contentContainerStyle="p-4"
  showsVerticalScrollIndicator={false}
>
  {/* conteúdo */}
</ScrollView>

<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  className="flex-1"
  contentContainerStyle="p-4"
/>
```

---

## 🔍 Ferramentas Úteis

### Extensão VS Code

Instale a extensão "Tailwind CSS IntelliSense" para autocomplete e validação.

### Conversor Online

Use ferramentas como [transform.tools](https://transform.tools/css-to-tailwind) para converter CSS para Tailwind (use com cuidado, pode precisar ajustes).

---

## 📚 Referência Rápida

| StyleSheet | Tailwind |
|------------|----------|
| `flex: 1` | `flex-1` |
| `flexDirection: 'row'` | `flex-row` |
| `alignItems: 'center'` | `items-center` |
| `justifyContent: 'space-between'` | `justify-between` |
| `padding: 16` | `p-4` |
| `paddingHorizontal: 24` | `px-6` |
| `paddingVertical: 12` | `py-3` |
| `margin: 8` | `m-2` |
| `marginTop: 16` | `mt-4` |
| `borderRadius: 16` | `rounded-2xl` |
| `borderWidth: 2` | `border-2` |
| `fontSize: 18` | `text-lg` |
| `fontWeight: '700'` | `font-bold` |
| `opacity: 0.5` | `opacity-50` |

---

**Última atualização**: 2025-01-XX

