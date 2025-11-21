# Documentação - MeuPersonal

Bem-vindo à documentação do projeto MeuPersonal. Este diretório contém toda a documentação técnica, arquitetural e de boas práticas do projeto.

## 📚 Documentos Disponíveis

### 🏗️ Arquitetura e Design
- **[architecture.md](./architecture.md)** - Arquitetura do projeto, stack tecnológica, estrutura de pastas e fluxo de dados

### 📋 Regras de Negócio
- **[business_rules.md](./business_rules.md)** - Regras de negócio, atores do sistema, permissões e fluxos

### ✅ Boas Práticas
- **[best_practices.md](./best_practices.md)** - **LEIA PRIMEIRO** - Diretrizes e padrões que devem ser seguidos em todo o projeto
  - Estilização com Tailwind
  - TypeScript
  - Estrutura de componentes
  - Gerenciamento de estado
  - Performance
  - Acessibilidade

### 🔄 Migração
- **[migration_guide.md](./migration_guide.md)** - Guia completo para migrar código de StyleSheet para Tailwind

### 🔍 Avaliações Técnicas
- **[tanstack_query_evaluation.md](./tanstack_query_evaluation.md)** - Avaliação e recomendação sobre implementação do TanStack Query

### 🗺️ Roadmap
- **[roadmap.md](./roadmap.md)** - Roadmap de desenvolvimento e fases do projeto

---

## 🚀 Início Rápido

### Para Desenvolvedores Novos

1. Leia primeiro: **[best_practices.md](./best_practices.md)**
2. Entenda a arquitetura: **[architecture.md](./architecture.md)**
3. Conheça as regras: **[business_rules.md](./business_rules.md)**

### Para Migração de Código

1. Consulte: **[migration_guide.md](./migration_guide.md)**
2. Siga os padrões em: **[best_practices.md](./best_practices.md)**

### Para Decisões Técnicas

1. Avaliações técnicas: **[tanstack_query_evaluation.md](./tanstack_query_evaluation.md)**

---

## 📝 Convenções Importantes

### Estilização
- ✅ **SEMPRE** use Tailwind (NativeWind)
- ❌ **NUNCA** use `StyleSheet` ou estilos inline com objetos

### TypeScript
- ✅ **SEMPRE** defina tipos para props, estados e funções
- ❌ **NUNCA** use `any` sem necessidade

### Estado
- **Zustand**: Estado global (auth, theme, UI)
- **TanStack Query**: Estado do servidor (cache, sincronização)
- **useState**: Estado local do componente

---

## 🔗 Links Úteis

- [NativeWind Documentation](https://www.nativewind.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

---

**Última atualização**: 2025-01-XX

