# Tela de Dieta do Aluno – Documento de Design e Especificação Técnica (2025)

**App**: MeuPersonal  
**Objetivo**: Criar a tela de nutrição mais intuitiva e poderosa do mercado brasileiro para Personal Trainers.

---

## 📋 Visão Geral da Tela "Nutrição" (do lado do Personal Trainer)

**Caminho**: Dashboard → Alunos → [Nome do Aluno] → Aba "Nutrição"

**Layout principal**: Tabs horizontais fixas no topo (swipe habilitado)

| Aba                  | Nome exibido       | Prioridade |
|----------------------|--------------------|----------|
| 1                    | Hoje               | Alta     |
| 2                    | Dieta Completa     | Alta     |
| 3                    | Progresso          | Alta     |
| 4                    | Histórico          | Média    |

---

## 1. Aba "Hoje" (a mais usada pelo aluno e personal)

### Cabeçalho
```
Foto do aluno + Nome                    Peso atual: 78.4kg (↓ 1.2kg essa semana)
Botão grande: "Nova Avaliação Física"
```

### Card Macros do Dia
Fundo escuro com barras coloridas:
```
Proteína    178g / 200g    ████████░░  89%   (verde #00ff9d)
Carboidrato 215g / 250g    ███████░░░  86%   (azul #7f5aff)
Gordura      68g / 70g     █████████   97%   (amarelo #ffde59)
Calorias   2.620 / 2.800   ████████░░  93%
```

### Cronograma de Refeições
Cards expansíveis:
```
Café da manhã (580 kcal)               ✓ 5/5 itens
└─ Aveia 60g, Whey 30g, Banana média…

Lanche (320 kcal)                       ✓ 100%

Almoço (820 kcal)                       ⚠ Faltam 2 itens

Janta (650 kcal)                        — Não marcado

Ceia (250 kcal)                         — Não marcado
```

### Botão Flutuante FAB
Canto inferior direito: "+ Adicionar refeição extra" ou "Substituir alimento"

### Funcionalidades Inteligentes
- ✅ Aluno marca ✓ ou tira foto do prato (futuro IA)
- ✅ App recalcula macros reais vs planejado em tempo real
- ✅ Se desvio > 10% por 3+ dias → notificação automática pro personal
- ✅ Botão "Não comi isso" → abre lista de substituições com macros parecidas

---

## 2. Aba "Dieta Completa" (onde o personal edita tudo)

### Estrutura Semanal
```
Semana 3 (22/12 → 28/12)     [Copiar semana]  [+ Nova semana]

Segunda-feira                [Copiar dia]  [Colar dia]

┌─ Café da manhã – 600 kcal     [+ Alimento]     [Arrastar]
├─ Aveia 60g          240kcal  8p  40c  4g
├─ Whey isolado 30g   120kcal 25p   2c  1g
├─ Banana média       105kcal  1p  27c  0g
└─ Pasta de amendoim 10g

┌─ Almoço – 850 kcal
├─ Arroz integral 100g cozido
├─ Frango grelhado 200g
├─ Brócolis 200g
└─ Azeite extra virgem 10g

Totais do dia → 2.800 kcal | 200p | 250c | 70g
```

### Recursos Ninja que o Personal Vai Amar
- ✅ Digita "frango 180" → completa macros automaticamente
- ✅ Arrasta alimento de uma refeição pra outra
- ✅ Templates prontos: Bulking, Cutting, Low Carb, Cetogênica, Vegana
- ✅ Botão "Distribuir macros igualmente nos 7 dias"
- ✅ Substituição inteligente (clica no alimento → "Trocar por opções similares")

---

## 3. Aba "Progresso" (a que mais renova mensalidade)

### Gráficos
Últimos 6 meses – linha + barras:
- **Peso corporal**: 92kg → 78.4kg (-13.6kg)
- **% Gordura**: 24% → 14.8%
- **Cintura**: 102cm → 84cm (-18cm)

### Fotos Comparativas
Arrasta pro lado:
```
Antes → Semana 4 → Semana 8 → Hoje
```

### Tabela de Circunferências
```
Braço D/E:   34cm → 38cm (+4cm)
Peito:      108cm → 112cm
Cintura:     102cm → 84cm
Quadril:      98cm → 92cm
```

---

## 4. Aba "Histórico"

```
Versão 6 → 22/12/2025 (atual)
Versão 5 → 01/12/2025 – "Redução de 250kcal por estagnação de peso"
Versão 4 → 10/11/2025 – "Refeed +200kcal após 6 semanas"
Versão 3 → 20/10/2025 – "Início do cutting"
```

---

## 🛠️ Recursos Técnicos a Implementar

| Funcionalidade                        | Tecnologia sugerida                | Prioridade |
|---------------------------------------|------------------------------------|----------|
| Banco de 3500+ alimentos brasileiros | JSON/CSV → tabela Supabase         | Alta     |
| Cálculo TMB/TDEE                      | Fórmula Mifflin-St Jeor + fator atividade | Alta |
| Substituição inteligente              | Query com ±10% das macros          | Alta     |
| Check-in semanal obrigatório          | Bloqueia nova dieta se não preencher | Alta   |
| Notificações automáticas              | Expo Notifications + Cloud Functions | Alta  |
| Exportar dieta em PDF bonito          | react-native-html-to-pdf ou Print  | Média    |

