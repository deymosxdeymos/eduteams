// Verifies JUnit XML produced by Bun tests has zero failures/errors
// Usage: bun run scripts/verify-tests.ts [junitPath]

import { readFile } from 'node:fs/promises';

const junitPath = process.argv[2] || 'coverage/junit.xml';

let xml = '';
try {
  xml = await readFile(junitPath, 'utf8');
} catch {
  xml = '';
}
if (!xml) {
  console.error(`JUnit report not found: ${junitPath}`);
  process.exit(2);
}

const attr = (name: string) => new RegExp(name + '="(\\d+)"', 'g');

let failures = 0;
let errors = 0;
for (const m of xml.matchAll(attr('failures'))) failures += Number(m[1]);
for (const m of xml.matchAll(attr('errors'))) errors += Number(m[1]);

const hasFailureTags = xml.includes('<failure') || xml.includes('<error');

console.log(`JUnit summary: failures=${failures}, errors=${errors}`);

if (failures > 0 || errors > 0 || hasFailureTags) {
  console.error('Test failures detected');
  process.exit(1);
}

console.log('All tests passed');
