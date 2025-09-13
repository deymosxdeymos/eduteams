// Simple LCOV gate: enforces minimal global coverage thresholds
// Usage: bun run scripts/verify-coverage.ts [lcovPath]
// Env: COVERAGE_LINES_MIN, COVERAGE_FUNCTIONS_MIN, COVERAGE_STATEMENTS_MIN, COVERAGE_BRANCHES_MIN

import { readFile } from 'node:fs/promises';

const lcovPath = process.argv[2] || 'coverage/lcov.info';

let text = '';
try {
  text = await readFile(lcovPath, 'utf8');
} catch {
  text = '';
}
if (!text) {
  console.error(`Coverage file not found: ${lcovPath}`);
  process.exit(2);
}

let lf = 0;
let lh = 0;
let fnf = 0;
let fnh = 0;

for (const line of text.split('\n')) {
  if (line.startsWith('LF:')) lf += Number(line.slice(3)) || 0;
  if (line.startsWith('LH:')) lh += Number(line.slice(3)) || 0;
  if (line.startsWith('FNF:')) fnf += Number(line.slice(4)) || 0;
  if (line.startsWith('FNH:')) fnh += Number(line.slice(4)) || 0;
}

const linesPct = lf ? lh / lf : 0;
const funcsPct = fnf ? fnh / fnf : 0;

const minLines = Number(process.env.COVERAGE_LINES_MIN ?? '0.57');
const minFuncs = Number(process.env.COVERAGE_FUNCTIONS_MIN ?? '0.63');

console.log(
  `Global coverage: lines=${(linesPct * 100).toFixed(2)}% (min=${
    minLines * 100
  }%), functions=${(funcsPct * 100).toFixed(2)}% (min=${minFuncs * 100}%)`
);

const ok = linesPct >= minLines && funcsPct >= minFuncs;
if (!ok) {
  console.error('Coverage gate failed');
  process.exit(1);
}

console.log('Coverage gate passed');
