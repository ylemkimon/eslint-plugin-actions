module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/indent': ['error', 2, {SwitchCase: 1}],
    'comma-dangle': ['error', 'always-multiline'],
    'max-len': ['error', {ignoreStrings: true, ignoreUrls: true}],
    'no-trailing-spaces': 2,
    'object-shorthand': 2,
    'prefer-template': 2,
    quotes: ['error', 'single'],
    'quote-props': ['error', 'as-needed'],
  },
};
