/*
  Normalizes MBTI SVGs by cropping transparent padding and standardizing viewBox.
  - Reads SVGs from public/mbti-logo/*.svg
  - Renders with resvg to RGBA pixels
  - Detects non-transparent bounding box
  - Updates SVG: wraps original content in a translated <g>, sets viewBox to tight bounds
  - Writes to public/mbti-logo-normalized/*.svg
*/
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { load } from 'cheerio';

type VB = { x: number; y: number; w: number; h: number };

function parseViewBox(svg: string): VB | null {
  const m = svg.match(/viewBox\s*=\s*"([^"]+)"/i);
  if (!m) return null;
  const parts = m[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) return null;
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
}

function ensureDir(dir: string) {
  try {
    mkdirSync(dir, { recursive: true });
  } catch {}
}

// Detect the opaque content bounds with a very low threshold to avoid clipping
// thin anti-aliased strokes or soft effects (glows, shadows).
function computeAlphaBounds(
  pixels: Uint8Array,
  width: number,
  height: number,
  threshold = 1
) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      const a = pixels[row + x * 4 + 3];
      if (a > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0 || maxY < 0) return null;
  // Expand to include the last pixel fully
  return {
    minX,
    minY,
    maxX: maxX + 1,
    maxY: maxY + 1,
  };
}

function computeAlphaCentroidX(
  pixels: Uint8Array,
  width: number,
  height: number,
  threshold = 8
) {
  let sumAX = 0;
  let sumA = 0;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      const a = pixels[row + x * 4 + 3];
      if (a > threshold) {
        sumAX += a * x;
        sumA += a;
      }
    }
  }
  if (sumA === 0) return width / 2;
  return sumAX / sumA;
}

