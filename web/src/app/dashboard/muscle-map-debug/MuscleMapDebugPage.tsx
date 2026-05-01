"use client";

import { OrbitControls, useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// ── Deterministic colour per mesh index ───────────────────────────────────────

function meshColor(index: number): THREE.Color {
  // Golden-ratio hue spread so colours are visually distinct
  const hue = (index * 0.618033988749895) % 1;
  return new THREE.Color().setHSL(hue, 0.85, 0.55);
}

// ── Coloured model ────────────────────────────────────────────────────────────

interface MeshInfo {
  name: string;
  index: number;
  color: string;
}

interface DebugBodyProps {
  onHover: (info: MeshInfo | null) => void;
  onPick: (info: MeshInfo) => void;
}

function DebugBody({ onHover, onPick }: DebugBodyProps) {
  const { scene } = useGLTF("/models/muscle-body.glb");
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Assign unique colour per mesh and track name→index mapping
  const meshList = useRef<MeshInfo[]>([]);

  useEffect(() => {
    const list: MeshInfo[] = [];
    let idx = 0;
    cloned.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const color = meshColor(idx);
      obj.material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.15,
        roughness: 0.6,
        metalness: 0,
      });
      list.push({ name: obj.name, index: idx, color: `#${color.getHexString()}` });
      idx++;
    });
    meshList.current = list;
  }, [cloned]);

  function getInfo(e: ThreeEvent<PointerEvent | MouseEvent>): MeshInfo | null {
    const mesh = e.object as THREE.Mesh;
    return meshList.current.find((m) => m.name === mesh.name) ?? null;
  }

  // Model is Z-up (Blender) — rotate to Three.js Y-up
  return (
    <primitive
      object={cloned}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(getInfo(e));
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const info = getInfo(e);
        if (info) onPick(info);
      }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const MUSCLE_GROUPS = [
  "Peitoral",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Antebraço",
  "Abdômen",
  "Glúteos",
  "Quadríceps",
  "Isquiotibiais",
  "Panturrilha",
  "Outros / Ignorar",
];

export default function MuscleMapDebugPage() {
  const [hovered, setHovered] = useState<MeshInfo | null>(null);
  const [picked, setPicked] = useState<MeshInfo | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  function assign(muscleGroup: string) {
    if (!picked) return;
    setMapping((prev) => ({ ...prev, [picked.name]: muscleGroup }));
    setPicked(null);
  }

  const mappedCount = Object.keys(mapping).length;

  const mappingCode = Object.entries(mapping)
    .filter(([, g]) => g !== "Outros / Ignorar")
    .reduce<Record<string, string[]>>((acc, [mesh, group]) => {
      if (!acc[group]) acc[group] = [];
      acc[group].push(mesh.toLowerCase());
      return acc;
    }, {});

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* 3D viewer */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, -10, 110], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "#09090b" }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[30, 20, 80]} intensity={1.4} />
          <directionalLight position={[-30, -5, 80]} intensity={0.5} />
          <directionalLight position={[0, -10, -80]} intensity={0.3} />
          <Suspense fallback={null}>
            <DebugBody onHover={setHovered} onPick={setPicked} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            minDistance={20}
            maxDistance={250}
            target={[0, -10, 0]}
          />
        </Canvas>

        {/* Hover tooltip */}
        {hovered && !picked && (
          <div className="absolute top-4 left-4 bg-zinc-900 border border-white/20 rounded-lg px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm border border-white/20"
                style={{ backgroundColor: hovered.color }}
              />
              <span className="font-mono text-white">{hovered.name}</span>
              <span className="text-zinc-400">#{hovered.index}</span>
            </div>
            {mapping[hovered.name] && (
              <p className="text-xs text-primary mt-1">→ {mapping[hovered.name]}</p>
            )}
            <p className="text-xs text-zinc-500 mt-1">Clique para atribuir músculo</p>
          </div>
        )}

        {/* Instruction overlay */}
        {!hovered && !picked && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-zinc-500 select-none">
            Passe o mouse para identificar · Clique para atribuir grupo muscular · {mappedCount}{" "}
            mapeados
          </div>
        )}
      </div>

      {/* Side panel */}
      <div className="w-72 bg-zinc-950 border-l border-white/10 flex flex-col overflow-hidden">
        {picked ? (
          /* Assignment panel */
          <div className="flex flex-col h-full p-4 gap-3">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <div
                className="w-5 h-5 rounded-sm border border-white/20"
                style={{ backgroundColor: picked.color }}
              />
              <div>
                <p className="font-mono text-sm text-white">{picked.name}</p>
                <p className="text-xs text-zinc-500">Selecione o grupo muscular</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto flex-1">
              {MUSCLE_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => assign(g)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/10 text-zinc-200 transition-colors"
                >
                  {g}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          /* Mapping progress panel */
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-semibold text-white text-sm">Inspector de Meshes</h2>
              <p className="text-xs text-zinc-500 mt-1">{mappedCount} / 87 mapeados</p>
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${(mappedCount / 87) * 100}%` }}
                />
              </div>
            </div>

            {/* Mapping summary */}
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(mappingCode).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-zinc-400 mb-2">Mapeamento atual:</p>
                  {Object.entries(mappingCode).map(([group, meshes]) => (
                    <div key={group} className="mb-2">
                      <p className="text-xs font-medium text-primary">{group}:</p>
                      <p className="text-xs font-mono text-zinc-400 break-all">
                        {meshes.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {mappingCode && Object.keys(mappingCode).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 mb-2">
                    Código para muscleMeshMap.ts:
                  </p>
                  <pre className="text-[10px] font-mono text-zinc-300 bg-zinc-900 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(mappingCode, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
