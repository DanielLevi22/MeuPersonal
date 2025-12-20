import { Dimensions, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CHART_WIDTH = SCREEN_WIDTH - 80; // Full width inside card (padding adjustments)

// -- SUB-COMPONENTS --

// 1. Volume by Muscle (Bar Chart - Custom SVG for clean look)
const VolumeByMuscleChart = () => {
    const data = [
        { label: 'Biceps', value: 80, color: '#3B82F6' }, // Blue
        { label: 'Costas', value: 60, color: '#60A5FA' }, // Light Blue
        { label: 'Peito', value: 90, color: '#FACC15' }, // Yellow
        { label: 'Ombros', value: 50, color: '#FB923C' }, // Orange
        { label: 'Perna', value: 70, color: '#A855F7' }, // Purple
    ];
    const maxValue = 100;
    const barWidth = 32; // Much thicker bars
    const spacing = 18;
    const height = 120; // Taller chart area

    return (
        <View className="items-center h-full justify-between pb-4">
            <View className="flex-row items-end h-[120px] w-full justify-between px-4">
                {data.map((item, index) => (
                    <View key={index} className="items-center gap-2">
                        <View className="h-full justify-end">
                            <View 
                                style={{ 
                                    height: `${(item.value / maxValue) * 100}%`, 
                                    width: barWidth, 
                                    backgroundColor: item.color,
                                    borderRadius: 6
                                }} 
                            />
                        </View>
                    </View>
                ))}
            </View>
            <View className="flex-row w-full justify-between px-1 mt-2">
                 {data.map((item, index) => (
                    <Text key={index} style={{ width: 24, fontSize: 8, textAlign: 'center', color: '#71717A' }} numberOfLines={1}>
                        {item.label.substring(0, 3)}
                    </Text>
                 ))}
            </View>
        </View>
    );
};

// 2. Weekly Load (Line Chart - Simple Sparkline style)
// 2. Weekly Load (Area Chart with Gradient)
const WeeklyLoadChart = () => {
    // Mock Data
    const data = [50, 60, 55, 70, 65, 80, 85];
    const width = CHART_WIDTH;
    const height = 120; // Taller
    const max = Math.max(...data);
    const min = Math.min(...data); // Start y-axis from min to exaggerate movement? Or 0? Let's do min-buffer.
    const range = max - (min * 0.8); // Add buffer
    
    // Create Path
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * (width - 20) + 10; // Padding
        const y = height - ((val - (min * 0.8)) / range) * height; 
        return `${x},${y}`;
    });
    
    const dLine = `M ${points.join(' L ')}`;
    const dArea = `${dLine} L ${width - 10},${height} L 10,${height} Z`;

    return (
        <View className="justify-end h-full w-full pb-4">
            <Svg width={width} height={height}>
                <Defs>
                    <SvgLinearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FACC15" stopOpacity="0.3" />
                        <Stop offset="1" stopColor="#FACC15" stopOpacity="0" />
                    </SvgLinearGradient>
                </Defs>
                
                {/* Area Fill */}
                <Path d={dArea} fill="url(#goldGradient)" />
                
                {/* Line */}
                <Path
                    d={dLine}
                    fill="none"
                    stroke="#FACC15"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                
                {/* Dots */}
                {points.map((p, i) => {
                    const [cx, cy] = p.split(',');
                    return <Circle key={i} cx={cx} cy={cy} r="4" fill="#18181B" stroke="#FACC15" strokeWidth="2" />
                })}
            </Svg>
            
            <View className="flex-row justify-between px-2 mt-4">
                 <View>
                    <Text className="text-zinc-500 text-[10px] uppercase font-bold">Volume Total</Text>
                    <Text className="text-white font-black text-2xl">134.4k</Text>
                 </View>
                 <View className="items-end">
                    <Text className="text-zinc-500 text-[10px] uppercase font-bold">Progresso</Text>
                    <Text className="text-emerald-500 font-bold text-lg">+12%</Text>
                 </View>
            </View>
        </View>
    );
}

