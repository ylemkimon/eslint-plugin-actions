import { Action } from './types';

export const WORKFLOW_DIR = '.github/workflows';
export const WORKFLOW_FILE = ['*.yml', '*.yaml'];

export const SCRIPT_ACTIONS: {[key: string]: Action} = {
  'actions/github-script': {
    pre: '(async function(context, github, io, core) {',
    post: '}());',
    parameter: 'script',
  },
}
