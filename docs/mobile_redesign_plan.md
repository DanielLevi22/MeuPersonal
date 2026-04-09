# 📱 Mobile Redesign Action Plan

## 🎯 Objetivo
Redesenhar o aplicativo móvel para alinhar com a identidade visual "Cyber Fitness" do sistema web, migrar estilos legados (`StyleSheet`) para **Tailwind CSS (NativeWind)** e melhorar a UX geral.

## 🎨 Diretrizes de Design (Energy Gradient System)
- **Fundo**: `Background Deep Black` (#0A0A0A)
- **Cards**: `bg-zinc-900` com bordas `border-zinc-800`
- **Texto**: Primário (Branco), Secundário (Zinc 400), Muted (Zinc 500)
- **Paleta Ativa**:
    - Primário: `Energy Gradient` (Laranja 🔥 Rosa)
    - Secundário: `Electric Blue` (#00D9FF)
    - Acento: `Vibrant Purple` (#9D4EDD)
- **Tipografia**: Outfit (Títulos/Display) e Inter (Corpo/Sans).

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
| **Dashboard** | `index.tsx` | [/] Em Progresso | Redesign "Mission Control", cards Bento, destaque para treino do dia. |
| **Treinos** | `workouts/index.tsx` | [x] Concluído | Cards `PremiumCard`, filtros `MuscleFilterCarousel`, Energy Gradient. |
| **Nutrição** | `nutrition/index.tsx` | [ ] Próxima Fase | Visualização de macros circular, fotos das refeições maiores, thumbnails. |
| **Progresso** | `progress.tsx` | [ ] Pendente | Ajustar cores para o Energy Gradient, manter gráficos avançados. |
| **Ranking** | `ranking.tsx` | [ ] Pendente | Destacar top 3 com avatares grandes, animação de subida. |
| **Perfil** | `profile.tsx` | [ ] Pendente | Header premium, lista de conquistas em grid vertical. |

### 💪 Fluxo de Treino (`apps/mobile/src/modules/workout`)
| Tela | Arquivo | Status | Melhorias UX |
| :--- | :--- | :--- | :--- |
| **Detalhes do Treino**| `WorkoutDetailsScreen`| [x] Concluído | Slideshow de músculos, cards de exercícios premium. |
| **Periodização** | `PeriodizationsScreen` | [x] Concluído | Cards temáticos, Jornada do Aluno, Roadmap visual. |
| **Detalhes da Fase** | `PhaseDetailsScreen` | [x] Concluído | Header premium, Import from Library, Smart Filters. |

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

## 📅 Roadmap Atualizado (Engenharia de Elite)

1.  **Fundação Premium**: Componentes `PremiumCard`, `StatusBadge` e `MuscleFilterCarousel`. (CONCLUÍDO)
2.  **Workout & Planning Flow**: Harmonização completa dos módulos de Treino e Periodização. (CONCLUÍDO)
3.  **Phase 1: Dashboard "Mission Control"**: Reformular a Home para alunos e profissionais com layout Bento e atalhos inteligentes. (PRÓXIMO)
4.  **Phase 2: Nutrição Premium**: Implementar thumbnails visuais e redesign dos cards de macros e refeições.
5.  **Phase 3: Gamificação Avançada**: Visual overhaul no sistema de conquistas, ofensivas (streaks) e ranking.
6.  **Auth & Profile**: Polimento final no fluxo de entrada e perfil do usuário.
