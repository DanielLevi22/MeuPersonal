import * as THREE from "three";

// Maps muscle group names → GLB mesh names (Object_N, all lowercase).
// Assignment was derived from bounding-box centroids extracted from the model:
//   GLB-Z = height, GLB-Y = depth (>1 = back, <1 = front), GLB-X = lateral.
// Refine with the debug inspector at /dashboard/muscle-map-debug if needed.
export const MUSCLE_MESH_MAP: Record<string, string[]> = {
  Peitoral: ["object_0", "object_1", "object_27", "object_83", "object_84"],
  Costas: [
    "object_4",
    "object_5",
    "object_22",
    "object_23",
    "object_32",
    "object_33",
    "object_45",
    "object_60",
    "object_61",
    "object_78",
    "object_79",
    "object_80",
    "object_81",
    "object_86",
  ],
  Ombros: ["object_40", "object_67", "object_68"],
  Bíceps: ["object_48", "object_49"],
  Tríceps: ["object_62", "object_64"],
  Antebraço: ["object_24", "object_71", "object_72"],
  Abdômen: [
    "object_3",
    "object_6",
    "object_10",
    "object_14",
    "object_15",
    "object_17",
    "object_19",
    "object_31",
    "object_42",
    "object_44",
    "object_73",
    "object_76",
    "object_77",
  ],
  Glúteos: ["object_20", "object_26", "object_28", "object_30", "object_63", "object_82"],
  Quadríceps: ["object_2", "object_8", "object_9", "object_16", "object_18", "object_25"],
  Isquiotibiais: [
    "object_12",
    "object_13",
    "object_21",
    "object_29",
    "object_34",
    "object_39",
    "object_46",
    "object_47",
    "object_69",
    "object_70",
  ],
  Panturrilha: [
    "object_35",
    "object_36",
    "object_37",
    "object_38",
    "object_41",
    "object_43",
    "object_50",
    "object_51",
    "object_52",
    "object_53",
    "object_56",
    "object_57",
    "object_58",
    "object_59",
    "object_65",
    "object_66",
  ],
};

// Inverted map: meshName → muscle group
export const MESH_TO_MUSCLE = new Map<string, string>();
for (const [muscle, meshes] of Object.entries(MUSCLE_MESH_MAP)) {
  for (const mesh of meshes) {
    MESH_TO_MUSCLE.set(mesh.toLowerCase(), muscle);
  }
}

// Log-scale volume → emissive intensity per mesh
export function buildColorMap(
  volumeByMuscle: { muscle: string; volume: number }[],
): Map<string, { color: THREE.Color; emissiveIntensity: number; opacity: number }> {
  const map = new Map<string, { color: THREE.Color; emissiveIntensity: number; opacity: number }>();
  if (!volumeByMuscle.length) return map;

  const max = Math.max(...volumeByMuscle.map((m) => m.volume));

  for (const { muscle, volume } of volumeByMuscle) {
    const ratio = max > 0 ? Math.log1p(volume) / Math.log1p(max) : 0;

    let emissiveIntensity: number;
    let opacity: number;

    if (ratio < 0.25) {
      opacity = 0.35;
      emissiveIntensity = 0.05;
    } else if (ratio < 0.55) {
      opacity = 0.6;
      emissiveIntensity = 0.15;
    } else if (ratio < 0.8) {
      opacity = 0.82;
      emissiveIntensity = 0.3;
    } else {
      opacity = 1;
      emissiveIntensity = 0.5;
    }

    const meshNames = MUSCLE_MESH_MAP[muscle] ?? [];
    const entry = { color: new THREE.Color("#CCFF00"), emissiveIntensity, opacity };
    for (const mesh of meshNames) {
      map.set(mesh.toLowerCase(), entry);
    }
  }

  return map;
}
