
import { Ionicons } from '@expo/vector-icons';
import { useGLTF } from '@react-three/drei/native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, PanResponderInstance, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as THREE from 'three';

type MuscleGroup = 
  | 'chest' | 'abs' | 'back' 
  | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'quadriceps' | 'hamstrings' | 'calves'
  | 'trapezius' | 'lats' | 'glutes';

interface BodyHeatmap3DProps {
  intensities?: Partial<Record<MuscleGroup, number>>; // 0 to 1
}

// Helper for distance between two touches
const getDistance = (touches: any[]) => {
  const [a, b] = touches;
  return Math.sqrt(
    Math.pow(a.pageX - b.pageX, 2) + 
    Math.pow(a.pageY - b.pageY, 2)
  );
};

// Muscle group metadata
const muscleGroups: Array<{ id: MuscleGroup; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'chest', label: 'Peito', icon: 'body-outline' },
  { id: 'abs', label: 'Abdômen', icon: 'fitness-outline' },
  { id: 'back', label: 'Costas', icon: 'body-outline' },
  { id: 'shoulders', label: 'Ombros', icon: 'body-outline' },
  { id: 'biceps', label: 'Bíceps', icon: 'barbell-outline' },
  { id: 'triceps', label: 'Tríceps', icon: 'barbell-outline' },
  { id: 'forearms', label: 'Antebraços', icon: 'hand-left-outline' },
  { id: 'quadriceps', label: 'Quadríceps', icon: 'walk-outline' },
  { id: 'hamstrings', label: 'Posteriores', icon: 'walk-outline' },
  { id: 'calves', label: 'Panturrilhas', icon: 'footsteps-outline' },
  { id: 'trapezius', label: 'Trapézio', icon: 'body-outline' },
  { id: 'lats', label: 'Dorsais', icon: 'body-outline' },
  { id: 'glutes', label: 'Glúteos', icon: 'body-outline' },
];

// Mapping of muscles to their ideal viewing angle (Y-rotation) in Radians
// 0 = Front, PI = Back
const muscleRotationMap: Record<MuscleGroup, number> = {
  // Front View (0)
  chest: 0,
  abs: 0,
  shoulders: 0,
  biceps: 0,
  forearms: 0,
  quadriceps: 0,
  
  // Back View (PI)
  back: Math.PI,
  triceps: Math.PI,
  hamstrings: Math.PI,
  calves: Math.PI,
  trapezius: Math.PI,
  lats: Math.PI,
  glutes: Math.PI,
};

// Mapping of mesh names in the GLB to muscle groups
const meshToMuscleMap: Record<string, MuscleGroup> = {
  'pectoralis': 'chest', 'chest': 'chest', 'pecs': 'chest',
  'abs': 'abs', 'rectus_abdominis': 'abs', 'abdominals': 'abs',
  'back': 'back', 'erector_spinae': 'back', 'rhomboid': 'back', 'teres': 'back', 'infraspinatus': 'back', 'dorsal': 'back', 'lumbar': 'back', 'spine': 'back',
  'deltoid': 'shoulders', 'shoulders': 'shoulders', 'delts': 'shoulders',
  'biceps': 'biceps', 'bicep': 'biceps', 'triceps': 'triceps', 'tricep': 'triceps', 'forearm': 'forearms', 'forearms': 'forearms',
  'quadriceps': 'quadriceps', 'quads': 'quadriceps', 'hamstrings': 'hamstrings', 'hamstring': 'hamstrings',
  'calves': 'calves', 'calf': 'calves', 'gastrocnemius': 'calves',
  'trapezius': 'trapezius', 'trap': 'trapezius', 'latissimus': 'lats', 'lats': 'lats', 'lat': 'lats',
  'glutes': 'glutes', 'gluteus': 'glutes', 'glute': 'glutes',
};

