"use client";

import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { Canvas, useFrame } from "@react-three/fiber";
import { Component, type ReactNode, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { MuscleVolume } from "@/shared/hooks/useWorkoutMetrics";
import { buildColorMap, MESH_TO_MUSCLE, MUSCLE_MESH_MAP } from "./muscleMeshMap";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HoveredInfo {
  muscle: string;
  volume: number;
  pct: number;
}

interface MuscleBodyProps {
  colorMap: Map<string, { color: THREE.Color; emissiveIntensity: number; opacity: number }>;
  onHover: (info: HoveredInfo | null) => void;
  onSelect: (muscle: string | null) => void;
  selectedMuscle: string | null;
  volumeByMuscle: MuscleVolume[];
}

// ── Body mesh renderer ─────────────────────────────────────────────────────────

function MuscleBody({
  colorMap,
  onHover,
  onSelect,
  selectedMuscle,
  volumeByMuscle,
}: MuscleBodyProps) {
  const { scene } = useGLTF("/models/muscle-body.glb");
  const totalVolume = volumeByMuscle.reduce((s, m) => s + m.volume, 0);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // One-time: isolate materials per mesh so emissive can differ per mesh
  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.material = (obj.material as THREE.Material).clone();
    });
  }, [clonedScene]);

  // Apply emissive highlight based on volume data and current selection
  useEffect(() => {
    const selectedMeshes = new Set(
      (selectedMuscle ? (MUSCLE_MESH_MAP[selectedMuscle] ?? []) : []).map((n) => n.toLowerCase()),
    );

    clonedScene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const key = obj.name.toLowerCase();
      const entry = colorMap.get(key);
      const isSelected = selectedMeshes.has(key);
      const mat = obj.material as THREE.MeshStandardMaterial;
      if (!("emissive" in mat)) return;

      if (isSelected) {
        mat.emissive.set("#CCFF00");
        mat.emissiveIntensity = 1.2;
      } else if (entry) {
        mat.emissive.set("#CCFF00");
        mat.emissiveIntensity = entry.emissiveIntensity;
      } else {
        mat.emissive.set("#000000");
        mat.emissiveIntensity = 0;
      }
      mat.needsUpdate = true;
    });
  }, [clonedScene, colorMap, selectedMuscle]);

  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const muscle = MESH_TO_MUSCLE.get(mesh.name.toLowerCase());
    if (!muscle) return;
    const vol = volumeByMuscle.find((m) => m.muscle === muscle);
    onHover({
      muscle,
      volume: vol?.volume ?? 0,
      pct: totalVolume > 0 ? Math.round(((vol?.volume ?? 0) / totalVolume) * 100) : 0,
    });
  }

  // Model is exported Z-up (Blender default) — rotate to Three.js Y-up
  return (
    <primitive
      object={clonedScene}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={() => onHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const muscle = MESH_TO_MUSCLE.get((e.object as THREE.Mesh).name.toLowerCase());
        onSelect(muscle && muscle !== selectedMuscle ? muscle : null);
      }}
    />
  );
}

// ── Placeholder body ───────────────────────────────────────────────────────────

