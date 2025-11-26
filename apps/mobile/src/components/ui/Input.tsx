import { cn } from '@/lib/utils';
import { useColorScheme } from 'nativewind';
import { Text, TextInput, View } from 'react-native';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  className?: string;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  className,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  textAlignVertical = 'center',
}: InputProps) {
  const { colorScheme } = useColorScheme();
  
  // Theme colors - always use dark mode colors since we set dark as default
  const colors = {
    text: '#FFFFFF',
    placeholder: '#A1A1AA',
    background: '#18181B', // zinc-900
    border: '#3F3F46', // zinc-700
    borderFocus: '#A3E635', // lime-400
    borderError: '#F87171', // red-400
  };

  return (
    <View className={className}>
      {label && (
        <Text className="text-white font-semibold text-sm mb-2">
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={textAlignVertical}
        className={cn(
          'bg-zinc-900 border-2 border-zinc-700 rounded-2xl px-4 py-4 text-base h-14',
          error && 'border-red-400',
          !editable && 'opacity-60'
        )}
        style={{
          color: colors.text,
          fontSize: 16,
        }}
      />
      {error && (
        <Text className="text-red-400 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
