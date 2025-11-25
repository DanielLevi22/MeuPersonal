import { cn } from '@/lib/utils';
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
  return (
    <View className={className}>
      {label && (
        <Text className="text-foreground font-semibold text-sm mb-2 font-display">{label}</Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71717A" // Zinc 500
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={textAlignVertical}
        className={cn(
          'bg-input/50 border border-input rounded-xl px-4 py-4 text-foreground text-base font-sans',
          'focus:border-primary focus:bg-input',
          error && 'border-destructive',
          !editable && 'opacity-60'
        )}
        style={{ minHeight: 56 }}
      />
      {error && (
        <Text className="text-destructive text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
