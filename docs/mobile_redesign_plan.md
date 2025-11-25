# 📱 Mobile Redesign Action Plan

## 🎯 Objetivo
Redesenhar o aplicativo móvel para alinhar com a identidade visual "Cyber Fitness" do sistema web, migrar estilos legados (`StyleSheet`) para **Tailwind CSS (NativeWind)** e melhorar a UX geral.

## 🎨 Diretrizes de Design (Web Parity)
- **Fundo**: `bg-background` (Zinc 950 - #09090B)
- **Cards**: `bg-surface` (Zinc 900) com borda `border-surface-highlight` (Zinc 800)
- **Texto**: `text-foreground` (Zinc 50) e `text-muted-foreground` (Zinc 400)
- **Acentos**:
    - Primário: `text-primary` (Neon Lime)
    - Secundário: `text-secondary` (Cyber Blue)
    - Acento: `text-accent` (Hot Pink)
- **Tipografia**: Usar fontes `font-sans` (Inter) e `font-display` (Outfit) via classes.

---

## 📋 Lista de Telas & Status

### 🔐 Autenticação (`apps/mobile/src/app/(auth)`)
| Tela | Arquivo | Status | Melhorias UX |
| :--- | :--- | :--- | :--- |
| **Login** | `login.tsx` | [ ] Pendente | Adicionar gradiente de fundo, inputs com estilo "glass", feedback tátil ao errar senha. |
| **Registro** | `register.tsx` | [ ] Pendente | Dividir em steps se for longo, validação em tempo real. |
| **Recuperar Senha** | `forgot-password.tsx` | [ ] Pendente | Mensagem clara de email enviado, botão de voltar acessível. |
| **Seleção de Perfil** | `onboarding/role-selection.tsx` | [ ] Pendente | Cards grandes selecionáveis com ícones e descrições claras. |

### 🏠 Dashboard & Abas (`apps/mobile/src/app/(tabs)`)
| Tela | Arquivo | Status | Melhorias UX |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `index.tsx` | [ ] Pendente | Remover "blob" antigo, usar cards limpos, destacar "Ação do Dia". |
| **Treinos** | `workouts.tsx` | [ ] Pendente | Lista com filtros (chips), cards de treino com dificuldade visual. |
| **Nutrição** | `nutrition.tsx` | [ ] Pendente | Visualização de macros circular, fotos das refeições maiores. |
| **Progresso** | `progress.tsx` | [ ] Pendente | Gráficos já implementados, ajustar cores para o novo tema. |
| **Ranking** | `ranking.tsx` | [ ] Pendente | Destacar top 3 com avatares grandes, animação ao subir de posição. |
| **Perfil** | `profile.tsx` | [ ] Pendente | Header com foto e nível RPG, lista de conquistas em grid horizontal. |

### 💪 Fluxo de Treino (`apps/mobile/src/app/student`)
| Tela | Arquivo | Status | Melhorias UX |
| :--- | :--- | :--- | :--- |
| **Detalhes do Treino** | `workout-detail.tsx` | [ ] Pendente | Visão geral clara dos exercícios, botão "Iniciar" flutuante (FAB). |
| **Execução** | `workout-execute/[id].tsx` | [ ] Pendente | Modo imersivo (já iniciado), garantir contraste alto para leitura rápida. |
| **Detalhes Exercício** | `exercise-detail.tsx` | [ ] Pendente | Vídeo em destaque, histórico de cargas recente. |

---

## 🛠️ Tarefas Técnicas

### 1. Configuração Global
- [ ] **Atualizar `global.css`**: Copiar variáveis CSS do Web (`apps/web/src/app/globals.css`).
- [ ] **Configurar Fontes**: Garantir que Inter e Outfit estejam carregando corretamente.

### 2. Componentes Base (Refatorar para Tailwind)
- [ ] `Button`: Criar variantes (default, outline, ghost, destructive).
- [ ] `Input`: Estilo padrão com ring de foco.
- [ ] `Card`: Container padrão com borda e fundo.
- [ ] `ScreenLayout`: Wrapper padrão com SafeArea e fundo correto.

### 3. Migração Gradual
A migração será feita tela por tela, removendo `StyleSheet.create` e substituindo por classes `className`.

---

## 📅 Roadmap Sugerido

1.  **Fundação**: Configurar `global.css` e componentes base.
2.  **Auth**: Redesenhar fluxo de entrada (primeira impressão).
3.  **Core**: Redesenhar Dashboard e Abas principais.
4.  **Detalhes**: Redesenhar telas internas (Treino, Nutrição).
