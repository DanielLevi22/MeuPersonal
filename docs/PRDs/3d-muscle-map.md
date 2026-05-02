# PRD: 3D Muscle Map

**Data de criação:** 2026-04-30
**Status:** approved
**Branch:** feature/3d-muscle-map
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Visualizador 3D interativo de um corpo humano anatômico no web dashboard, onde os grupos musculares ficam coloridos com intensidade proporcional ao volume treinado pelo aluno no período selecionado. O profissional pode girar o modelo livremente, fazer hover para ver detalhes por músculo, e clicar em um músculo para filtrar os dados de evolução de carga daquele grupo.

### Por quê?
Hoje o profissional só consegue comunicar o que foi trabalhado com dados em texto e gráficos de barras. Um corpo 3D colorido por intensidade de treino é imediatamente compreensível — o aluno vê na hora se está desequilibrado (ex: muito peitoral, pouco posterior), quais fibras um exercício específico recrutou, e onde ele evoluiu no período. Isso transforma a reunião de feedback de análise de planilha em uma experiência visual e persuasiva, diferencial de produto frente a concorrentes.

### Como saberemos que está pronto?
- [ ] Modelo 3D carrega na página de métricas do aluno com músculos visíveis e rotação suave via drag
- [ ] Músculos com volume > 0 no período selecionado aparecem coloridos em gradiente #CCFF00 (mais escuro = mais volume)
- [ ] Músculos sem dados ficam em estado neutro (cinza translúcido), não ocultos
- [ ] Hover em qualquer músculo exibe tooltip com: nome do músculo, volume (kg·rep) e % do volume total
- [ ] Seletor de período (90 / 180 / 365 dias) atualiza as cores do modelo sem recarregar a página
- [ ] Ao clicar em um músculo, o gráfico "Evolução de Carga" abaixo filtra para os exercícios daquele grupo
- [ ] Funciona em desktop e tablet (sem suporte mobile nesta entrega)
- [ ] Lint + typecheck limpos; sem erro de console

---

## Contexto

A página de métricas do aluno (`/dashboard/students/[id]/metrics`) foi implementada com heatmap, radar, donut e interactive line chart. Todos esses charts são planos e estáticos do ponto de vista de comunicação muscular. O profissional não tem como mostrar visualmente ao aluno quais fibras um exercício recruta ou onde está o desequilíbrio, sem imagens externas ou explicação verbal.

Os dados já existem: `workout_session_sets` tem `reps_actual` e `weight_actual` por série, e `workout_session_exercises` tem `exercise_id` linkado a `exercises.muscle_group`. O `useWorkoutMetrics` hook já agrega `volumeByMuscle`. O único dado novo necessário é o mapeamento de `muscle_group` (string do banco) para os nomes dos meshes no modelo 3D.

---

## Escopo

### Incluído
- Componente `MuscleMapViewer` (web only) com modelo GLB carregado via `useGLTF`
- Coloração dos meshes em runtime baseada em `volumeByMuscle` do hook existente
- OrbitControls: rotação com drag, zoom com scroll, reset de câmera com duplo clique
- Tooltip on hover: nome, volume, percentual do total
- Clique em músculo: emite evento `onMuscleSelect(muscleGroup)` para filtrar o `LoadEvolutionChart`
- Seletor de período integrado ao existente (90 / 180 / 365 dias)
- Skeleton de loading enquanto o modelo GLB carrega
- Arquivo de modelo GLB armazenado em `web/public/models/muscle-body.glb`
- Mapa de correspondência `muscle_group` (DB) → nome do mesh no GLB (`MUSCLE_MESH_MAP`)
- Integração na tab "Treinos" da `StudentMetricsPage`, acima dos charts existentes

### Fora do escopo (explicitamente)
- Suporte mobile (React Native) — incompatibilidade de libs WebGL
- Vista frontal/dorsal separada — o modelo 3D com OrbitControls já supre
- Animações de contração muscular
- Comparação entre dois períodos lado a lado
- Highlight por exercício individual (apenas por grupo muscular nesta entrega)
- Edição ou anotação sobre o modelo pelo profissional
- Exportar imagem/PDF do modelo colorido
- Suporte a múltiplos modelos (masculino/feminino)

---

## Navegação

```
StudentDetailsPage  (/dashboard/students/[id])
  └── card "Mapa Muscular"  →  /dashboard/students/[id]/muscle-map
        └── MuscleMapPage
```

