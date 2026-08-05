// Screenshot a page written by tools/img2threejs.mjs.
//
//   node tools/shoot3d.mjs 3d/cart.html
//   node tools/shoot3d.mjs 3d/cart.html --angles 4 --out shots/3d
//   node tools/shoot3d.mjs --calibrate      check the lighting against PAL
//
// Same reason the 2D game has a capture harness: a renderer that throws no
// errors and draws nothing looks identical from here. This asserts that pixels
// actually landed — that the frame is not the background colour — and takes a
// few angles, because an extrusion looks correct from the front no matter how
// wrong the side faces are.
//
// --calibrate answers the question the screenshots cannot. The sprite already
// has its light baked in by whoever drew it, so a front face has to come back
// out of the renderer at the palette value it went in as; any dimmer and the
// 3D version is just a worse copy of the 2D one. It builds a sprite that is
// one flat block per palette entry, points the camera straight at it, and
// projects each block's centre through the live camera to find the pixel to
// sample. That makes the lighting a measurement instead of an opinion — the
// first pass through this read 0.85x and looked, correctly, muddy.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
import { launchOptions } from './browser.mjs';
import { writeViewer, calibrationModel } from './viewer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--')) || '3d/index.html';
const flag = (n, d) => (args.indexOf(`--${n}`) === -1 ? d : args[args.indexOf(`--${n}`) + 1]);
const angles = Number(flag('angles', 4));
const outDir = flag('out', 'shots/3d');

/** Front faces, dead on, versus the palette they were built from. */
async function calibrate() {
  const { PAL } = await import('../src/art/sprites.js');
  const model = calibrationModel(PAL);
  const out = '3d/_calibration.html';
  await writeViewer({
    models: [{ name: model.name, rows: model.rows }],
    PAL, out, title: 'lighting calibration', depth: 4,
  });

  const { server, port } = await serve(0);
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e)));
  await page.goto(`http://localhost:${port}/${out}`, { waitUntil: 'load' });
  await page.waitForFunction('window.IMG2THREE');

  // Square on: no yaw, no pitch, so every front face is perpendicular to the
  // view and nothing is foreshortened.
  await page.evaluate(() => {
    window.IMG2THREE.setSpin(false);
    window.IMG2THREE.setYaw(0);
    window.IMG2THREE.setPitch(0);
  });
  await page.waitForFunction('window.IMG2THREE.settled()', { timeout: 5000 });
  await page.waitForTimeout(200);

  const shot = (await page.screenshot()).toString('base64');
  const rows = await page.evaluate(async ({ b64, block, cols, keys, w, h }) => {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = `data:image/png;base64,${b64}`; });
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, cv.width, cv.height).data;

    const { camera, models, THREE } = window.IMG2THREE;
    const depth = 4;
    const out = [];
    for (let i = 0; i < keys.length; i++) {
      const cx = (i % cols) * block + block / 2;
      const cy = Math.floor(i / cols) * block + block / 2;
      // Geometry is centred on x and stands on y=0, so this is where that
      // block's centre actually is in the world.
      const p = new THREE.Vector3(cx - w / 2, h - cy, depth / 2).project(camera);
      const sx = Math.round((p.x * 0.5 + 0.5) * cv.width);
      const sy = Math.round((-p.y * 0.5 + 0.5) * cv.height);
      if (sx < 0 || sy < 0 || sx >= cv.width || sy >= cv.height) { out.push(null); continue; }
      const o = (sy * cv.width + sx) * 4;
      out.push([data[o], data[o + 1], data[o + 2]]);
    }
    return out;
  }, {
    b64: shot,
    block: model.block,
    cols: model.cols,
    keys: model.keys,
    w: model.rows[0].length,
    h: model.rows.length,
  });

  await browser.close();
  server.close();
  for (const e of errors) console.error(`  ! ${e.split('\n')[0]}`);

  const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const bad = [];
  let sum = 0;
  let n = 0;
  console.log('key  palette   rendered  ratio');
  for (let i = 0; i < model.keys.length; i++) {
    const key = model.keys[i];
    const hex = PAL[key];
    const want = [1, 3, 5].map((o) => parseInt(hex.slice(o, o + 2), 16));
    const got = rows[i];
    if (!got) { console.log(`  ${key}  ${hex}  off screen`); continue; }
    const hexOf = (c) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    // Very dark entries are all within a few units of each other and of the
    // background, so a ratio on them is noise rather than signal.
    const skip = lum(want) < 40;
    const ratio = skip ? null : lum(got) / Math.max(1, lum(want));
    if (ratio !== null) { sum += ratio; n++; if (Math.abs(ratio - 1) > 0.08) bad.push([key, ratio]); }
    console.log(`  ${key}   ${hex}   ${hexOf(got)}   ${ratio === null ? '(too dark to judge)' : ratio.toFixed(3)}`);
  }

  const mean = sum / n;
  console.log(`\nmean front-face ratio ${mean.toFixed(3)} over ${n} palette entries`);
  if (bad.length) {
    console.log(`${bad.length} outside +/-8%: ${bad.map(([k, r]) => `${k} ${r.toFixed(2)}`).join(', ')}`);
  }
  if (errors.length) process.exit(1);
  if (Math.abs(mean - 1) > 0.06) {
    console.error(`\nfront faces are ${mean < 1 ? 'darker' : 'brighter'} than the art they came from`);
    console.error('adjust the lights in tools/viewer.html until this reads ~1.00');
    process.exit(1);
  }
  console.log('lighting is calibrated: a front face renders as the palette colour');
}

