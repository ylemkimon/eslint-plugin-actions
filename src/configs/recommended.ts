import { Linter } from 'eslint';

import { PLUGIN_NAME, WORKFLOW_DIR, WORKFLOW_FILE } from '../util/constants';

const ignorePatterns = [
  // ignore other YAML files
  ...WORKFLOW_FILE,
  // include workflow files, ESLint 6 doesn't do this by default
  ...WORKFLOW_FILE.map(f => `!/${WORKFLOW_DIR}/${f}`),
];

// ESLint ignores dotfiles
if (WORKFLOW_DIR.startsWith('.')) {
  ignorePatterns.unshift(`!/${WORKFLOW_DIR.split('/')[0]}`);
}

const recommended: Linter.Config = {
  plugins: [PLUGIN_NAME],
  ignorePatterns,
  overrides: [{
    files: WORKFLOW_FILE.map(f => `${WORKFLOW_DIR}/${f}`),
    processor: `${PLUGIN_NAME}/actions`,
  }, {
    files: WORKFLOW_FILE.map(f => `${WORKFLOW_DIR}/${f}/**/*.js`),
    env: { // Node.js 12
      es2020: true,
      node: true,
    },
  }],
}

export default recommended;