function computeHeadSliceCenterX(
  pixels: Uint8Array,
  width: number,
  height: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  headFraction = 0.6,
  threshold = 8
) {
  const yStart = Math.max(0, Math.floor(bounds.minY));
  const yEnd = Math.min(height, Math.ceil(bounds.minY + (bounds.maxY - bounds.minY) * headFraction));
  let minX = width;
  let maxX = -1;
  for (let y = yStart; y < yEnd; y++) {
    const row = y * width * 4;
    for (let x = Math.max(0, Math.floor(bounds.minX)); x < Math.min(width, Math.ceil(bounds.maxX)); x++) {
      const a = pixels[row + x * 4 + 3];
      if (a > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxX < 0) return null;
  return (minX + maxX) / 2;
}

function normalizeOne(file: string, outDir: string) {
  const svg = readFileSync(file, 'utf8');
  const vb = parseViewBox(svg);
  if (!vb) {
    // biome-ignore lint/suspicious/noConsole: warning about skipped files improves CLI feedback
    console.warn(`Skipping ${file} (no viewBox)`);
    return;
  }

  // Render at high width to get accurate bounds
  const targetWidthPx = 2400; // render a bit larger for more reliable alpha edges
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: targetWidthPx } });
  const rendered = resvg.render() as any;
  const widthPx: number = rendered.width;
  const heightPx: number = rendered.height;
  const pixels: Uint8Array = rendered.pixels as Uint8Array;

  const b = computeAlphaBounds(pixels, widthPx, heightPx);
  if (!b) {
    // biome-ignore lint/suspicious/noConsole: warning about skipped files improves CLI feedback
    console.warn(`No visible pixels in ${file}; copying as-is.`);
    writeFileSync(join(outDir, basename(file)), svg);
    return;
  }

  // Convert pixel bounds to viewBox units
  const scaleXv = vb.w / widthPx;
  const scaleYv = vb.h / heightPx;
  // Add generous pixel margin around detected bounds (in render-pixel space),
  // then convert to original viewBox units. This helps keep strokes/filters intact.
  const pxMargin = 8; // was 2; increased to reduce any chance of cutting
  const minXv = Math.max(vb.x, vb.x + b.minX * scaleXv - pxMargin * scaleXv);
  const minYv = Math.max(vb.y, vb.y + b.minY * scaleYv - pxMargin * scaleYv);
  const maxXv = Math.min(vb.x + vb.w, vb.x + b.maxX * scaleXv + pxMargin * scaleXv);
  const maxYv = Math.min(vb.y + vb.h, vb.y + b.maxY * scaleYv + pxMargin * scaleYv);

  const contentW = Math.max(0.0001, maxXv - minXv);
  const contentH = Math.max(0.0001, maxYv - minYv);

  // Prefer a head-only slice center to avoid bias from hands/props
  const headCenterXpx = computeHeadSliceCenterX(
    pixels,
    widthPx,
    heightPx,
    { minX: b.minX, minY: b.minY, maxX: b.maxX, maxY: b.maxY },
    0.65
  );
  const centerXpx = headCenterXpx ?? computeAlphaCentroidX(pixels, widthPx, heightPx);
  const centerXv = vb.x + centerXpx * scaleXv; // in original viewBox units
  const centerXvFromMin = centerXv - minXv;

  // Set a square output viewBox and scale by HEIGHT so all logos share the same visual height.
  const TARGET = 100; // target viewBox units
  const INSET = 5; // slightly larger padding to avoid edge clipping
  const avail = TARGET - 2 * INSET;
  const scaleH = avail / contentH;
  const scaleW = avail / contentW;
  // Fit by height primarily, but cap by width to prevent horizontal clipping on wide assets.
  const scale = Math.min(scaleH, scaleW);
  const scaledW = contentW * scale;
  // Center by head/top-slice; clamp to keep within inset
  const dxCentroid = TARGET / 2 - centerXvFromMin * scale;
  const dxMin = INSET;
  const dxMax = TARGET - INSET - scaledW;
  const dx = Math.max(dxMin, Math.min(dxCentroid, dxMax));
  const dy = INSET; // fixed top inset; baseline becomes TARGET - INSET

  // Parse and rewrite SVG
  const $ = load(svg, { xmlMode: true });
  const $svg = $('svg').first();
  // Remove explicit width/height to rely on viewBox
  $svg.removeAttr('width');
  $svg.removeAttr('height');
  $svg.attr('viewBox', `0 0 ${TARGET} ${TARGET}`);
  if (!$svg.attr('preserveAspectRatio')) {
    $svg.attr('preserveAspectRatio', 'xMidYMid meet');
  }

  // Wrap existing children in a translated+scaled group, but keep <defs> at root.
  const children = $svg.children().toArray();
  const defsEls = children.filter(el => (el as any).name === 'defs');
  const g = `<g id="__normalized" transform="translate(${dx}, ${dy}) scale(${scale}) translate(${-minXv}, ${-minYv})"></g>`;
  $svg.append(g);
  const $g = $svg.children('#__normalized').first();
  for (const el of children) {
    const name = (el as any).name;
    if (name === 'defs') continue; // leave defs at root
    if (el.type === 'tag' && name === 'g' && (el as any).attribs?.id === '__normalized') continue;
    $g.append($(el));
  }
  // Move defs to the top of root for widest compatibility
  if (defsEls.length) {
    $svg.children('defs').remove();
    for (let i = defsEls.length - 1; i >= 0; i--) {
      $svg.prepend($(defsEls[i]));
    }
  }

  const out = $.xml();
  writeFileSync(join(outDir, basename(file)), out);
}

function main() {
  const root = resolve(process.cwd());
  const inDir = join(root, 'public', 'mbti-logo');
  const outDir = join(root, 'public', 'mbti-logo-normalized');
  ensureDir(outDir);
  const files = readdirSync(inDir)
    .filter(f => f.toLowerCase().endsWith('.svg'))
    .map(f => join(inDir, f))
    .filter(f => statSync(f).isFile());

  // biome-ignore lint/suspicious/noConsole: CLI progress output
  console.log(`Normalizing ${files.length} SVGs from ${inDir} -> ${outDir}`);
  for (const f of files) {
    try {
      normalizeOne(f, outDir);
      // biome-ignore lint/suspicious/noConsole: CLI progress output
      console.log('✓', basename(f));
    } catch (err) {
      // biome-ignore lint/suspicious/noConsole: CLI progress output
      console.error('✗', basename(f), err);
    }
  }
}

main();