async function main() {
  if (args.includes('--calibrate')) return calibrate();
  await mkdir(join(ROOT, outDir), { recursive: true });
  const { server, port } = await serve(0);
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({ viewport: { width: 900, height: 640 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e)));
  // Watch responses rather than console text: the console line for a 404 does
  // not name the URL, so filtering it by message was filtering blind. A missing
  // favicon is not a rendering failure; a missing three.js very much is.
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errors.push(m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && !/favicon/i.test(r.url())) {
      errors.push(`${r.status()} ${r.url()}`);
    }
  });

  await page.goto(`http://localhost:${port}/${target}`, { waitUntil: 'load' });
  await page.waitForFunction('window.IMG2THREE && window.IMG2THREE.tris > 0', { timeout: 15000 });

  const info = await page.evaluate(() => ({
    tris: window.IMG2THREE.tris,
    models: window.IMG2THREE.models.map((m) => m.name),
  }));

  // Stop the spin first, or every shot catches the rig somewhere different and
  // two runs of this tool can never be compared.
  await page.evaluate(() => window.IMG2THREE.setSpin(false));
  await page.waitForFunction('window.IMG2THREE.settled()', { timeout: 5000 });

  const stem = basename(target, '.html');
  const shots = [];
  for (let i = 0; i < angles; i++) {
    await page.evaluate((yaw) => window.IMG2THREE.setYaw(yaw), (i / angles) * Math.PI * 2);
    await page.waitForTimeout(160);
    const file = join(outDir, `${stem}-${i}.png`);
    await page.screenshot({ path: join(ROOT, file) });
    shots.push(file);
  }

  // Did anything actually draw? Count pixels that are not the background.
  const coverage = await page.evaluate(() => {
    const c = window.IMG2THREE.renderer.domElement;
    const cv = document.createElement('canvas');
    cv.width = 300; cv.height = 200;
    const ctx = cv.getContext('2d');
    ctx.drawImage(c, 0, 0, 300, 200);
    const d = ctx.getImageData(0, 0, 300, 200).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      // #14121a is the background; anything meaningfully off it is geometry.
      if (Math.abs(d[i] - 20) + Math.abs(d[i + 1] - 18) + Math.abs(d[i + 2] - 26) > 24) n++;
    }
    return n / (300 * 200);
  });

  await browser.close();
  server.close();

  for (const e of errors) console.error(`  ! ${e.split('\n')[0]}`);
  console.log(`${target}: ${info.models.length} model(s), ${info.tris.toLocaleString()} triangles`);
  console.log(`coverage ${(coverage * 100).toFixed(1)}% of frame`);
  for (const s of shots) console.log(`  ${s}`);

  if (errors.length) process.exit(1);
  if (coverage < 0.01) {
    console.error('nothing rendered — the scene is empty or the camera is looking away');
    process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
