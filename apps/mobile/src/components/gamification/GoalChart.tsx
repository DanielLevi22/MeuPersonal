import { DailyGoal } from '@/services/gamification';
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
        backgroundColor: '#1C1C1E', 
        borderRadius: 22, 
        padding: 24, 
        alignItems: 'center', 
        justifyContent: 'center',
        height: 220,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}>
        <Text style={{ color: '#71717A', fontSize: 14, fontWeight: '500' }}>
          Sem dados suficientes para o gráfico
        </Text>
      </View>
    );
  }

  const color = type === 'meals' ? '#34C759' : '#FF6B35'; // Apple Green or Brand Orange

  return (
    <View style={{ 
      backgroundColor: '#1C1C1E', 
      borderRadius: 22, 
      padding: 20,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)'
    }}>
      <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600', marginBottom: 24, letterSpacing: -0.5 }}>
        {type === 'meals' ? '🥗 Refeições na Semana' : '💪 Treinos na Semana'}
      </Text>
      
      <LineChart
        data={{
          labels: labels,
          datasets: [
            {
              data: values,
              color: (opacity = 1) => color, // Line color
              strokeWidth: 3
            },
            {
              data: targets,
              color: (opacity = 1) => 'rgba(255, 255, 255, 0.2)',
              strokeWidth: 1,
              withDots: false,
              strokeDashArray: [5, 5]
            }
          ],
          legend: [type === 'meals' ? 'Realizado' : 'Realizado', 'Meta']
        }}
        width={screenWidth - 88} // Adjust for padding (24*2 + 20*2)
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: '#1C1C1E',
          backgroundGradientFrom: '#1C1C1E',
          backgroundGradientTo: '#1C1C1E',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(161, 161, 170, ${opacity})`, // zinc-400
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: "#1C1C1E"
          },
          propsForBackgroundLines: {
            strokeDasharray: "", // solid lines
            stroke: "rgba(255, 255, 255, 0.05)"
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
          marginLeft: -20, // Pull chart left to align y-axis
          paddingRight: 20
        }}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
      />
    </View>
  );
}
