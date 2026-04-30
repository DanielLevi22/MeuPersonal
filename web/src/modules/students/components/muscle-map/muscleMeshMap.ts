import * as THREE from "three";

// Maps exercise.muscle_group (DB values) → mesh names inside the GLB model.
// One DB group can map to multiple meshes (e.g. back → lats + traps).
export const MUSCLE_MESH_MAP: Record<string, string[]> = {
  Peitoral: ["chest", "pectoralis"],
  Costas: ["lats", "latissimus", "traps", "trapezius", "rhomboids"],
  Ombros: ["deltoid", "deltoids", "shoulder"],
  Bíceps: ["biceps", "bicep"],
  Tríceps: ["triceps", "tricep"],
  Antebraço: ["forearms", "forearm"],
  Abdômen: ["abs", "abdomen", "obliques", "core"],
  Glúteos: ["glutes", "gluteus", "glute"],
  Quadríceps: ["quads", "quadriceps"],
  Isquiotibiais: ["hamstrings", "hamstring"],
  Panturrilha: ["calves", "calf", "gastrocnemius"],
};

// Inverted map: meshName → muscle_group (DB)
export const MESH_TO_MUSCLE = new Map<string, string>();
for (const [muscle, meshes] of Object.entries(MUSCLE_MESH_MAP)) {
  for (const mesh of meshes) {
    MESH_TO_MUSCLE.set(mesh.toLowerCase(), muscle);
  }
}

// Volume percentile thresholds → color + emissive intensity
export function buildColorMap(
  volumeByMuscle: { muscle: string; volume: number }[],
): Map<string, { color: THREE.Color; emissiveIntensity: number; opacity: number }> {
  const map = new Map<string, { color: THREE.Color; emissiveIntensity: number; opacity: number }>();
  if (!volumeByMuscle.length) return map;

  const volumes = volumeByMuscle.map((m) => m.volume);
  const max = Math.max(...volumes);

  for (const { muscle, volume } of volumeByMuscle) {
    // Log-scale normalisation so small volumes still show
    const ratio = max > 0 ? Math.log1p(volume) / Math.log1p(max) : 0;

    let opacity: number;
    let emissiveIntensity: number;

    if (ratio < 0.25) {
      opacity = 0.35;
      emissiveIntensity = 0;
    } else if (ratio < 0.55) {
      opacity = 0.6;
      emissiveIntensity = 0.05;
    } else if (ratio < 0.8) {
      opacity = 0.82;
      emissiveIntensity = 0.15;
    } else {
      opacity = 1;
      emissiveIntensity = 0.4;
    }

    const meshNames = MUSCLE_MESH_MAP[muscle] ?? [];
    const entry = { color: new THREE.Color("#CCFF00"), emissiveIntensity, opacity };
    for (const mesh of meshNames) {
      map.set(mesh.toLowerCase(), entry);
    }
  }

  return map;
}