// Muscle hitbox definitions (position and scale relative to model)
const muscleHitboxes: Record<MuscleGroup, { position: [number, number, number]; scale: [number, number, number] }[]> = {
  chest: [
    { position: [0.18, 1.45, 0.12], scale: [0.15, 0.22, 0.06] },
    { position: [-0.18, 1.45, 0.12], scale: [0.15, 0.22, 0.06] },
  ],
  abs: [
    { position: [0, 1.05, 0.09], scale: [0.18, 0.32, 0.08] },
  ],
  back: [
    { position: [0, 1.45, -0.15], scale: [0.25, 0.4, 0.06] },
    { position: [0, 1.15, -0.12], scale: [0.2, 0.4, 0.06] },
  ],
  shoulders: [
    { position: [0.45, 1.55, 0], scale: [0.22, 0.22, 0.20] },
    { position: [-0.45, 1.55, 0], scale: [0.22, 0.22, 0.20] },
  ],
  biceps: [
    { position: [0.55, 1.3, 0.05], scale: [0.14, 0.24, 0.14] },
    { position: [-0.55, 1.3, 0.05], scale: [0.14, 0.24, 0.14] },
    { position: [0.55, 1.3, -0.05], scale: [0.14, 0.24, 0.14] },
    { position: [-0.55, 1.3, -0.05], scale: [0.14, 0.24, 0.14] },
  ],
  triceps: [
    { position: [0.65, 1.3, -0.1], scale: [0.12, 0.24, 0.12] },
    { position: [-0.65, 1.3, -0.1], scale: [0.12, 0.24, 0.12] },
  ],
  forearms: [
    { position: [0.75, 1.0, 0], scale: [0.11, 0.35, 0.11] },
    { position: [-0.75, 1.0, 0], scale: [0.11, 0.35, 0.11] },
  ],
  glutes: [
    { position: [0.15, 0.9, -0.18], scale: [0.18, 0.22, 0.15] },
    { position: [-0.15, 0.9, -0.18], scale: [0.18, 0.22, 0.15] },
  ],
  quadriceps: [
    { position: [0.15, 0.55, 0.12], scale: [0.16, 0.38, 0.12] },
    { position: [-0.15, 0.55, 0.12], scale: [0.16, 0.38, 0.12] },
  ],
  hamstrings: [
    { position: [0.15, 0.55, -0.12], scale: [0.16, 0.38, 0.12] },
    { position: [-0.15, 0.55, -0.12], scale: [0.16, 0.38, 0.12] },
  ],
  calves: [
    { position: [0.15, 0.25, -0.08], scale: [0.11, 0.28, 0.11] },
    { position: [-0.15, 0.25, -0.08], scale: [0.11, 0.28, 0.11] },
  ],
  trapezius: [
    { position: [0, 1.55, -0.1], scale: [0.35, 0.15, 0.08] },
  ],
  lats: [
    { position: [0.3, 1.25, -0.12], scale: [0.15, 0.35, 0.1] },
    { position: [-0.3, 1.25, -0.12], scale: [0.15, 0.35, 0.1] },
  ],
};

// Component to control camera zoom
function CameraRig({ zoom }: { zoom: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  
  useFrame(() => {
    // Smoothly interpolate camera position
    const z = Math.max(1.5, Math.min(8, zoom.current));
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, z, 0.1);
  });
  return null;
}

interface AnatomyModelProps {
  intensities: Partial<Record<MuscleGroup, number>>;
  rotationY: React.MutableRefObject<number>;
  selectedMuscle: MuscleGroup | null;
  onSelectMuscle: (muscle: MuscleGroup) => void;
  isAutoRotating: React.MutableRefObject<boolean>;
}

