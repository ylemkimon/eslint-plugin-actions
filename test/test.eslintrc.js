module.exports = {
  root: true,
  extends: ['plugin:actions/recommended'],
  overrides: [{
    files: ['.github/workflows/*.{yml,yaml}/**/*.js'],
    rules: {
      'block-spacing': 2,
      'brace-style': 2,
      'eol-last': 2,
      indent: ['error', 2, {outerIIFEBody: 0}],
      'keyword-spacing': 2,
      'max-statements-per-line': 2,
      'no-console': 2,
      'no-undef': 2,
      semi: 2,
      'space-before-blocks': 2,
      'space-before-function-paren': 2,
    },
  }, {
    files: ['.github/workflows/test.yml/*_B/*.js'],
    rules: {
      'no-console': 0,
    },
  }],
};
