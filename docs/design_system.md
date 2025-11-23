# Design System: Cyber-Fitness Premium

**Visão Geral:**
Uma identidade visual "State of the Art" que transmite alta performance, tecnologia e exclusividade. O design combina a profundidade do modo escuro com a energia vibrante do neon, utilizando glassmorphism para criar camadas e hierarquia.

## 1. Identidade Visual

### 🎨 Paleta de Cores
**Conceito:** "Dark Mode Profundo" com acentos de "Alta Voltagem".

| Token | Cor | Hex | Uso |
| :--- | :--- | :--- | :--- |
| **Background** | `Zinc 950` | `#09090B` | Fundo principal. Mais suave e elegante que o preto puro. |
| **Surface** | `Zinc 900` | `#18181B` | Cards e elementos de fundo secundários. |
| **Surface Glass** | `White/5` | `rgba(255,255,255,0.05)` | Efeito de vidro (backdrop-blur) para cards modernos. |
| **Primary** | `Neon Lime` | `#CCFF00` | **Ação Principal (CTA)**, destaques, badges de "Novo". Energia pura. |
| **Secondary** | `Cyber Blue` | `#00F0FF` | Elementos secundários, gráficos, tecnologia. |
| **Accent** | `Hot Pink` | `#FF0099` | Detalhes de gamificação, notificações urgentes. |
| **Text Main** | `White` | `#FFFFFF` | Títulos e textos de alta legibilidade. |
| **Text Muted** | `Zinc 400` | `#A1A1AA` | Textos de apoio, legendas. |

### 🔠 Tipografia
**Conceito:** Impacto nos títulos, clareza na leitura.

*   **Display (Títulos):** `Outfit` (Google Fonts).
    *   **Estilo:** Bold / ExtraBold.
    *   **Uso:** H1, H2, Hero Sections. Caixa alta (UPPERCASE) em momentos de impacto.
*   **Body (Texto):** `Inter` (Google Fonts).
    *   **Estilo:** Regular / Medium.
    *   **Uso:** Parágrafos, UI, Listas. Alta legibilidade em telas pequenas.

### 💠 UI Patterns (Padrões de Interface)

#### 1. Glassmorphism (Vidro)
*   Uso em cards sobrepostos a fundos complexos ou gradientes.
*   `bg-white/5 backdrop-blur-lg border border-white/10`

#### 2. Bento Grids
*   Layouts modulares onde cada funcionalidade é um "bloco" do grid.
*   Organiza muita informação de forma digerível e visualmente interessante.

#### 3. Spotlight & Glow
*   Gradientes sutis atrás de elementos importantes para dar destaque ("Glow").
*   Efeitos de iluminação ao passar o mouse (Hover).

---

## 2. Experiência por Persona

### 🏋️‍♂️ Personal Trainer (O Gestor)
*   **Foco:** Eficiência e Controle.
*   **Design:** Dashboards limpos (Bento Grid), dados claros, ações rápidas.
*   **Cor Principal:** `Neon Lime` (Crescimento, Dinheiro, Energia).

### 🥗 Nutricionista (O Especialista)
*   **Foco:** Detalhe e Cuidado.
*   **Design:** Listas organizadas, cards de refeição detalhados, fotos de alimentos vibrantes.
*   **Cor Principal:** `Cyber Blue` (Ciência, Confiança) + `Fresh Green` (Saúde).

### 🏃‍♂️ Aluno (O Atleta)
*   **Foco:** Motivação e Progresso.
*   **Design:** Gamificação forte, gráficos de evolução, badges brilhantes, timer imersivo.
*   **Cor Principal:** Dinâmica (muda conforme o nível/intensidade).

### 🆓 Freemium (O Visitante)
*   **Foco:** Conversão (Upsell).
*   **Design:** Visualização limitada mas "gostosa" do app.
*   **Pattern:** "Locked Content" com efeito de blur e cadeado brilhante, instigando a curiosidade.

---

## 3. Landing Page (A Vitrine)
*   **Objetivo:** "Wow Effect" imediato.
*   **Hero:** Título gigante, imagem do app "flutuando" com efeito 3D ou glow.
*   **Prova Social:** Logos de academias/parceiros em monocromático (Zinc 500).
*   **Features:** Grid interativo (Bento) mostrando as funcionalidades.
*   **CTA:** Botão `Neon Lime` com sombra colorida (`shadow-lime/50`).
