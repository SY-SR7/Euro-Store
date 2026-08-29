/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // No any without explicit comment
    '@typescript-eslint/no-explicit-any': 'error',
    // Force explicit return types on exported functions
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    // No floating promises
    '@typescript-eslint/no-floating-promises': 'error',
    // Consistent imports
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    // No unused vars
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/no-empty-function': ['error', { allow: ['methods'] }],
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
  overrides: [
    {
      files: ['apps/{web,admin,helper,partner}/**/*.{js,jsx,ts,tsx}'],
      extends: ['next/core-web-vitals'],
      rules: {
        '@typescript-eslint/no-empty-function': ['error', { allow: ['methods'] }],
        'no-empty': ['error', { allowEmptyCatch: true }],
      },
    },
  ],
  ignorePatterns: ['node_modules/', '.next/', 'dist/', 'build/', 'coverage/', '*.config.js', '**/next-env.d.ts'],
};
