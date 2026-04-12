#!/usr/bin/env node
/**
 * new-feature.js
 *
 * Cria branch + PRD de forma atômica.
 * Uso: node scripts/new-feature.js <nome-da-feature>
 *
 * Exemplo: node scripts/new-feature.js nutrition-ai-agent
 *
 * O que faz:
 *   1. Garante que está em `development` e atualizado
 *   2. Cria a branch `feature/<nome>`
 *   3. Cria `docs/PRDs/<nome>.md` a partir do template
 *   4. Instrui o próximo passo
 *
 * Regra: nenhum commit é aceito em feature branches sem PRD aprovado.
 * O hook pre-commit verifica isso automaticamente.
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// ── Validação de entrada ─────────────────────────────────────────────────────

const featureName = process.argv[2];

if (!featureName) {
  console.error("\n❌  Nome da feature obrigatório.");
  console.error("    Uso: node scripts/new-feature.js <nome-da-feature>");
  console.error("    Exemplo: node scripts/new-feature.js nutrition-ai-agent\n");
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(featureName)) {
  console.error("\n❌  Nome inválido. Use apenas letras minúsculas, números e hífens.");
  console.error(`    Recebido: "${featureName}"\n`);
  process.exit(1);
}

const branchName = `feature/${featureName}`;
const prdPath = path.join(__dirname, `../docs/PRDs/${featureName}.md`);
const templatePath = path.join(__dirname, "../docs/PRDs/_template.md");
const statusPath = path.join(__dirname, "../docs/STATUS.md");

// ── Verificações ─────────────────────────────────────────────────────────────

if (!fs.existsSync(templatePath)) {
  console.error(`\n❌  Template não encontrado: ${templatePath}\n`);
  process.exit(1);
}

if (fs.existsSync(prdPath)) {
  console.error(`\n❌  PRD já existe: ${prdPath}`);
  console.error("    Delete o arquivo existente se quiser recriar.\n");
  process.exit(1);
}

// ── Criar branch ─────────────────────────────────────────────────────────────

console.log("\n🔀  Verificando branch development...");
try {
  execSync("git checkout development", { stdio: "pipe" });
  execSync("git pull origin development", { stdio: "pipe" });
} catch {
  console.error("❌  Falha ao atualizar development. Verifique sua conexão ou conflitos.");
  process.exit(1);
}

console.log(`🌿  Criando branch ${branchName}...`);
try {
  execSync(`git checkout -b ${branchName}`, { stdio: "pipe" });
} catch {
  console.error(`❌  Branch "${branchName}" já existe. Use: git checkout ${branchName}`);
  process.exit(1);
}

// ── Criar PRD ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];
let template = fs.readFileSync(templatePath, "utf-8");
template = template
  .replace(/\{\{FEATURE_NAME\}\}/g, featureName)
  .replace(/\{\{DATE\}\}/g, today);

fs.writeFileSync(prdPath, template, "utf-8");

// ── Atualizar STATUS.md com linha na tabela de PRDs ativos ──────────────────

const statusContent = fs.readFileSync(statusPath, "utf-8");
const prdTableMarker = "| — | — | — | — |";
const newPrdRow = `| [${featureName}](PRDs/${featureName}.md) | — | draft | \`${branchName}\` |`;

if (statusContent.includes(prdTableMarker)) {
  const updated = statusContent.replace(prdTableMarker, newPrdRow);
  fs.writeFileSync(statusPath, updated, "utf-8");
}

// ── Resultado ────────────────────────────────────────────────────────────────

console.log(`
✅  Tudo pronto!

   Branch criada : ${branchName}
   PRD criado    : docs/PRDs/${featureName}.md
   STATUS.md     : atualizado com o novo PRD

⏭   Próximos passos obrigatórios (nesta ordem):

   1. Abra e preencha o PRD:
      docs/PRDs/${featureName}.md

   2. Responda as 3 perguntas no PRD:
      - O quê?
      - Por quê?
      - Como saberemos que está pronto?

   3. Mude o Status de "draft" para "approved"

   4. Só então comece a codar.

⛔  O hook pre-commit vai bloquear qualquer commit enquanto
    o PRD estiver como "draft" ou não existir.
`);
