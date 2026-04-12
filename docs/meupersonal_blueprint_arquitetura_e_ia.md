# 🌌 MeuPersonal: Blueprint de Arquitetura e Estratégia I.A. (v3.0)

Este documento centraliza as decisões estratégicas, dúvidas arquiteturais e o roadmap de evolução técnica do projeto MeuPersonal. O objetivo é unificar a base de código, preparar o terreno para orquestração de I.A. e garantir um sistema escalável e documentado.

---

## 1. O Debate: Next.js vs. React (Vite)

### Cenário Atual
O Web hoje roda em **Next.js 16.2.3**. 

### Análise de Custo e Necessidade
*   **Next.js**: É robusto. Sua principal vantagem para o MeuPersonal não é o SEO, mas sim as **API Routes**. Elas funcionam como um **BFF (Backend-for-Frontend)**.
*   **React (Vite)**: É extremamente leve e rápido ("Static Site"), mas não possui ambiente Node.js integrado para o backend.

### Decisão Recomendada
**Manter o Next.js**, mas otimizá-lo. 
> [!IMPORTANT]
> Para a estratégia de **I.A. Orquestrada**, o Next.js é superior. Você precisa de um ambiente servidor (API Routes) para rodar lógicas complexas de agentes (LangChain, chamadas seguras para LLMs, buscas em banco Vetorial) sem expor chaves de API no navegador ou no mobile. O Next.js será o "Cérebro" para ambos.

---

## 2. Estratégia de I.A. Orquestrada

### Visão
Criar agentes especialistas (Nutrição, Treino, Análise de Dados) que conversam entre si.

### Arquitetura sugerida
1.  **Cérebro Central (Next BFF)**: Centralizar a lógica dos agentes em `web/src/app/api/ai`. 
2.  **Web & Mobile Clientes**: Ambos invocam as mesmas rotas de API. Isso evita duplicar a lógica da I.A.
3.  **Compartilhamento de Recursos**: Usar um diretório `shared/` na raiz para definir as "Tools" e "Prompts" que os agentes usam, garantindo que o comportamento seja idêntico no App e no Painel.

---

## 3. Unificação de Código (Monorepo Lite)

### Por que o Turborepo falhou?
Estruturas complexas (como `apps/web`, `apps/mobile`) costumam quebrar o **Metro Bundler** do React Native devido a caminhos relativos e symlinks.

### Proposta: "Flat Monorepo"
Manter `web` e `app` na raiz, mas elevar a lógica comum para uma pasta **`shared/`** na raiz.
```bash
/MeuPersonal
  /shared        # <-- NOVO: Tipos Supabase, Business Logic, Utils
  /web           # Next.js (lê de /shared)
  /app           # Mobile Expo (lê de /shared)
  package.json   # Gerencia os workspaces
```
*   **Vantagem**: Inconsistências de regras de negócio entre Web e Mobile são eliminadas.
*   **Ganhos**: Controle total sobre o que é compartilhado sem a dor de cabeça de builds complexos.

---

## 4. Documentação e Padronização de Features

### Feature em Foco: Nutrição (Refeições)
Atualmente, a documentação está espalhada em 46 arquivos. Precisamos de um **"Especificação Técnica Única"**.

> [!CAUTION]
> Precisamos revisar a arquitetura de **Refeições** agora, antes que o volume de dados a torne intocável. O sistema de logs e targets deve ser idêntico em ambas as plataformas.

### Padronizações (Biome & Clean Code)
*   **Regra de Ouro**: Nenhuma regra de negócio deve estar dentro do componente UI (Web ou Mobile). Tudo deve vir de hooks compartilhados.
*   **Linter**: Biome em toda a raiz para garantir o mesmo estilo de código em qualquer pasta.

---

## 5. Próximos Passos (Roadmap de Curto Prazo)

1.  **[ ] Auditoria de Código Duplicado**: Identificar `services` e `hooks` idênticos.
2.  **[ ] Setup do Workspace Root**: Configurar o `package.json` da raiz para enxergar `web`, `app` e `shared`.
3.  **[ ] Migração de Pacotes**: Mover `supabase-client` e `core-types` para a pasta `shared/`.
4.  **[ ] Documentação da Feature Nutrição**: Mapear no detalhe o fluxo de alimento -> refeição -> log.

---

**Nome Sugerido para o Documento:** `MeuPersonal: Blueprint de Arquitetura e Estratégia I.A.`


promppt 
Eu to pensando  em trocar o Next pelo React pq basicamente  eu nao to usando features do nesxt, isso talvez mim de  mais gasto ao usar next isso sao  perguntas, outro detalhe q to pensando em construir uma feature de I.a q basicamente vai fazer a  mesma coisa  no mobile talvez  isso de pra fazer no next com  back for front end,  onde eu posso comportilar recursos e ntre os 2 pq quero q criar  varios agentes de  i,a orquestrado e  nao sei se faz sentindo  ou se da  pra gente construir diretamente separado no mobile,  outro ponto q esse porjeto tbm nao tem mt documentacao em si do que foi feito por exemplo o funcionamento de refeicao, isso talvez tenhamos q rever  no detalhe toda arquitetura  do sistema e fazer em quando o sistema a inda nao ta enorme  se postergar vai da mais trabalho, outro ponto tbm sao padronizacoes q temos q seguir q  o  sistmema as vezes nao segue,  entao quero fazerr as  coisa  no cuidado pra ter total controle de tudo q foi feito, um detalhe   é que usei turbo repo mais quando eu tentava gera o build local do app  mobile tive varios problemas por isso desistir, mais to numa questao teenho  funcionalidade tanto no mobile quando no web duplicadas mais sinto q parece q tem hora q ta sendo de formas diferentes , isso  parece meio estranho dai  eu pensei em voltar com   turbo repo e deixar os apps na raiz do projeto sem mover ele pra pasta apps/ pra ver se funciona, outro detalhe é q a gnt ia mover os codifgos de servicos pra uma pasta centralizada impedindo q a gnt trrabalhase de forma diferentes tanto  no mobile como no web pra q  nao gere inconcistencia entao o plano é ir passo montando o sistema toda sua arquitetura documentada cada feature documentada toda arquitera documenta.
