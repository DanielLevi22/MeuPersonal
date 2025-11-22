import { StyleSheet, Text, View } from 'react-native';

interface MacroProgressBarProps {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
}

export function MacroProgressBar({ label, consumed, target, unit, color }: MacroProgressBarProps) {
  const percentage = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const isOver = consumed > target;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, isOver && styles.overValue]}>
          {consumed.toFixed(0)}{unit} / {target.toFixed(0)}{unit}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            { width: `${percentage}%`, backgroundColor: color }
          ]}
        />
      </View>

      {/* Percentage */}
      <Text style={[styles.percentage, { color }]}>
        {percentage.toFixed(0)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overValue: {
    color: '#ff6b6b',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#1E2A42',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});