function PlaceholderBody() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.3;
  });

  const mat = new THREE.MeshStandardMaterial({
    color: "#27272a",
    roughness: 0.8,
    transparent: true,
    opacity: 0.7,
  });

  return (
    <group ref={groupRef} position={[0, -10, 0]} scale={16}>
      <mesh position={[0, 1.75, 0]} material={mat}>
        <sphereGeometry args={[0.18, 16, 16]} />
      </mesh>
      <mesh position={[0, 1.1, 0]} material={mat}>
        <boxGeometry args={[0.52, 0.7, 0.28]} />
      </mesh>
      <mesh position={[0, 0.68, 0]} material={mat}>
        <boxGeometry args={[0.44, 0.3, 0.25]} />
      </mesh>
      <mesh position={[-0.38, 1.05, 0]} rotation={[0, 0, 0.3]} material={mat}>
        <cylinderGeometry args={[0.075, 0.065, 0.55, 12]} />
      </mesh>
      <mesh position={[0.38, 1.05, 0]} rotation={[0, 0, -0.3]} material={mat}>
        <cylinderGeometry args={[0.075, 0.065, 0.55, 12]} />
      </mesh>
      <mesh position={[-0.14, 0.2, 0]} material={mat}>
        <cylinderGeometry args={[0.1, 0.09, 0.5, 12]} />
      </mesh>
      <mesh position={[0.14, 0.2, 0]} material={mat}>
        <cylinderGeometry args={[0.1, 0.09, 0.5, 12]} />
      </mesh>
      <mesh position={[-0.14, -0.28, 0]} material={mat}>
        <cylinderGeometry args={[0.07, 0.055, 0.45, 12]} />
      </mesh>
      <mesh position={[0.14, -0.28, 0]} material={mat}>
        <cylinderGeometry args={[0.07, 0.055, 0.45, 12]} />
      </mesh>
      <Html position={[0, -0.75, 0]} center>
        <div className="text-xs text-muted-foreground bg-surface border border-white/10 rounded-lg px-3 py-1.5 whitespace-nowrap">
          Adicione o modelo em <code className="text-primary">public/models/muscle-body.glb</code>
        </div>
      </Html>
    </group>
  );
}

// ── Error boundary ────────────────────────────────────────────────────────────

class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function GLBBody(props: MuscleBodyProps) {
  return (
    <ModelErrorBoundary fallback={<PlaceholderBody />}>
      <Suspense fallback={<PlaceholderBody />}>
        <MuscleBody {...props} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  const stops = [
    { label: "Sem dados", color: "rgba(39,39,42,0.5)" },
    { label: "Baixo", color: "rgba(204,255,0,0.35)" },
    { label: "Médio", color: "rgba(204,255,0,0.65)" },
    { label: "Alto", color: "rgba(204,255,0,0.85)" },
    { label: "Máximo", color: "#CCFF00" },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">Volume:</span>
      <div className="flex items-center gap-1.5">
        {stops.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <div
              className="w-5 h-5 rounded-sm border border-white/10"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[9px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

interface MuscleMapViewerProps {
  volumeByMuscle: MuscleVolume[];
  selectedMuscle: string | null;
  onMuscleSelect?: (muscle: string | null) => void;
}

export function MuscleMapViewer({
  volumeByMuscle,
  selectedMuscle,
  onMuscleSelect,
}: MuscleMapViewerProps) {
  const colorMap = useMemo(() => buildColorMap(volumeByMuscle), [volumeByMuscle]);

  // Tooltip state is hover-only — no need for screen pos, use CSS absolute pointer
  const hoverRef = useRef<HoveredInfo | null>(null);

  return (
    <div className="bg-surface border border-white/10 rounded-xl overflow-hidden">
      <div className="relative h-[600px] w-full">
        <Canvas
          camera={{ position: [0, -10, -110], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[30, 20, -80]} intensity={1.4} />
          <directionalLight position={[-30, -5, -80]} intensity={0.5} />
          <directionalLight position={[0, 20, 80]} intensity={0.3} />
          <hemisphereLight args={["#1a1a2e", "#09090b", 0.4]} />

          <GLBBody
            colorMap={colorMap}
            onHover={(info) => {
              hoverRef.current = info;
            }}
            onSelect={(muscle) => onMuscleSelect?.(muscle)}
            selectedMuscle={selectedMuscle}
            volumeByMuscle={volumeByMuscle}
          />

          <OrbitControls
            enablePan={false}
            minDistance={20}
            maxDistance={250}
            target={[0, -10, 0]}
          />
        </Canvas>

        {/* Selected muscle badge */}
        {selectedMuscle && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold shadow-lg">
            <span>{selectedMuscle}</span>
            <button
              type="button"
              onClick={() => onMuscleSelect?.(null)}
              className="hover:opacity-70 transition-opacity"
            >
              ✕
            </button>
          </div>
        )}

        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground/50 select-none">
          Arraste para girar · Scroll para zoom
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-3 flex items-center justify-between">
        <Legend />
        {selectedMuscle && (
          <p className="text-xs text-muted-foreground">
            Selecionado: <span className="text-primary font-semibold">{selectedMuscle}</span>
          </p>
        )}
      </div>
    </div>
  );
}
