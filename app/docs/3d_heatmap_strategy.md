# Estratégia de Implementação: Mapa de Calor Corporal 3D

## Objetivo
Visualizar os grupos musculares treinados pelo aluno em um modelo humano 3D interativo, onde as áreas "quentes" (mais treinadas) brilham ou mudam de cor.

## Stack Tecnológica
- **Motor de Renderização**: `@react-three/fiber` (React ecosystem for Three.js).
- **Contexto WebGL**: `expo-gl` (Integração com Expo).
- **Utilitários**: `@react-three/drei` (Controles de câmera, carregamento de modelos).

## Arquitetura da Solução

### 1. Modelo 3D (Asset)
Para que o mapa de calor funcione, o modelo 3D precisa ser **segmentado**.
- **Requisito**: Um arquivo `.glb` ou `.gltf` onde cada músculo (ou grupo muscular) é uma `Mesh` separada e nomeada.
- **Exemplo de Nomenclatura**: `Mesh_Pectoralis`, `Mesh_Biceps_L`, `Mesh_Quadriceps_R`.
- **Estratégia de Fallback**: Se não encontrarmos um modelo segmentado gratuito de qualidade:
    - Usar primitivas (esferas/cubos) posicionadas no espaço 3D para representar os músculos (estética "Low Poly Abstract").
    - Ou usar uma abordagem híbrida com "Billboards" (imagens 2D que sempre olham para a câmera) brilhantes sobre um modelo base.

### 2. Componentes

#### `BodyHeatmapScreen`
Tela principal que busca os dados de treino do aluno.
- **Input**: Histórico de treinos dos últimos 7-30 dias.
- **Processamento**: Calcula a frequência de treino por grupo muscular (`Peito: 5`, `Costas: 2`).
- **Output**: Passa um objeto de intensidades para o componente 3D.

#### `AnatomyViewer` (Canvas)
O container 3D.
- Configura luzes (`AmbientLight`, `SpotLight`).
- Configura câmera e controles (`OrbitControls`) para permitir rotação e zoom.

#### `MuscleModel`
O componente que carrega e renderiza o `.glb`.
- **Lógica**: Percorre os nós do modelo GLTF.
- **Mapeamento**:
    - `App Muscle ('Peito')` -> `3D Mesh Name ('Pectoralis')`.
- **Estilização Dinâmica**:
    - Altera a propriedade `material.emissive` ou `material.color` baseada na intensidade recebida.
    - Ex: "Peito" com alta frequência = Vermelho/Laranja brilhante. Sem treino = Cinza escuro.

## Passos de Implementação

1.  **Configuração de Ambiente**: Instalar dependências (`three`, `expo-gl`, etc).
2.  **Prototipagem**: Criar a tela com um modelo simples (ex: um cubo) para garantir que o `@react-three/fiber` está rodando no dispositivo.
3.  **Desenvolvimento do Modelo**: Importar o modelo humano.
4.  **Integração de Dados**: Conectar com o Supabase para colorir o modelo baseado no histórico real.

## Riscos e Mitigações
- **Performance**: Modelos muito pesados podem travar em Androids antigos.
    - *Solução*: Usar modelos "Low Poly" (< 20k triângulos).
- **Navegação**: O contexto GL pode ser perdido ao trocar de abas.
    - *Solução*: Gerenciar o ciclo de vida do componente ou usar navegação simples.
