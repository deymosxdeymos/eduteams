import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const file = resolve(dirname(new URL(import.meta.url).pathname), '../public/mbti-logo/ENFP.svg');
const svg = readFileSync(file, 'utf8');

const r = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1000 },
});
const out = r.render();
// biome-ignore lint/suspicious/noConsole: logging debug info for CLI script
console.log('render keys', Object.keys(out as any));
// biome-ignore lint/suspicious/noConsole: logging debug info for CLI script
console.log('render props', { width: (out as any).width, height: (out as any).height });
// Try to access pixels if available
// biome-ignore lint/suspicious/noConsole: logging debug info for CLI script
console.log('has pixels?', !!(out as any).pixels, typeof (out as any).pixels);
