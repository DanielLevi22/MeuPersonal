import colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import { useState } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={className}>
      {label && (
        <Text className="text-white font-semibold text-sm mb-2 font-sans">
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.disabled}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={textAlignVertical}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'bg-zinc-900/80 border-2 rounded-2xl px-4 py-4 text-base h-14',
          isFocused && !error && 'border-secondary-500',
          !isFocused && !error && 'border-zinc-700',
          error && 'border-red-400',
          !editable && 'opacity-60'
        )}
        style={{
          color: colors.text.primary,
          fontSize: 16,
        }}
      />
      {error && (
        <Text className="text-red-400 text-sm mt-1 font-sans">{error}</Text>
      )}
    </View>
  );
}
