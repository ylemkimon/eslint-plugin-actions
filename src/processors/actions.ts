import YAML from 'yaml';
import { Scalar, YAMLMap, YAMLSeq } from 'yaml/types';
import { YAMLError, YAMLWarning } from 'yaml/util';
import { CST } from 'yaml/parse-cst';
import { Linter } from 'eslint';

import { PLUGIN_NAME, SCRIPT_ACTIONS } from '../util/constants';
import { Delta, Position, Block, ESLintBlock } from '../util/types';

let blocks: Block[] = [];

let errors: YAMLError[] = [];
let warnings: YAMLWarning[] = [];

function excludeUnsatisfiableRules(
  message: Linter.LintMessage | null
): message is Linter.LintMessage {
  return message != null;
}

function getPosMap(
  lines: string[],
  jsOffset: number,
  ymlOffset: number,
  indent: number
): Delta[] {
  const posMap = lines.map(line => {
    // The parser trims leading whitespace up to the level of the
    // blockIndent, so keep any additional indentation beyond that.
    const trimLength = Math.min(indent, line.search(/\S|$/));

    const delta: Delta = {
      js: jsOffset,

      // Advance `trimLength` character from the beginning of the
      // line to the beginning of the equivalent JS line, then
      // compute the delta.
      md: ymlOffset + trimLength - jsOffset,
    };

    // Accumulate the current line in the offsets, and don't forget
    // the newline.
    ymlOffset += line.length + 1;
    jsOffset += line.length - trimLength + 1;
    return delta;
  });

  posMap.unshift({
    js: 0,
    md: 0,
  });

  return posMap;
}

function mapPosition(posMap: Delta[], pos: number): number {
  // Advance through the block's range map to find the last
  // matching range by finding the first range too far and
  // then going back one.
  let i = posMap.findIndex(delta => delta.js > pos);
  if (i === -1) {
    i = posMap.length;
  }

  // Apply the mapping delta for this range.
  return pos + posMap[i - 1].md;
}

function preprocess(text: string): ESLintBlock[] {
  const doc = YAML.parseDocument(text, {
    keepCstNodes: true,
    maxAliasCount: 0, // GitHub Actions doesn't support aliases
    prettyErrors: true, // include linePos
  });

  errors = doc.errors;
  warnings = doc.warnings;

  blocks = []; // reset

  // https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobs
  const jobs = doc.get('jobs');
  if (!(jobs instanceof YAMLMap)) return [];

  // https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_id
  for (const job of jobs.items) {
    if (!(job.value instanceof YAMLMap)) continue;

    // https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idsteps
    const steps = job.value.get('steps');
    if (!(steps instanceof YAMLSeq)) continue;

    let i = 0;
    for (const step of steps.items) {
      if (!(step instanceof YAMLMap)) continue;

      // https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstepsuses
      const uses = step.get('uses');
      if (typeof uses !== 'string') continue;

      for (const [action, {pre = '', post = '', parameter}] of Object.entries(SCRIPT_ACTIONS)) {
        if (!uses.startsWith(`${action}@`)) continue;

        // https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstepswith
        const script = step.getIn(['with', parameter], true);
        if (!(script instanceof Scalar)) continue;

        const {value, cstNode} = script;
        if (typeof value !== 'string' || cstNode == null) continue;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const linePos: Position = cstNode.rangeAsLinePos;

        if (script.type !== 'BLOCK_LITERAL') {
          warnings.push({
            name: 'YAMLWarning',
            message: `Only a literal block is supported by eslint-plugin-${PLUGIN_NAME}`,
            linePos,
            makePretty: () => null,
          });
          continue;
        }

        const node = cstNode as CST.BlockValue;
        if (node.rawValue == null ||
            node.context == null ||
            node.blockIndent == null ||
            node.valueRange == null) continue;

        const lines = node.rawValue.split('\n');
        const indent = node.context.indent + node.blockIndent;

        blocks.push({
          jobId: job.key.value,
          index: i++,
          value,
          lines,
          pre,
          post,
          indent,
          linePos,
          posMap: getPosMap(
            lines,
            pre.length + 1,
            node.valueRange.start,
            indent,
          ),
        });
      }
    }
  }

  return blocks.map(({jobId, index, pre, value, post}) => ({
    filename: `${jobId}/${index}.js`,
    text: `${pre}\n${value}${post}\n`,
  }));
}

function postprocess(messages: Linter.LintMessage[][]): Linter.LintMessage[] {
  return errors.concat(warnings).map((
    {name, message, linePos}
  ): Linter.LintMessage => ({
    ruleId: `${PLUGIN_NAME}/${name}`,
    severity: name === 'YAMLWarning' ? 1 : 2,
    message: message.split(' at line ')[0], // strip pretty context
    line: linePos && linePos.start.line || 1,
    column: linePos && linePos.start.col || 1,
    endLine: linePos && linePos.end.line,
    endColumn: linePos && linePos.end.col,
  })).concat(...messages.map((group, i) => {
    const {linePos, indent, posMap, lines, pre} = blocks[i];
    const preLines = pre.split('\n').length;
    const lineOffset = linePos.start.line - preLines;

    return group.map(message => {
      // ignore messages on pre and post
      if (message.line <= preLines ||
        message.line >= preLines + lines.length) return null;

      const originalLine = lines[message.line - preLines - 1];
      const columnOffset = Math.min(indent, originalLine.search(/\S|$/));

      message.line += lineOffset;
      message.column += columnOffset;
      if (message.endLine != null) {
        message.endLine += lineOffset;
      }
      if (message.endColumn != null) {
        message.endColumn += columnOffset;
      }

      if (message.fix) {
        message.fix = {
          range: [
            mapPosition(posMap, message.fix.range[0]),
            mapPosition(posMap, message.fix.range[1]),
          ],
          text: message.fix.text.replace(/\n/gu, `\n${' '.repeat(indent)}`),
        };
      }

      return message;
    }).filter(excludeUnsatisfiableRules);
  }));
}

export = {
  preprocess,
  postprocess,
  supportsAutofix: true,
};