function AnatomyModel({ intensities, rotationY, selectedMuscle, onSelectMuscle, isAutoRotating }: AnatomyModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const modelUrl = 'https://drive.google.com/uc?export=download&id=1erWb8aMRMaOJgfsWmMlGQ9v-snMsCYXA';
  const gltf = useGLTF(modelUrl) as any;
  const scene = gltf.scene as THREE.Group;
  
  // Target rotation reference for smooth animation
  const targetRotation = useRef(0);
  
  // Clone scene to avoid mutation issues across re-renders
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Update target rotation when muscle selection changes
  useEffect(() => {
    if (selectedMuscle) {
      targetRotation.current = muscleRotationMap[selectedMuscle];
      isAutoRotating.current = true;
    }
  }, [selectedMuscle]);

  // Frame loop for rotation animation
  useFrame(() => {
    if (groupRef.current) {
      if (isAutoRotating.current) {
        if (Math.abs(rotationY.current - targetRotation.current) > 0.01) {
          rotationY.current = THREE.MathUtils.lerp(rotationY.current, targetRotation.current, 0.1);
        } else {
          rotationY.current = targetRotation.current;
          isAutoRotating.current = false;
        }
      }
      groupRef.current.rotation.y = rotationY.current;
    }
  });

  return (
    <group ref={groupRef} scale={1.2} position={[0, -0.9, 0]}>
      {/* The Realistic 3D Model */}
      <primitive object={clonedScene} />

      {/* Holographic Overlay for Selected Muscle */}
      {selectedMuscle && muscleHitboxes[selectedMuscle] && (
         <>
           {muscleHitboxes[selectedMuscle].map((hitbox, index) => (
             <mesh key={index} position={hitbox.position} scale={hitbox.scale}>
               <sphereGeometry args={[1, 16, 16]} />
               <meshStandardMaterial
                 color="#ff6b35"
                 transparent
                 opacity={0.4}
                 blending={THREE.AdditiveBlending}
                 depthWrite={false}
                 emissive="#ff6b35"
                 emissiveIntensity={1.5}
               />
             </mesh>
           ))}
         </>
      )}

      {/* Invisible Interactive Hitboxes for Clicking */}
      {Object.entries(muscleHitboxes).map(([muscleKey, hitboxes]) => {
        const muscle = muscleKey as MuscleGroup;
        return hitboxes.map((hitbox, index) => (
          <mesh 
            key={`${muscle}-${index}`}
            position={hitbox.position}
            scale={hitbox.scale}
            onClick={(e) => {
              e.stopPropagation();
              onSelectMuscle(muscle);
            }}
            visible={false} 
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="red" />
          </mesh>
        ));
      })}
    </group>
  );
}

