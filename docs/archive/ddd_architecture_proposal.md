# 🎯 Arquitetura DDD - MeuPersonal
## Proposta de Arquitetura Semântica Baseada em Domain-Driven Design

> [!IMPORTANT]
> Este documento propõe uma reestruturação completa do sistema para que **tudo respire o domínio**. Cada tabela, cada classe, cada função deve refletir a linguagem do negócio.

---

## 📚 Índice

1. [Linguagem Ubíqua](#linguagem-ubíqua)
2. [Bounded Contexts](#bounded-contexts)
3. [Agregados e Entidades](#agregados-e-entidades)
4. [Reestruturação do Banco de Dados](#reestruturação-do-banco-de-dados)
5. [Arquitetura de Código](#arquitetura-de-código)
6. [Plano de Migração](#plano-de-migração)

---

## 🗣️ Linguagem Ubíqua

### **Termos do Domínio**

A linguagem ubíqua é a base do DDD. Todos os termos devem ser consistentes entre código, banco de dados e conversas de negócio.

#### **Atores (Pessoas)**

| Termo Técnico Atual | Termo do Domínio | Descrição |
|---------------------|------------------|-----------|
| `user` / `profile` | **Pessoa** (`Person`) | Qualquer usuário do sistema |
| `professional` | **Profissional** (`Professional`) | Personal, Nutricionista, Fisioterapeuta |
| `personal` | **PersonalTrainer** | Profissional de educação física |
| `nutritionist` | **Nutricionista** (`Nutritionist`) | Profissional de nutrição |
| `student` / `client` | **Aluno** (`Student`) | Pessoa sendo treinada/acompanhada |
| `managed_student` | **AlunoAcompanhado** (`ManagedStudent`) | Aluno com profissional |
| `autonomous_student` | **AlunoAutonomo** (`AutonomousStudent`) | Aluno sem profissional |

#### **Relacionamentos**

| Termo Técnico Atual | Termo do Domínio | Descrição |
|---------------------|------------------|-----------|
| `client_professional_relationships` | **Acompanhamento** (`Coaching`) | Relação profissional-aluno |
| `students_personals` | ❌ **ELIMINAR** | Duplicado de Acompanhamento |
| `relationship_status` | **StatusAcompanhamento** | Status do acompanhamento |

#### **Treino e Periodização**

| Termo Técnico Atual | Termo do Domínio | Descrição |
|---------------------|------------------|-----------|
| `periodization` | **Periodizacao** (`TrainingPeriodization`) | Planejamento de longo prazo |
| `training_plan` | **PlanoDeTreino** (`TrainingPlan`) | Plano semanal/mensal |
| `workout` | **Treino** (`Workout`) | Sessão de treino |
| `exercise` | **Exercicio** (`Exercise`) | Exercício individual |
| `workout_session` | **SessaoDeTreino** (`WorkoutSession`) | Execução de um treino |
| `workout_set_logs` | **RegistroDeSerieExecutada** (`ExecutedSetLog`) | Log de série executada |

#### **Nutrição**

| Termo Técnico Atual | Termo do Domínio | Descrição |
|---------------------|------------------|-----------|
| `diet_plan` | **PlanoDeDieta** (`DietPlan`) | Plano nutricional |
| `meal` | **Refeicao** (`Meal`) | Refeição |
| `food` | **Alimento** (`Food`) | Alimento/ingrediente |
| `diet_log` | **RegistroDeRefeicao** (`MealLog`) | Log de refeição consumida |

#### **Gamificação**

| Termo Técnico Atual | Termo do Domínio | Descrição |
|---------------------|------------------|-----------|
| `daily_goals` | **MetaDiaria** (`DailyGoal`) | Meta do dia |
| `achievements` | **Conquista** (`Achievement`) | Conquista desbloqueada |
| `student_streaks` | **Sequencia** (`Streak`) | Sequência de dias |
| `leaderboard_scores` | **PontuacaoRanking** (`RankingScore`) | Pontuação no ranking |

---

## 🎯 Bounded Contexts

DDD organiza o sistema em **contextos delimitados**. Cada contexto tem sua própria linguagem e modelos.

### **1. Contexto de Identidade e Acesso** (`Identity & Access`)

**Responsabilidade:** Gerenciar quem são as pessoas e o que podem fazer.

**Entidades:**
- `Pessoa` (Person)
- `Profissional` (Professional)
- `Aluno` (Student)
- `Administrador` (Administrator)

**Value Objects:**
- `Email`
- `CPF`
- `CREF` (registro profissional)
- `CRN` (registro nutricionista)

**Agregado Raiz:** `Pessoa`

```typescript
// Domain Model
class Pessoa {
  id: UUID
  email: Email
  nomeCompleto: string
  tipo: TipoPessoa // PROFISSIONAL | ALUNO | ADMIN
  
  // Métodos de domínio
  tornarProfissional(registro: RegistroProfissional): Profissional
  tornarAluno(): Aluno
}

class Profissional extends Pessoa {
  especialidades: Especialidade[] // PERSONAL | NUTRICIONISTA
  cref?: CREF
  crn?: CRN
  
  podeAcompanharAluno(): boolean
  podecriarTreino(): boolean
  podeCriarDieta(): boolean
}

class Aluno extends Pessoa {
  peso?: number
  altura?: number
  dataNascimento?: Date
  
  temAcompanhamento(): boolean
  estaAtivo(): boolean
}
```

---

### **2. Contexto de Acompanhamento** (`Coaching`)

**Responsabilidade:** Gerenciar a relação entre profissionais e alunos.

**Entidades:**
- `Acompanhamento` (Coaching)
- `ServicoOferecido` (OfferedService)

**Value Objects:**
- `StatusAcompanhamento` (PENDENTE | ATIVO | PAUSADO | ENCERRADO)
- `TipoServico` (PERSONAL_TRAINING | NUTRICAO)

**Agregado Raiz:** `Acompanhamento`

```typescript
class Acompanhamento {
  id: UUID
  profissional: Profissional
  aluno: Aluno
  servico: TipoServico
  status: StatusAcompanhamento
  dataInicio: Date
  dataFim?: Date
  
  // Métodos de domínio
  iniciar(): void
  pausar(motivo: string): void
  reativar(): void
  encerrar(motivo: string): void
  
  // Regras de negócio
  podeSerPausado(): boolean {
    return this.status === StatusAcompanhamento.ATIVO
  }
}
```

---

### **3. Contexto de Treinamento** (`Training`)

**Responsabilidade:** Gerenciar periodizações, planos e execução de treinos.

**Entidades:**
- `Periodizacao` (TrainingPeriodization)
- `PlanoDeTreino` (TrainingPlan)
- `Treino` (Workout)
- `Exercicio` (Exercise)
- `SessaoDeTreino` (WorkoutSession)

**Value Objects:**
- `ObjetivoPeriodizacao` (HIPERTROFIA | EMAGRECIMENTO | CONDICIONAMENTO)
- `DivisaoTreino` (ABC | ABCD | UPPER_LOWER | PUSH_PULL_LEGS)
- `StatusPeriodizacao` (RASCUNHO | ATIVA | CONCLUIDA)

**Agregado Raiz:** `Periodizacao`

```typescript
class Periodizacao {
  id: UUID
  aluno: Aluno
  profissional: Profissional
  nome: string
  objetivo: ObjetivoPeriodizacao
  dataInicio: Date
  dataFim: Date
  status: StatusPeriodizacao
  planos: PlanoDeTreino[]
  
  // Métodos de domínio
  adicionarPlano(plano: PlanoDeTreino): void
  ativar(): void
  concluir(): void
  
  // Regras de negócio
  podeSerAtivada(): boolean {
    return this.planos.length > 0 && this.status === StatusPeriodizacao.RASCUNHO
  }
  
  estaDentroDoPeriodo(data: Date): boolean {
    return data >= this.dataInicio && data <= this.dataFim
  }
}

class PlanoDeTreino {
  id: UUID
  periodizacao: Periodizacao
  nome: string
  divisao: DivisaoTreino
  frequenciaSemanal: number
  treinos: Treino[]
  
  adicionarTreino(treino: Treino): void
  validar(): boolean
}

class Treino {
  id: UUID
  nome: string
  diaSemana: DiaSemana
  exercicios: ExercicioDoTreino[]
  
  adicionarExercicio(exercicio: ExercicioDoTreino): void
  calcularVolumeTotal(): number
}

class SessaoDeTreino {
  id: UUID
  treino: Treino
  aluno: Aluno
  dataExecucao: Date
  seriesExecutadas: SerieExecutada[]
  feedback?: FeedbackTreino
  
  // Métodos de domínio
  registrarSerie(serie: SerieExecutada): void
  concluir(feedback: FeedbackTreino): void
  calcularCargaTotal(): number
}
```

---

### **4. Contexto de Nutrição** (`Nutrition`)

**Responsabilidade:** Gerenciar planos alimentares e acompanhamento nutricional.

**Entidades:**
- `PlanoDeDieta` (DietPlan)
- `Refeicao` (Meal)
- `Alimento` (Food)
- `RegistroDeRefeicao` (MealLog)

**Value Objects:**
- `TipoDieta` (UNICA | CICLICA)
- `TipoRefeicao` (CAFE | ALMOCO | JANTAR | LANCHE)
- `MacroNutrientes` (proteinas, carboidratos, gorduras)

**Agregado Raiz:** `PlanoDeDieta`

```typescript
class PlanoDeDieta {
  id: UUID
  aluno: Aluno
  nutricionista: Profissional
  nome: string
  tipo: TipoDieta
  dataInicio: Date
  dataFim: Date
  metasCalorias: number
  metasMacros: MacroNutrientes
  refeicoes: Refeicao[]
  
  // Métodos de domínio
  adicionarRefeicao(refeicao: Refeicao): void
  calcularCaloriasTotais(): number
  calcularMacrosTotais(): MacroNutrientes
  
  // Regras de negócio
  estaDentroDosMacros(): boolean {
    const totais = this.calcularMacrosTotais()
    return totais.proteinas >= this.metasMacros.proteinas * 0.9
  }
}

class Refeicao {
  id: UUID
  nome: string
  tipo: TipoRefeicao
  horario?: string
  alimentos: AlimentoDaRefeicao[]
  
  calcularCalorias(): number
  calcularMacros(): MacroNutrientes
}

class RegistroDeRefeicao {
  id: UUID
  aluno: Aluno
  refeicao: Refeicao
  dataConsumo: Date
  alimentosConsumidos: AlimentoConsumido[]
  
  calcularAderencia(): number // % de aderência ao plano
}
```

---

### **5. Contexto de Gamificação** (`Gamification`)

**Responsabilidade:** Engajar alunos com metas, conquistas e rankings.

**Entidades:**
- `MetaDiaria` (DailyGoal)
- `Conquista` (Achievement)
- `Sequencia` (Streak)

**Value Objects:**
- `TipoMeta` (TREINO | DIETA | AGUA | PASSOS)
- `TipoConquista` (BRONZE | PRATA | OURO | PLATINA)

**Agregado Raiz:** `PerfilGamificacao`

```typescript
class PerfilGamificacao {
  aluno: Aluno
  nivel: number
  xp: number
  conquistas: Conquista[]
  sequencias: Sequencia[]
  
  // Métodos de domínio
  ganharXP(quantidade: number): void
  desbloquearConquista(conquista: Conquista): void
  atualizarSequencia(tipo: TipoMeta): void
  
  // Regras de negócio
  calcularNivel(): number {
    return Math.floor(this.xp / 1000) + 1
  }
}

class MetaDiaria {
  id: UUID
  aluno: Aluno
  data: Date
  tipo: TipoMeta
  valorMeta: number
  valorAtual: number
  concluida: boolean
  
  atualizar(valor: number): void
  verificarConclusao(): void
}
```

---

### **6. Contexto de Comunicação** (`Communication`)

**Responsabilidade:** Facilitar comunicação entre profissionais e alunos.

**Entidades:**
- `Conversa` (Conversation)
- `Mensagem` (Message)

**Agregado Raiz:** `Conversa`

```typescript
class Conversa {
  id: UUID
  profissional: Profissional
  aluno: Aluno
  mensagens: Mensagem[]
  ultimaMensagemEm: Date
  
  enviarMensagem(remetente: Pessoa, conteudo: string): Mensagem
  marcarComoLida(mensagem: Mensagem): void
  contarNaoLidas(pessoa: Pessoa): number
}
```

---

## 🗄️ Reestruturação do Banco de Dados

### **Proposta de Schema Semântico**

```mermaid
erDiagram
    %% CONTEXTO: IDENTIDADE
    PESSOA {
        uuid id PK
        text email UK
        text nome_completo
        text telefone
        enum tipo_pessoa "PROFISSIONAL | ALUNO | ADMIN"
        timestamp criado_em
    }
    
    PROFISSIONAL {
        uuid id PK FK
        text nome_profissional
        text biografia
        text cref
        text crn
        boolean verificado
        timestamp verificado_em
    }
    
    ALUNO {
        uuid id PK FK
        numeric peso
        numeric altura
        date data_nascimento
        text genero
        text observacoes
    }
    
    %% CONTEXTO: ACOMPANHAMENTO
    ACOMPANHAMENTO {
        uuid id PK
        uuid profissional_id FK
        uuid aluno_id FK
        enum tipo_servico "PERSONAL_TRAINING | NUTRICAO"
        enum status "PENDENTE | ATIVO | PAUSADO | ENCERRADO"
        date data_inicio
        date data_fim
        text motivo_encerramento
    }
    
    %% CONTEXTO: TREINAMENTO
    PERIODIZACAO {
        uuid id PK
        uuid aluno_id FK
        uuid profissional_id FK
        text nome
        enum objetivo "HIPERTROFIA | EMAGRECIMENTO | CONDICIONAMENTO"
        date data_inicio
        date data_fim
        enum status "RASCUNHO | ATIVA | CONCLUIDA"
    }
    
    PLANO_DE_TREINO {
        uuid id PK
        uuid periodizacao_id FK
        text nome
        enum divisao "ABC | ABCD | UPPER_LOWER | PUSH_PULL_LEGS"
        int frequencia_semanal
        date data_inicio
        date data_fim
    }
    
    TREINO {
        uuid id PK
        uuid plano_id FK
        text nome
        text descricao
        enum dia_semana "SEG | TER | QUA | QUI | SEX | SAB | DOM"
    }
    
    EXERCICIO_DO_TREINO {
        uuid id PK
        uuid treino_id FK
        uuid exercicio_id FK
        int ordem
        int series
        text repeticoes
        int descanso_segundos
        text observacoes
    }
    
    SESSAO_DE_TREINO {
        uuid id PK
        uuid treino_id FK
        uuid aluno_id FK
        timestamp data_execucao
        timestamp concluido_em
        int avaliacao_dificuldade
        int avaliacao_energia
        text feedback
    }
    
    SERIE_EXECUTADA {
        uuid id PK
        uuid sessao_id FK
        uuid exercicio_treino_id FK
        int numero_serie
        int repeticoes_executadas
        numeric carga_kg
        int rpe
    }
    
    %% CONTEXTO: NUTRIÇÃO
    PLANO_DE_DIETA {
        uuid id PK
        uuid aluno_id FK
        uuid nutricionista_id FK
        text nome
        enum tipo "UNICA | CICLICA"
        date data_inicio
        date data_fim
        int meta_calorias
        int meta_proteinas
        int meta_carboidratos
        int meta_gorduras
    }
    
    REFEICAO {
        uuid id PK
        uuid plano_dieta_id FK
        text nome
        enum tipo "CAFE | ALMOCO | JANTAR | LANCHE"
        int dia_semana
        time horario
        int ordem
    }
    
    ALIMENTO_DA_REFEICAO {
        uuid id PK
        uuid refeicao_id FK
        uuid alimento_id FK
        numeric quantidade
        text unidade
    }
    
    REGISTRO_DE_REFEICAO {
        uuid id PK
        uuid aluno_id FK
        uuid refeicao_id FK
        date data_consumo
        timestamp registrado_em
    }
    
    %% CONTEXTO: GAMIFICAÇÃO
    META_DIARIA {
        uuid id PK
        uuid aluno_id FK
        date data
        enum tipo "TREINO | DIETA | AGUA | PASSOS"
        int valor_meta
        int valor_atual
        boolean concluida
    }
    
    CONQUISTA {
        uuid id PK
        uuid aluno_id FK
        text chave_conquista
        enum tipo "BRONZE | PRATA | OURO | PLATINA"
        timestamp desbloqueada_em
    }
    
    SEQUENCIA {
        uuid id PK
        uuid aluno_id FK
        enum tipo "TREINO | DIETA"
        int dias_consecutivos
        date ultima_atualizacao
    }
    
    %% RELACIONAMENTOS
    PESSOA ||--o| PROFISSIONAL : "pode ser"
    PESSOA ||--o| ALUNO : "pode ser"
    PROFISSIONAL ||--o{ ACOMPANHAMENTO : "oferece"
    ALUNO ||--o{ ACOMPANHAMENTO : "recebe"
    ALUNO ||--o{ PERIODIZACAO : "possui"
    PROFISSIONAL ||--o{ PERIODIZACAO : "cria"
    PERIODIZACAO ||--o{ PLANO_DE_TREINO : "contém"
    PLANO_DE_TREINO ||--o{ TREINO : "contém"
    TREINO ||--o{ EXERCICIO_DO_TREINO : "contém"
    TREINO ||--o{ SESSAO_DE_TREINO : "gera"
    SESSAO_DE_TREINO ||--o{ SERIE_EXECUTADA : "contém"
    ALUNO ||--o{ PLANO_DE_DIETA : "possui"
    PROFISSIONAL ||--o{ PLANO_DE_DIETA : "cria"
    PLANO_DE_DIETA ||--o{ REFEICAO : "contém"
    REFEICAO ||--o{ ALIMENTO_DA_REFEICAO : "contém"
    ALUNO ||--o{ REGISTRO_DE_REFEICAO : "registra"
    ALUNO ||--o{ META_DIARIA : "possui"
    ALUNO ||--o{ CONQUISTA : "possui"
    ALUNO ||--o{ SEQUENCIA : "possui"
```

---

## 💻 Arquitetura de Código

### **Estrutura de Pastas DDD**

```
packages/
├── domain/                          # Camada de Domínio (Puro)
│   ├── identity/                   # Bounded Context: Identidade
│   │   ├── entities/
│   │   │   ├── Pessoa.ts
│   │   │   ├── Profissional.ts
│   │   │   └── Aluno.ts
│   │   ├── value-objects/
│   │   │   ├── Email.ts
│   │   │   ├── CREF.ts
│   │   │   └── CPF.ts
│   │   └── repositories/
│   │       └── IPessoaRepository.ts
│   │
│   ├── coaching/                   # Bounded Context: Acompanhamento
│   │   ├── entities/
│   │   │   └── Acompanhamento.ts
│   │   ├── value-objects/
│   │   │   ├── StatusAcompanhamento.ts
│   │   │   └── TipoServico.ts
│   │   └── repositories/
│   │       └── IAcompanhamentoRepository.ts
│   │
│   ├── training/                   # Bounded Context: Treinamento
│   │   ├── aggregates/
│   │   │   └── Periodizacao.ts
│   │   ├── entities/
│   │   │   ├── PlanoDeTreino.ts
│   │   │   ├── Treino.ts
│   │   │   └── SessaoDeTreino.ts
│   │   ├── value-objects/
│   │   │   ├── ObjetivoPeriodizacao.ts
│   │   │   └── DivisaoTreino.ts
│   │   └── repositories/
│   │       └── IPeriodizacaoRepository.ts
│   │
│   ├── nutrition/                  # Bounded Context: Nutrição
│   │   ├── aggregates/
│   │   │   └── PlanoDeDieta.ts
│   │   ├── entities/
│   │   │   ├── Refeicao.ts
│   │   │   └── RegistroDeRefeicao.ts
│   │   └── repositories/
│   │       └── IPlanoDeDietaRepository.ts
│   │
│   └── gamification/               # Bounded Context: Gamificação
│       ├── aggregates/
│       │   └── PerfilGamificacao.ts
│       ├── entities/
│       │   ├── MetaDiaria.ts
│       │   └── Conquista.ts
│       └── repositories/
│           └── IPerfilGamificacaoRepository.ts
│
├── application/                     # Camada de Aplicação
│   ├── use-cases/
│   │   ├── training/
│   │   │   ├── CriarPeriodizacao.ts
│   │   │   ├── AtivarPeriodizacao.ts
│   │   │   └── RegistrarSessaoDeTreino.ts
│   │   ├── nutrition/
│   │   │   ├── CriarPlanoDeDieta.ts
│   │   │   └── RegistrarRefeicao.ts
│   │   └── coaching/
│   │       ├── IniciarAcompanhamento.ts
│   │       └── EncerrarAcompanhamento.ts
│   └── services/
│       ├── NotificationService.ts
│       └── GamificationService.ts
│
└── infrastructure/                  # Camada de Infraestrutura
    ├── database/
    │   ├── supabase/
    │   │   ├── PessoaRepository.ts
    │   │   ├── PeriodizacaoRepository.ts
    │   │   └── PlanoDeDietaRepository.ts
    │   └── migrations/
    └── external/
        ├── email/
        └── storage/
```

### **Exemplo de Implementação**

```typescript
// domain/training/aggregates/Periodizacao.ts
export class Periodizacao {
  private constructor(
    public readonly id: UUID,
    public readonly alunoId: UUID,
    public readonly profissionalId: UUID,
    public nome: string,
    public objetivo: ObjetivoPeriodizacao,
    public dataInicio: Date,
    public dataFim: Date,
    private _status: StatusPeriodizacao,
    private _planos: PlanoDeTreino[] = []
  ) {}
  
  // Factory Method
  static criar(
    alunoId: UUID,
    profissionalId: UUID,
    nome: string,
    objetivo: ObjetivoPeriodizacao,
    dataInicio: Date,
    dataFim: Date
  ): Periodizacao {
    // Validações de domínio
    if (dataFim <= dataInicio) {
      throw new DomainError('Data fim deve ser posterior à data início')
    }
    
    return new Periodizacao(
      UUID.generate(),
      alunoId,
      profissionalId,
      nome,
      objetivo,
      dataInicio,
      dataFim,
      StatusPeriodizacao.RASCUNHO
    )
  }
  
  // Métodos de domínio
  adicionarPlano(plano: PlanoDeTreino): void {
    if (this._status !== StatusPeriodizacao.RASCUNHO) {
      throw new DomainError('Só é possível adicionar planos em periodizações em rascunho')
    }
    
    this._planos.push(plano)
  }
  
  ativar(): void {
    if (this._planos.length === 0) {
      throw new DomainError('Periodização precisa ter pelo menos um plano para ser ativada')
    }
    
    this._status = StatusPeriodizacao.ATIVA
  }
  
  get status(): StatusPeriodizacao {
    return this._status
  }
  
  get planos(): readonly PlanoDeTreino[] {
    return this._planos
  }
}

// application/use-cases/training/CriarPeriodizacao.ts
export class CriarPeriodizacao {
  constructor(
    private periodizacaoRepo: IPeriodizacaoRepository,
    private alunoRepo: IAlunoRepository
  ) {}
  
  async execute(input: CriarPeriodizacaoInput): Promise<Periodizacao> {
    // Validar que aluno existe
    const aluno = await this.alunoRepo.buscarPorId(input.alunoId)
    if (!aluno) {
      throw new ApplicationError('Aluno não encontrado')
    }
    
    // Criar agregado de domínio
    const periodizacao = Periodizacao.criar(
      input.alunoId,
      input.profissionalId,
      input.nome,
      input.objetivo,
      input.dataInicio,
      input.dataFim
    )
    
    // Persistir
    await this.periodizacaoRepo.salvar(periodizacao)
    
    return periodizacao
  }
}
```

---

## 📋 Plano de Migração

### **Fase 1: Consolidação de Tabelas (Semana 1-2)**

#### **Ações:**

1. **Consolidar `students` em `profiles`**
   ```sql
   -- Renomear profiles para pessoa
   ALTER TABLE profiles RENAME TO pessoa;
   
   -- Adicionar campos de aluno
   ALTER TABLE pessoa
     ADD COLUMN peso NUMERIC,
     ADD COLUMN altura NUMERIC,
     ADD COLUMN data_nascimento DATE,
     ADD COLUMN genero TEXT,
     ADD COLUMN observacoes TEXT;
   
   -- Migrar dados de students
   UPDATE pessoa p
   SET 
     peso = s.weight,
     altura = s.height,
     observacoes = s.notes
   FROM students s
   WHERE p.id = s.id;
   
   -- Remover tabela students
   DROP TABLE students CASCADE;
   ```

2. **Renomear `client_professional_relationships` para `acompanhamento`**
   ```sql
   ALTER TABLE client_professional_relationships RENAME TO acompanhamento;
   ALTER TABLE acompanhamento RENAME COLUMN client_id TO aluno_id;
   ALTER TABLE acompanhamento RENAME COLUMN professional_id TO profissional_id;
   ALTER TABLE acompanhamento RENAME COLUMN service_category TO tipo_servico;
   ALTER TABLE acompanhamento RENAME COLUMN relationship_status TO status;
   ```

3. **Eliminar `students_personals`**
   ```sql
   DROP TABLE students_personals CASCADE;
   ```

### **Fase 2: Renomeação Semântica (Semana 3-4)**

```sql
-- Contexto de Treinamento
ALTER TABLE periodizations RENAME TO periodizacao;
ALTER TABLE training_plans RENAME TO plano_de_treino;
ALTER TABLE workouts RENAME TO treino;
ALTER TABLE workout_sessions RENAME TO sessao_de_treino;
ALTER TABLE workout_set_logs RENAME TO serie_executada;

-- Contexto de Nutrição
ALTER TABLE diet_plans RENAME TO plano_de_dieta;
ALTER TABLE meals RENAME TO refeicao;
ALTER TABLE foods RENAME TO alimento;
ALTER TABLE diet_logs RENAME TO registro_de_refeicao;

-- Contexto de Gamificação
ALTER TABLE daily_goals RENAME TO meta_diaria;
ALTER TABLE achievements RENAME TO conquista;
ALTER TABLE student_streaks RENAME TO sequencia;
ALTER TABLE leaderboard_scores RENAME TO pontuacao_ranking;

-- Contexto de Comunicação
ALTER TABLE conversations RENAME TO conversa;
ALTER TABLE chat_messages RENAME TO mensagem;
```

### **Fase 3: Reestruturação de Código (Semana 5-8)**

1. **Criar estrutura de pastas DDD**
2. **Implementar entidades de domínio**
3. **Criar repositórios**
4. **Implementar use cases**
5. **Atualizar UI para usar use cases**

### **Fase 4: Testes e Validação (Semana 9-10)**

1. **Testes unitários de domínio**
2. **Testes de integração**
3. **Testes E2E**
4. **Validação com usuários**

---

## ✅ Benefícios da Arquitetura DDD

### **Semântica Clara**
- ✅ Código reflete a linguagem do negócio
- ✅ Fácil onboarding de novos desenvolvedores
- ✅ Comunicação clara com stakeholders

### **Manutenibilidade**
- ✅ Lógica de negócio isolada
- ✅ Mudanças localizadas em bounded contexts
- ✅ Menos acoplamento

### **Escalabilidade**
- ✅ Bounded contexts podem virar microserviços
- ✅ Times podem trabalhar em contextos separados
- ✅ Evolução independente

### **Testabilidade**
- ✅ Domínio puro (sem dependências externas)
- ✅ Testes unitários simples
- ✅ Mocks apenas na infraestrutura

---

## 🎯 Próximos Passos

1. **Revisar e aprovar** esta proposta
2. **Criar task.md** detalhado com checklist
3. **Implementar Fase 1** (consolidação)
4. **Validar** com dados reais
5. **Continuar** com fases seguintes

---

## 📚 Referências

- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Implementing Domain-Driven Design - Vaughn Vernon](https://vaughnvernon.com/)
- [DDD Patterns in TypeScript](https://khalilstemmler.com/articles/domain-driven-design-intro/)
