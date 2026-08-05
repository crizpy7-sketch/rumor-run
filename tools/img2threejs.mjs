// Pixel art -> extruded three.js geometry.
//
//   node tools/img2threejs.mjs cart                  a sprite by name
//   node tools/img2threejs.mjs cart worker forklift  several in one scene
//   node tools/img2threejs.mjs shots/thing.png       any image
//   node tools/img2threejs.mjs --all                 the whole sprite table
//   node tools/img2threejs.mjs --depth 6 --out 3d/cart.html
//   node tools/img2threejs.mjs --rows 40 pic.png     height to quantise a PNG to
//
// Writes a standalone page into 3d/. It needs no server, no build and no
// network: three.js is vendored, and the geometry is built in the page from
// the palette rows, which are a few kilobytes of text rather than megabytes of
// float arrays.
//
// The mesh is not one cube per pixel. Two things keep the triangle count sane
// and the silhouette exact:
//
//   Runs of identical colour along a row become a single quad on the front and
//   back faces. Pixel art is mostly flat areas, so this collapses most of it.
//
//   A side face is only emitted where the neighbouring pixel is transparent.
//   Interior walls between two solid pixels are never visible, so building
//   them is pure cost.
//
// The result is what pixel art looks like when it is given a third dimension
// honestly: the silhouette is preserved to the pixel, and the depth comes from
// extrusion rather than from guessing at a depth map, which is the part that
// always looks wrong.

import { chromium } from 'playwright';
import { join, basename, extname } from 'node:path';
import { serve } from './serve.mjs';
import { launchOptions } from './browser.mjs';
import { writeViewer, widthOf } from './viewer.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const depthArg = flag('depth') ? Number(flag('depth')) : null;
const rowsArg = flag('rows') ? Number(flag('rows')) : 40;
const outArg = flag('out');
const inputs = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));

/** Sprite rows straight out of the game — no browser needed for these. */
async function rowsFromSprites(names) {
  const { ART, PAL } = await import('../src/art/sprites.js');
  const models = [];
  for (const name of names) {
    const rows = ART[name];
    if (!rows) throw new Error(`no sprite named "${name}" — try --list on tools/importart.mjs`);
    models.push({ name, rows });
  }
  return { PAL, models };
}

/** Anything that is a file on disk has to go through the palette snap first. */
async function rowsFromImages(files, targetH) {
  const { server, port } = await serve(0);
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e)));
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });

  const result = await page.evaluate(async ({ files, targetH }) => {
    const { PAL } = await import('/src/art/sprites.js');
    const { snapper, imageToRows } = await import('/tools/quantise.js');
    const snap = snapper(PAL);
    const models = [];
    for (const f of files) {
      const got = await imageToRows(`/${f}`, { targetH, snap });
      models.push({ name: f.split('/').pop().replace(/\.[^.]+$/, ''), rows: got.rows, note: got });
    }
    return { PAL, models };
  }, { files, targetH });

  await browser.close();
  server.close();
  if (errors.length) {
    for (const e of errors) console.error(`  ! ${e.split('\n')[0]}`);
    process.exit(1);
  }
  return result;
}

async function main() {
  if (!inputs.length && !has('all')) {
    console.log('usage: node tools/img2threejs.mjs <sprite|image.png> [more...] [--all]');
    console.log('       --depth <px>  extrusion depth      --rows <n>  height for PNG input');
    console.log('       --out <path>  where to write       (default 3d/<name>.html)');
    return;
  }

  const files = inputs.filter((a) => /\.(png|jpe?g|webp|gif)$/i.test(a));
  const names = inputs.filter((a) => !files.includes(a));

  let PAL;
  let models = [];
  if (has('all') || names.length) {
    const { ART, PAL: pal } = await import('../src/art/sprites.js');
    PAL = pal;
    const wanted = has('all') ? (await import('../src/art/names.js')).SPRITES : names;
    const got = await rowsFromSprites(wanted.filter((n) => ART[n]));
    models = got.models;
  }
  if (files.length) {
    const got = await rowsFromImages(files, rowsArg);
    PAL = PAL || got.PAL;
    for (const m of got.models) {
      if (!m.note.trimmed) {
        console.log(`  ! ${m.name}: no transparent margin — a baked-in background`);
        console.log('    extrudes as a solid slab. Use a transparent PNG.');
      }
    }
    models = models.concat(got.models.map(({ name, rows }) => ({ name, rows })));
  }

  const stem = has('all') ? 'index'
    : basename(inputs[0], extname(inputs[0]));
  const out = outArg || join('3d', `${stem}.html`);
  const title = models.length === 1
    ? `${models[0].name} — Rumor Run in 3D`
    : 'Rumor Run in 3D';

  await writeViewer({ models, PAL, out, title, depth: depthArg });

  const px = models.reduce((a, m) => a + m.rows.join('').replace(/\./g, '').length, 0);
  console.log(`${models.length} model(s) -> ${out}`);
  for (const m of models) {
    const dims = `${widthOf(m.rows)}x${m.rows.length}`;
    console.log(`  ${m.name.padEnd(18)} ${dims.padEnd(9)} depth ${m.depth}`);
  }
  console.log(`\n${px.toLocaleString()} solid pixels extruded`);
  console.log(`open it: npm start, then http://localhost:8123/${out}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
