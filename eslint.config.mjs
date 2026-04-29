import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  eslintConfigPrettier,
  {
    rules: {
      // Keep lint actionable for current codebase and tighten gradually.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'coverage/**'],
  },
];

export default eslintConfig;
