import { Linter } from 'eslint';

import { PLUGIN_NAME, WORKFLOW_DIR, WORKFLOW_FILE } from '../util/constants';

const recommended: Linter.Config = {
  plugins: [PLUGIN_NAME],
  ignorePatterns: [`!/${WORKFLOW_DIR.split('/')[0]}`],
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
