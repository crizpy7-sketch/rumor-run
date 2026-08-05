// Writing a viewer page.
//
// Shared by tools/img2threejs.mjs, which writes the real ones, and
// tools/shoot3d.mjs, which writes a synthetic one to calibrate the lighting
// against. The template itself is tools/viewer.html — real HTML rather than a
// string in a generator, because it is a few hundred lines of three.js and a
// template literal inside a template literal breaks the moment the viewer
// needs a backtick.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** How deep to extrude, when nobody said. Thin enough to stay a sprite. */
export function autoDepth(w, h) {
  return Math.max(2, Math.min(32, Math.round(Math.min(w, h) * 0.3)));
}

export function widthOf(rows) {
  return rows.reduce((a, r) => Math.max(a, r.length), 0);
}

/** Render the template to `out` (repo-relative). Returns the models written. */
export async function writeViewer({ models, PAL, out, title, depth = null }) {
  for (const m of models) {
    m.depth = m.depth || depth || autoDepth(widthOf(m.rows), m.rows.length);
  }
  const tpl = await readFile(join(ROOT, 'tools/viewer.html'), 'utf8');
  const html = tpl
    .replaceAll('__TITLE__', title)
    .replace('__DATA__', JSON.stringify({ pal: PAL, models }));
  await mkdir(dirname(join(ROOT, out)), { recursive: true });
  await writeFile(join(ROOT, out), html);
  return models;
}

/**
 * A sprite that is nothing but one flat block per palette entry.
 *
 * Rendered dead-on, every front face should come back out of the renderer at
 * the colour it went in as. That makes "is the lighting right" a measurement
 * rather than an opinion — see `tools/shoot3d.mjs --calibrate`.
 */
export function calibrationModel(PAL, block = 6, cols = 6) {
  const keys = Object.keys(PAL);
  const rowsOfBlocks = Math.ceil(keys.length / cols);
  const rows = [];
  for (let r = 0; r < rowsOfBlocks; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      const key = keys[r * cols + c];
      line += (key || '.').repeat(block);
    }
    for (let b = 0; b < block; b++) rows.push(line);
  }
  return { name: 'calibration', rows, block, cols, keys };
}