O Mapa Muscular é uma **página dedicada**, não embutida na página de métricas. O card aparece na grade de módulos do aluno (ao lado de Treinos, Nutrição, Métricas, etc.).

## Arquitetura de componentes

```
MuscleMapPage  (/dashboard/students/[id]/muscle-map)
  ├── [header: Voltar + nome do aluno]
  ├── [seletor de período: 90 / 180 / 365 dias]
  ├── [tabs: Frontal | Dorsal]  (ou rotação livre — ver decisões técnicas)
  ├── MuscleMapViewer          ← componente principal
  │     ├── Canvas (R3F, full-height)
  │     │     ├── PerspectiveCamera
  │     │     ├── OrbitControls
  │     │     ├── ambientLight + directionalLight + hemisphereLight
  │     │     ├── MuscleBody (GLTF meshes coloridos dinamicamente)
  │     │     └── Html overlay (tooltip on hover via @react-three/drei)
  │     └── [legenda: escala de cor — Menos ▒▒▒▒ Mais]
  └── [painel lateral: top 5 músculos mais trabalhados no período]
```

---

## Fluxo de dados

```
Profissional abre /dashboard/students/[id]/metrics
  → useWorkoutMetrics(studentId, days)
      → SELECT workout_sessions + workout_session_exercises + workout_session_sets + exercises
      ← { volumeByMuscle: [{ muscle: string, volume: number }] }
  → MuscleMapViewer recebe volumeByMuscle como prop
  → buildColorMap(volumeByMuscle)
      → normaliza volumes em escala 0–1 (log scale)
      → mapeia muscle_group → meshName via MUSCLE_MESH_MAP
      ← Map<meshName, { color: THREE.Color, opacity: number }>
  → MuscleBody itera meshes do GLB
      → se mesh.name ∈ colorMap → aplica MeshStandardMaterial com color + emissive
      → senão → material neutro (cinza translúcido)

Hover:
  Usuário move cursor sobre mesh
  → onPointerOver(event) → setHovered(mesh.name)
  → Tooltip renderiza via @react-three/drei <Html>
      → lookup volumeByMuscle pelo mesh.name
      ← "Peitoral — 12.400 kg·rep (18% do total)"

Clique:
  Usuário clica em músculo
  → onClick → onMuscleSelect(muscleGroup)
  → LoadEvolutionChart filtra useExercisesWithHistory por exercises.muscle_group
```

---

## Modelo 3D

### Requisitos do arquivo GLB
- Meshes **nomeados** por grupo muscular (cada grupo = mesh separado)
- Formato GLTF 2.0 / GLB (single file, sem texturas externas)
- Tamanho alvo: < 5 MB (comprimido com Draco se necessário)
- Pose: T-pose ou A-pose, vista frontal centralizada

### Grupos musculares mínimos necessários
Os nomes dos meshes no GLB devem ser mapeáveis para os `muscle_group` do banco:

| muscle_group (DB)  | Mesh(es) esperados no GLB            |
|--------------------|---------------------------------------|
| `Peitoral`         | `chest`                               |
| `Costas`           | `lats`, `traps`, `rhomboids`          |
| `Ombros`           | `deltoid_front`, `deltoid_rear`       |
| `Bíceps`           | `biceps`                              |
| `Tríceps`          | `triceps`                             |
| `Antebraço`        | `forearms`                            |
| `Abdômen`          | `abs`, `obliques`                     |
| `Glúteos`          | `glutes`                              |
| `Quadríceps`       | `quads`                               |
| `Isquiotibiais`    | `hamstrings`                          |
| `Panturrilha`      | `calves`                              |
| `Outros`           | *(sem highlight — cai no neutro)*     |

### Fonte recomendada para o modelo
- **Sketchfab** com licença CC BY ou CC0 — buscar "anatomy muscle body low poly"
- **Mixamo** — modelos com boa segmentação, licença livre para projetos comerciais
- **Alternativa:** modelo low-poly customizado exportado do Blender com meshes nomeados manualmente

> O modelo GLB deve ser adquirido/preparado antes do início da implementação.
> Colocar em `web/public/models/muscle-body.glb`.

---

## Stack técnica

