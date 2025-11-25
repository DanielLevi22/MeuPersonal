import { DailyGoal } from '@/services/gamification';
import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface GoalChartProps {
  data: DailyGoal[];
  type: 'meals' | 'workouts';
}

export function GoalChart({ data, type }: GoalChartProps) {
  const screenWidth = Dimensions.get('window').width;

  // Format data for chart
  // We expect data to be sorted by date
  const labels = data.map(d => {
    const date = new Date(d.date);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });

  const values = data.map(d => 
    type === 'meals' ? d.meals_completed : d.workout_completed
  );

  const targets = data.map(d => 
    type === 'meals' ? d.meals_target : d.workout_target
  );

  // If no data, show empty state
  if (data.length === 0) {
    return (
      <View style={{ 
        backgroundColor: '#1E2A42', 
        borderRadius: 16, 
        padding: 16, 
        alignItems: 'center', 
        justifyContent: 'center',
        height: 220
      }}>
        <Text style={{ color: '#8B92A8' }}>Sem dados suficientes para o gráfico</Text>
      </View>
    );
  }

  const color = type === 'meals' ? '#10B981' : '#3B82F6'; // Green for meals, Blue for workouts

  return (
    <View style={{ 
      backgroundColor: '#1E2A42', 
      borderRadius: 16, 
      padding: 16,
      marginBottom: 16,
      overflow: 'hidden'
    }}>
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
        {type === 'meals' ? '🥗 Refeições na Semana' : '💪 Treinos na Semana'}
      </Text>
      
      <LineChart
        data={{
          labels: labels,
          datasets: [
            {
              data: values,
              color: (opacity = 1) => color, // Line color
              strokeWidth: 2
            },
            {
              data: targets, // Target line (optional, maybe too cluttered? Let's keep it simple first)
              color: (opacity = 1) => 'rgba(255, 255, 255, 0.3)',
              strokeWidth: 1,
              withDots: false
            }
          ],
          legend: [type === 'meals' ? 'Realizado' : 'Realizado', 'Meta']
        }}
        width={screenWidth - 80} // Adjust for padding
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: '#1E2A42',
          backgroundGradientFrom: '#1E2A42',
          backgroundGradientTo: '#1E2A42',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(139, 146, 168, ${opacity})`,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#1E2A42"
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
          marginLeft: -16 // Adjust for chart padding
        }}
      />
    </View>
  );
}