// 3. Stimulus Distribution (Donut - Reusing logic logic)
const StimulusChart = () => {
    const size = 80;
    const center = size / 2;
    const radius = 30;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    
    // Data
    const stimulus = [
        { label: 'Força', value: 0.2, color: '#FACC15' },
        { label: 'Resistência', value: 0.3, color: '#3B82F6' },
        { label: 'Hipertrofia', value: 0.5, color: '#60A5FA' },
    ];
    
    let currentAngle = 0;

    return (
        <View className="flex-row items-center gap-4">
             <View className="relative w-[80px] h-[80px] items-center justify-center">
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <G rotation="-90" origin={`${center}, ${center}`}>
                        {stimulus.map((item, index) => {
                            const strokeDasharray = `${item.value * circumference} ${circumference}`;
                            const strokeDashoffset = -currentAngle * circumference;
                            currentAngle += item.value;
                            return (
                                <Circle
                                    key={index}
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    stroke={item.color}
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                />
                            )
                        })}
                    </G>
                </Svg>
            </View>
            <View className="gap-1">
                {stimulus.map((s, i) => (
                    <View key={i} className="flex-row items-center gap-2">
                        <View style={{ width: 8, height: 8, backgroundColor: s.color, borderRadius: 2 }} />
                        <Text className="text-zinc-400 text-[10px]">{s.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    )
}

// 4. Progression (Area Chart)
const ProgressionAnalysisChart = () => {
    const data = [30, 45, 40, 60, 55, 75, 90];
    const width = CHART_WIDTH;
    const height = 60;
    const max = 100;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (val / max) * height; 
        return `${x},${y}`;
    });
    
    const dLine = `M ${points.join(' L ')}`;
    const dArea = `${dLine} L ${width},${height} L 0,${height} Z`;

    return (
        <View className="justify-end h-full"> 
            <Svg width={width} height={height}>
                <Defs>
                    <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#A855F7" stopOpacity="0.5" />
                        <Stop offset="1" stopColor="#A855F7" stopOpacity="0" />
                    </SvgLinearGradient>
                </Defs>
                <Path d={dArea} fill="url(#grad)" />
                <Path d={dLine} stroke="#FACC15" strokeWidth="3" fill="none" strokeLinecap="round" />
            </Svg>
            <View className="flex-row justify-between items-end mt-2 h-4">
               {data.map((_, i) => (
                   <View key={i} className="w-1 h-2 bg-zinc-800 rounded-full" />
               ))}
            </View>
        </View>
    )
}


export function WorkoutAnalytics() {
  return (
    <Animated.View entering={FadeInDown.delay(500).springify()} className="mb-8">
        {/* Header */}
        <View className="mb-4">
            <Text className="text-white text-xl font-bold font-display">
                SUA EVOLUÇÃO <Text className="text-zinc-500">EM NÚMEROS</Text>
            </Text>
            <Text className="text-orange-500 text-xs font-bold bg-orange-500/10 self-start px-2 py-1 rounded-md mt-2">
                ESTATÍSTICAS COMPLETAS
            </Text>
        </View>

        {/* Stack (Vertical) */}
        <View className="gap-6">
            
            {/* 1. Volume per Muscle */}
            <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full h-64 justify-between">
                <Text className="text-white text-sm font-bold leading-tight uppercase tracking-wider text-zinc-400">Volume por grupo muscular</Text>
                <VolumeByMuscleChart />
            </View>

            {/* 2. Total Load */}
            <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full h-64 justify-between">
                 <Text className="text-white text-sm font-bold leading-tight uppercase tracking-wider text-zinc-400">Carga total levantada por semana</Text>
                 <WeeklyLoadChart />
            </View>

            {/* 3. Stimulus Distribution */}
            <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full h-64 justify-between">
                <Text className="text-white text-sm font-bold leading-tight uppercase tracking-wider text-zinc-400">Distribuição dos estímulos</Text>
                <StimulusChart />
            </View>

            {/* 4. Progression Analysis */}
            <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full h-64 justify-between">
                <Text className="text-white text-sm font-bold leading-tight uppercase tracking-wider text-zinc-400">Análise visual da progressão semanal</Text>
                <ProgressionAnalysisChart />
            </View>

        </View>

    </Animated.View>
  );
}
