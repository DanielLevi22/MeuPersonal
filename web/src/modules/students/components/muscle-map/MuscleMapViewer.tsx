"use client";

import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { MuscleVolume } from "@/shared/hooks/useWorkoutMetrics";
import { buildColorMap, MESH_TO_MUSCLE } from "./muscleMeshMap";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HoveredInfo {
  muscle: string;
  volume: number;
  pct: number;
  screenPos: { x: number; y: number };
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
  const { camera, gl } = useThree();
  const totalVolume = volumeByMuscle.reduce((s, m) => s + m.volume, 0);

  // Clone scene so materials are independent per instance
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const key = obj.name.toLowerCase();
      const entry = colorMap.get(key);

      const mat = new THREE.MeshStandardMaterial({
        color: entry ? entry.color : new THREE.Color("#3f3f46"),
        emissive: entry ? entry.color : new THREE.Color("#000000"),
        emissiveIntensity: entry ? entry.emissiveIntensity : 0,
        transparent: true,
        opacity: entry ? entry.opacity : 0.35,
        roughness: 0.7,
        metalness: 0.1,
      });
      obj.material = mat;
    });
  }, [clonedScene, colorMap]);

  function getScreenPos(mesh: THREE.Mesh) {
    const pos = new THREE.Vector3();
    mesh.getWorldPosition(pos);
    pos.project(camera);
    const w = gl.domElement.clientWidth;
    const h = gl.domElement.clientHeight;
    return { x: ((pos.x + 1) / 2) * w, y: ((-pos.y + 1) / 2) * h };
  }

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
      screenPos: getScreenPos(mesh),
    });
  }

  return (
    <primitive
      object={clonedScene}
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

// ── Placeholder body (shown while GLB loads or when model not yet added) ───────

function PlaceholderBody() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.3;
  });

  const neutralMat = new THREE.MeshStandardMaterial({
    color: "#27272a",
    roughness: 0.8,
    transparent: true,
    opacity: 0.7,
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 1.75, 0]} material={neutralMat}>
        <sphereGeometry args={[0.18, 16, 16]} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.1, 0]} material={neutralMat}>
        <boxGeometry args={[0.52, 0.7, 0.28]} />
      </mesh>
      {/* Abs */}
      <mesh position={[0, 0.68, 0]} material={neutralMat}>
        <boxGeometry args={[0.44, 0.3, 0.25]} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.38, 1.05, 0]} rotation={[0, 0, 0.3]} material={neutralMat}>
        <cylinderGeometry args={[0.075, 0.065, 0.55, 12]} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.38, 1.05, 0]} rotation={[0, 0, -0.3]} material={neutralMat}>
        <cylinderGeometry args={[0.075, 0.065, 0.55, 12]} />
      </mesh>
      {/* Left forearm */}
      <mesh position={[-0.5, 0.68, 0]} rotation={[0, 0, 0.6]} material={neutralMat}>
        <cylinderGeometry args={[0.055, 0.045, 0.45, 12]} />
      </mesh>
      {/* Right forearm */}
      <mesh position={[0.5, 0.68, 0]} rotation={[0, 0, -0.6]} material={neutralMat}>
        <cylinderGeometry args={[0.055, 0.045, 0.45, 12]} />
      </mesh>
      {/* Left thigh */}
      <mesh position={[-0.14, 0.2, 0]} material={neutralMat}>
        <cylinderGeometry args={[0.1, 0.09, 0.5, 12]} />
      </mesh>
      {/* Right thigh */}
      <mesh position={[0.14, 0.2, 0]} material={neutralMat}>
        <cylinderGeometry args={[0.1, 0.09, 0.5, 12]} />
      </mesh>
      {/* Left shin */}
      <mesh position={[-0.14, -0.28, 0]} material={neutralMat}>
        <cylinderGeometry args={[0.07, 0.055, 0.45, 12]} />
      </mesh>
      {/* Right shin */}
      <mesh position={[0.14, -0.28, 0]} material={neutralMat}>
        <cylinderGeometry args={[0.07, 0.055, 0.45, 12]} />
      </mesh>

      {/* Awaiting model label */}
      <Html position={[0, -0.75, 0]} center>
        <div className="text-xs text-muted-foreground bg-surface border border-white/10 rounded-lg px-3 py-1.5 whitespace-nowrap">
          Adicione o modelo em <code className="text-primary">public/models/muscle-body.glb</code>
        </div>
      </Html>
    </group>
  );
}

// ── GLB body wrapper with error boundary fallback ─────────────────────────────

function GLBBody(props: MuscleBodyProps) {
  return (
    <Suspense fallback={<PlaceholderBody />}>
      <MuscleBody {...props} />
    </Suspense>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  const stops = [
    { label: "Sem dados", color: "rgba(39,39,42,0.7)" },
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
  onMuscleSelect?: (muscle: string | null) => void;
}

export function MuscleMapViewer({ volumeByMuscle, onMuscleSelect }: MuscleMapViewerProps) {
  const [hovered, setHovered] = useState<HoveredInfo | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const colorMap = useMemo(() => buildColorMap(volumeByMuscle), [volumeByMuscle]);

  function handleSelect(muscle: string | null) {
    setSelectedMuscle(muscle);
    onMuscleSelect?.(muscle);
  }

  return (
    <div className="bg-surface border border-white/10 rounded-xl overflow-hidden">
      {/* Canvas */}
      <div className="relative h-[600px] w-full">
        <Canvas
          camera={{ position: [0, 1.2, 3], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} />
          <hemisphereLight args={["#1a1a2e", "#09090b", 0.5]} />

          <GLBBody
            colorMap={colorMap}
            onHover={setHovered}
            onSelect={handleSelect}
            selectedMuscle={selectedMuscle}
            volumeByMuscle={volumeByMuscle}
          />

          <OrbitControls
            enablePan={false}
            minDistance={1.5}
            maxDistance={5}
            minPolarAngle={Math.PI * 0.1}
            maxPolarAngle={Math.PI * 0.9}
            target={[0, 1, 0]}
          />
        </Canvas>

        {/* Tooltip */}
        {hovered && (
          <div
            className="absolute pointer-events-none z-10 bg-surface border border-white/15 rounded-lg px-3 py-2 shadow-xl"
            style={{ left: hovered.screenPos.x + 12, top: hovered.screenPos.y - 20 }}
          >
            <p className="text-sm font-bold text-foreground">{hovered.muscle}</p>
            {hovered.volume > 0 ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {hovered.volume.toLocaleString("pt-BR")} kg·rep
                </p>
                <p className="text-xs text-primary font-semibold">{hovered.pct}% do volume total</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Sem dados no período</p>
            )}
          </div>
        )}

        {/* Selected muscle badge */}
        {selectedMuscle && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold">
            <span>{selectedMuscle}</span>
            <button
              onClick={() => handleSelect(null)}
              className="hover:opacity-70 transition-opacity"
            >
              ✕
            </button>
          </div>
        )}

        {/* Drag hint */}
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground/50 select-none">
          Arraste para girar · Scroll para zoom
        </div>
      </div>

      {/* Footer legend */}
      <div className="border-t border-white/10 px-6 py-3 flex items-center justify-between">
        <Legend />
        {selectedMuscle && (
          <p className="text-xs text-muted-foreground">
            Gráfico de carga filtrado por{" "}
            <span className="text-primary font-semibold">{selectedMuscle}</span>
          </p>
        )}
      </div>
    </div>
  );
}