---

## 🎨 Paleta de Cores (Dark Mode 2025)

```
Fundo principal:    #0f0f0f → #1a1a1a
Proteína:           #00ff9d (verde neon)
Carboidrato:        #7f5aff (roxo/azul)
Gordura:            #ffde59 (amarelo dourado)
Texto principal:    #ffffff
Texto secundário:   #aaaaaa
Sucesso:            #00ff9d
Alerta:             #ff6b6b
```

---

## 📊 Schema do Banco de Dados

### Tabelas Necessárias

#### `foods` (Alimentos)
```sql
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, -- Proteína, Carboidrato, Gordura, Vegetal, etc.
  serving_size NUMERIC, -- 100g padrão
  serving_unit TEXT, -- g, ml, unidade
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  fiber NUMERIC,
  source TEXT, -- TBCA, USDA, Manual
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `diet_plans` (Planos de Dieta)
```sql
CREATE TABLE diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  personal_id UUID REFERENCES profiles(id),
  name TEXT,
  start_date DATE,
  end_date DATE,
  target_calories NUMERIC,
  target_protein NUMERIC,
  target_carbs NUMERIC,
  target_fat NUMERIC,
  notes TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `diet_meals` (Refeições do Plano)
```sql
CREATE TABLE diet_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id UUID REFERENCES diet_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0-6 (Domingo-Sábado)
  meal_type TEXT, -- Café da manhã, Lanche, Almoço, Janta, Ceia
  meal_order INTEGER,
  name TEXT,
  target_calories NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `diet_meal_items` (Alimentos em cada Refeição)
```sql
CREATE TABLE diet_meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_meal_id UUID REFERENCES diet_meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  quantity NUMERIC,
  unit TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `diet_logs` (Registro do que o aluno comeu)
```sql
CREATE TABLE diet_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  diet_plan_id UUID REFERENCES diet_plans(id),
  diet_meal_id UUID REFERENCES diet_meals(id),
  logged_date DATE,
  completed BOOLEAN DEFAULT false,
  actual_items JSONB, -- Itens realmente consumidos
  notes TEXT,
  photo_url TEXT, -- Foto do prato (futuro)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `nutrition_progress` (Progresso Nutricional)
```sql
CREATE TABLE nutrition_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recorded_date DATE,
  weight NUMERIC,
  body_fat_percentage NUMERIC,
  waist_cm NUMERIC,
  chest_cm NUMERIC,
  arm_left_cm NUMERIC,
  arm_right_cm NUMERIC,
  thigh_left_cm NUMERIC,
  thigh_right_cm NUMERIC,
  hip_cm NUMERIC,
  photo_front_url TEXT,
  photo_side_url TEXT,
  photo_back_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🚀 Implementação Sugerida

### Fase 1: Fundação (Semana 1)
- [ ] Criar schema do banco de dados
- [ ] Importar banco de alimentos TBCA (3500+ itens)
- [ ] Criar tela de listagem de alunos com aba "Nutrição"
- [ ] Implementar cálculo TMB/TDEE

### Fase 2: Editor de Dieta (Semana 2)
- [ ] Tela "Dieta Completa" com drag-and-drop
- [ ] Busca e adição de alimentos
- [ ] Cálculo automático de macros
- [ ] Templates de dieta prontos
- [ ] Copiar/colar dias e semanas

### Fase 3: Visualização do Aluno (Semana 3)
- [ ] Aba "Hoje" com macros em tempo real
- [ ] Check-in de refeições
- [ ] Sistema de substituições inteligentes
- [ ] Notificações de desvio

### Fase 4: Progresso e Analytics (Semana 4)
- [ ] Aba "Progresso" com gráficos
- [ ] Upload de fotos comparativas
- [ ] Histórico de versões de dieta
- [ ] Exportação em PDF

---

## 💡 Diferenciais Competitivos

1. **Substituição Inteligente**: Aluno não gosta de brócolis? App sugere couve-flor com macros similares
2. **Templates Prontos**: Personal não perde tempo criando do zero
3. **Notificações Automáticas**: Personal é alertado se aluno desvia muito
4. **Fotos de Progresso**: Motivação visual é tudo
5. **Histórico de Versões**: Rastreabilidade completa das mudanças

---

## 📱 Fluxo de Navegação

### Personal Trainer
```
(tabs)/students → 
  students/[id] → 
    (tabs) Perfil | Treinos | Nutrição | Avaliações →
      nutrition/[studentId] →
        (tabs) Hoje | Dieta Completa | Progresso | Histórico
```

### Aluno
```
(tabs)/nutrition →
  (tabs) Hoje | Minha Dieta | Progresso
```

---

**Status**: 📋 Planejado (Fase 4 do Roadmap)

**Prioridade**: Alta

**Impacto no Negócio**: 🔥 Muito Alto - Funcionalidade premium que justifica assinatura