| Lib | Versão alvo | Papel |
|-----|-------------|-------|
| `@react-three/fiber` | ^8 | Renderer React para Three.js |
| `@react-three/drei` | ^9 | OrbitControls, Html tooltip, useGLTF, Suspense helpers |
| `three` | ^0.160 | Engine 3D |
| `three-stdlib` | peer | Tipos e utilidades |

> Nenhuma lib mobile é necessária — web only.

---

## Esquema de cores

Baseado no design system existente (`--primary: #CCFF00`):

| Nível de atividade | Cor aplicada | Critério |
|--------------------|-------------|---------|
| Sem dados          | `#27272A` opacity 0.4 | volume = 0 |
| Baixo (1–25%)      | `rgba(204,255,0, 0.30)` | volume < p25 |
| Médio (25–75%)     | `rgba(204,255,0, 0.65)` | volume entre p25–p75 |
| Alto (75–95%)      | `rgba(204,255,0, 0.85)` | volume entre p75–p95 |
| Máximo (top 5%)    | `#CCFF00` + emissive glow | volume > p95 |

Escala logarítmica para não achatar grupos com volume muito diferente.

---

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `workout_sessions` | SELECT | Filtra por student_id + período |
| `workout_session_exercises` | SELECT | JOIN para obter exercise_id |
| `workout_session_sets` | SELECT | reps_actual × weight_actual = volume |
| `exercises` | SELECT | muscle_group para mapeamento ao mesh |

Nenhuma migration necessária — os dados já existem.

---

## Impacto em outros módulos

- `StudentMetricsPage` — adiciona `MuscleMapViewer` e conecta `onMuscleSelect` ao `LoadEvolutionChart`
- `LoadEvolutionChart` — recebe nova prop `muscleGroupFilter?: string` para filtrar exercícios mostrados no dropdown
- `useExercisesWithHistory` — adicionar filtro opcional por `muscle_group` quando `muscleGroupFilter` estiver definido
- `useWorkoutMetrics` — sem mudança (já retorna `volumeByMuscle`)

---

## Decisões técnicas

**React Three Fiber, não Three.js direto:** R3F é declarativo e se integra ao ciclo de vida do React. `@react-three/drei` entrega OrbitControls, Html overlay e useGLTF sem boilerplate. Alternativa (vanilla Three.js + useRef) exigiria imperative code e gestão manual de lifecycle — mais frágil em Next.js App Router.

**Modelo GLB externo, não geometria procedural:** Um corpo humano em boxes/cilindros não comunica anatomia — o usuário perderia a referência visual imediata. O custo de obter um modelo adequado (gratuito ou < $50) é justificado pelo impacto UX. Geometria procedural fica como fallback de último recurso.

**Escala logarítmica para cores:** Volume muscular varia ordens de magnitude (peito pode ter 50k kg·rep, antebraço 2k). Escala linear deixaria grupos pequenos invisíveis. Log scale preserva distinção visual em todos os grupos.

**`onMuscleSelect` como prop callback, não estado global:** O estado de músculo selecionado é UI local da tab de treinos — não justifica Zustand. Prop drilling de um nível (`WorkoutMetricsTab → LoadEvolutionChart`) é suficiente.

**Draco compression para o GLB:** Modelos anatômicos tendem a ter alta contagem de polígonos. Draco reduz o arquivo em ~70% com qualidade visual equivalente. `@react-three/drei` suporta Draco natively via `useGLTF`.

---

## Checklist de done

> Só muda o Status para `done` quando TODOS estão marcados.

- [ ] Modelo GLB adquirido, nomeado e colocado em `web/public/models/muscle-body.glb`
- [ ] `MUSCLE_MESH_MAP` configurado e todos os `muscle_group` do banco têm correspondência
- [ ] `MuscleMapViewer` renderiza e rotaciona sem erros de console
- [ ] Cores atualizam corretamente ao trocar o período (90/180/365 dias)
- [ ] Hover mostra tooltip com nome, volume e percentual
- [ ] Clique em músculo filtra o `LoadEvolutionChart`
- [ ] `useExercisesWithHistory` aceita filtro por `muscle_group`
- [ ] Skeleton de loading exibido enquanto GLB carrega
- [ ] Lint + typecheck limpos
- [ ] Funciona em Chrome, Firefox e Safari desktop
- [ ] PR mergeado em `development`
- [ ] `docs/features/3d-muscle-map.md` criado
- [ ] `docs/STATUS.md` atualizado
