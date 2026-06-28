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
  },
  ignorePatterns: ['node_modules/', '.next/', 'dist/', 'build/', 'coverage/', '*.config.js'],
};
