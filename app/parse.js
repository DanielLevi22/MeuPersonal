const data = require('./biome-errors.json');
data.diagnostics
  .filter((d) => d.category)
  .forEach((d) => {
    if (
      [
        'lint/complexity/useLiteralKeys',
        'lint/style/noNonNullAssertion',
        'lint/correctness/noUnusedVariables',
        'lint/correctness/useExhaustiveDependencies',
      ].includes(d.category)
    )
      console.log({ category: d.category, file: d.location?.path?.file, span: d.location?.span });
  });
