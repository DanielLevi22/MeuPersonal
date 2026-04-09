module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Types permitidos
    "type-enum": [
      2,
      "always",
      [
        "feat", // Nova funcionalidade
        "fix", // Correção de bug
        "docs", // Apenas documentação
        "style", // Formatação (sem mudança de lógica)
        "refactor", // Refatoração
        "perf", // Melhoria de performance
        "test", // Adicionar/corrigir testes
        "chore", // Tarefas de manutenção
        "revert", // Reverter commit
        "ci", // Mudanças de CI/CD
        "build", // Mudanças de build
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
    "body-leading-blank": [1, "always"],
  },
};