export function BodyHeatmap3D({ intensities = {
  chest: 0.8,
  abs: 0.9,
  back: 0.6,
  shoulders: 0.7,
  biceps: 0.5,
  triceps: 0.6,
  forearms: 0.4,
  quadriceps: 0.7,
  hamstrings: 0.5,
  calves: 0.3,
  trapezius: 0.6,
  lats: 0.7,
  glutes: 0.5,
} }: BodyHeatmap3DProps) {
  
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  
  // Rotation
  const rotationY = useRef(0);
  const startRotationY = useRef(0);
  const isAutoRotating = useRef(false);
  
  // Zoom
  const zoom = useRef(4.0);
  const startZoom = useRef(4.0);
  const startDistance = useRef(0);
  
  const panResponder = useRef<PanResponderInstance>(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt, gestureState) => {
        // Stop auto rotation on user interaction
        isAutoRotating.current = false;

        // Store initial values
        startRotationY.current = rotationY.current;
        
        // Handle initial pinch distance
        if (evt.nativeEvent.touches.length === 2) {
          startDistance.current = getDistance(evt.nativeEvent.touches);
          startZoom.current = zoom.current;
        }
      },
      
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 1) {
          // Single touch: Rotate
          // Calculate delta from the start of the gesture
          const deltaX = gestureState.dx;
          // Sensitivity: 100px = 1 radian
          rotationY.current = startRotationY.current + (deltaX / 100);
        } else if (evt.nativeEvent.touches.length === 2) {
          // Two touches: Pinch Zoom
          const currentDistance = getDistance(evt.nativeEvent.touches);
          if (startDistance.current > 0) {
            const scale = currentDistance / startDistance.current;
            const zoomDelta = (1 - scale) * 3; 
            zoom.current = Math.max(1.5, Math.min(8.0, startZoom.current + zoomDelta));
          }
        }
      },
      
      onPanResponderRelease: () => {
        // Cleanup if needed
      }
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>Arraste para girar • Pinça para zoom • Toque nos músculos</Text>
      </View>
      
      <View style={styles.content}>
        {/* 3D Model */}
        <View 
          style={[styles.canvasContainer, { backgroundColor: 'transparent' }]} 
          collapsable={false}
          {...panResponder.panHandlers}
        >
          <Canvas
            camera={{ position: [0, 0.5, 4.0], fov: 50 }}
            events={undefined} 
          >
            <CameraRig zoom={zoom} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 10, 5]} intensity={2.0} />
            <directionalLight position={[-5, 5, -5]} intensity={1.0} />
            <pointLight position={[0, 2, 3]} intensity={1.5} color="#ffffff" />
            
            <Suspense fallback={null}>
              <AnatomyModel 
                intensities={intensities} 
                rotationY={rotationY}
                selectedMuscle={selectedMuscle}
                onSelectMuscle={(m) => setSelectedMuscle(m === selectedMuscle ? null : m)}
                isAutoRotating={isAutoRotating}
              />
            </Suspense>
          </Canvas>

          {/* DEBUG OVERLAY - REMOVED */}
        </View>
        
        {/* Muscle Selection Menu */}
        <View style={styles.muscleMenu}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.muscleMenuContent}
          >
            {muscleGroups.map((muscle) => {
              const intensity = intensities[muscle.id] || 0;
              const isSelected = selectedMuscle === muscle.id;
              
              return (
                <TouchableOpacity
                  key={muscle.id}
                  style={[
                    styles.muscleButton,
                    isSelected && styles.muscleButtonSelected,
                  ]}
                  onPress={() => setSelectedMuscle(isSelected ? null : muscle.id)}
                >
                  <View style={styles.muscleButtonContent}>
                    <Ionicons 
                      name={muscle.icon} 
                      size={20} 
                      color={isSelected ? '#ff6b35' : '#a1a1aa'} 
                    />
                    <Text style={[
                      styles.muscleButtonText,
                      isSelected && styles.muscleButtonTextSelected,
                    ]}>
                      {muscle.label}
                    </Text>
                  </View>
                  
                  {/* Intensity Bar */}
                  <View style={styles.intensityBarContainer}>
                    <View 
                      style={[
                        styles.intensityBar,
                        { width: `${intensity * 100}%` }
                      ]} 
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
      
      <View style={styles.legend} pointerEvents="none">
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#1a1a1a' }]} />
          <Text style={styles.legendText}>Sem treino</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ff6b35' }]} />
          <Text style={styles.legendText}>Alta intensidade</Text>
        </View>
      </View>
    </View>
  );
}


// Preload the model from Google Drive
useGLTF.preload('https://drive.google.com/uc?export=download&id=1erWb8aMRMaOJgfsWmMlGQ9v-snMsCYXA');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  hint: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3f3f46',
    zIndex: 10,
  },
  hintText: {
    color: '#d4d4d8',
    fontSize: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  canvasContainer: {
    flex: 1,
  },
  muscleMenu: {
    width: 140,
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    borderLeftWidth: 1,
    borderLeftColor: '#3f3f46',
    paddingVertical: 60,
  },
  muscleMenuContent: {
    paddingHorizontal: 8,
    gap: 6,
  },
  muscleButton: {
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  muscleButtonSelected: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: '#ff6b35',
  },
  muscleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  muscleButtonText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  muscleButtonTextSelected: {
    color: '#ff6b35',
  },
  intensityBarContainer: {
    height: 3,
    backgroundColor: '#27272a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  intensityBar: {
    height: '100%',
    backgroundColor: '#ff6b35',
  },
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 16,
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3f3f46',
    zIndex: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    color: '#d4d4d8',
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 5,
  },
  loadingText: {
    color: '#ff6b35',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
  },
});
