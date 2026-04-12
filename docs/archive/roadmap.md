# Roadmap de Desenvolvimento - MeuPersonal

**Data de Início**: 21/11/2025
**Previsão de Lançamento**: 28/02/2026

## Fase 1: Fundação e Autenticação (Semanas 1-2) ✅
- [x] Configuração do Ambiente (Expo, Supabase, Drizzle).
- [x] Implementação do Design System básico (Cores, Tipografia, Componentes Base).
- [x] Autenticação (Login, Cadastro, Recuperação de Senha).
- [x] Onboarding: Escolha de Perfil (Personal vs Aluno).
- [x] Tela Home (Dashboard vazio).

## Fase 2: Core do Personal (Semanas 3-4) ✅
- [x] CRUD de Alunos (Adicionar, Listar, Remover).
- [x] Sistema de Convites (Gerar Link/Código).
- [x] Refatoração Auth Aluno: Login exclusivo via Código de Convite.
- [x] Criação de Treinos (Interface de montagem).
- [x] Banco de Exercícios (Seed inicial + Cadastro manual).
- [x] **EXTRA**: Sistema de atribuição de treinos a múltiplos alunos
- [x] **EXTRA**: Edição de treinos existentes
- [x] **EXTRA**: Histórico de avaliações físicas

## Fase 3: Experiência do Aluno (Semanas 5-6) ✅
- [x] Visualização do Treino do Dia.
- [x] Execução do Treino (Checkboxes, Cronômetro de descanso).
- [x] **IMPLEMENTADO**: Timer automático com vibração e som
- [x] **IMPLEMENTADO**: Progressão sequencial de séries
- [x] **IMPLEMENTADO**: Feedback visual com badges
- [x] **IMPLEMENTADO**: Rastreamento de progresso em tempo real
- [x] Feedback pós-treino.
- [x] Histórico de Treinos.

## Fase 4: Dietas e Nutrição (Semana 7) 🔄

### Fundação ✅
- [x] Criar schema do banco de dados (foods, diet_plans, diet_meals, etc.)
- [x] Importar banco de alimentos (~100 alimentos brasileiros comuns)
- [ ] Tabela de circunferências com evolução
- [ ] Histórico de versões de dieta
- [ ] Notificações automáticas (desvio > 10% por 3+ dias)

### Extras 🔜
- [ ] Exportação de dieta em PDF
- [ ] Check-in semanal obrigatório
- [ ] Foto do prato (preparação para IA futura)

**Decisões Tomadas**:
- ✅ Banco de alimentos: Começar com 100 comuns + permitir cadastro customizado
- ✅ Fórmula TMB: Mifflin-St Jeor (mais precisa)
- ✅ Distribuição de macros: Baseada em peso corporal e objetivo

Ver [nutrition-spec.md](./nutrition-spec.md) para especificação técnica completa.

## Fase 5: Monetização e Polimento (Semanas 8-9) 🔜
- [ ] Integração Stripe/Asaas.
- [ ] Bloqueio de funcionalidades para não-assinantes.
- [ ] Notificações Push (Expo Notifications).
- [ ] Testes de Usabilidade e Correção de Bugs.

## Fase 6: Lançamento (Semana 10) 🔜
- [ ] Deploy nas Lojas (Apple App Store e Google Play).
- [ ] Lançamento Marketing.

---

## 🎯 Status Atual

**Fase Atual**: Fase 3 Concluída ✅

**Próximos Passos**: Fase 4 - Dietas e Nutrição

**Funcionalidades Extras Implementadas**:
- ✅ Timer de descanso com feedback sensorial
- ✅ Sistema de badges visuais
- ✅ Controle de acesso baseado em função
- ✅ Progressão sequencial obrigatória
- ✅ Histórico de avaliações físicas

Ver [features.md](./features.md) para documentação completa de todas as funcionalidades.
