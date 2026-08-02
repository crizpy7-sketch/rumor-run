// Contact sheet of every sprite, magnified and labelled.
//
//   node tools/artsheet.mjs
//
// Gameplay screenshots are useless for judging a 14px worker. This renders the
// whole ART table at 4x on a neutral ground so each sprite can actually be
// looked at, which is the only way to iterate on pixel art without guessing.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
import { launchOptions } from './browser.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 0;
const SCALE = 4;

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'shots/art-sheet.png';

async function main() {
  await mkdir(join(ROOT, 'shots'), { recursive: true });
  const { server, port } = await serve(PORT);
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction('window.RUMOR_RUN', { timeout: 10000 });

  const size = await page.evaluate(async ({ scale, only: want }) => {
    const art = await import('/src/art/sprites.js');
    const names = (want || Object.keys(art.ART)).filter((n) => art.ART[n]);

    // Lay the sprites out in rows, wrapping at a fixed width.
    const pad = 10;
    const labelH = 12;
    const maxW = 1200;
    const boxes = names.map((n) => {
      const rows = art.ART[n];
      return { n, w: rows[0].length * scale, h: rows.length * scale };
    });
    let x = pad;
    let y = pad;
    let rowH = 0;
    for (const b of boxes) {
      if (x + b.w + pad > maxW) { x = pad; y += rowH + labelH + pad; rowH = 0; }
      b.x = x;
      b.y = y;
      x += b.w + pad;
      rowH = Math.max(rowH, b.h);
    }
    const total = { w: maxW, h: y + rowH + labelH + pad };

    const cv = document.createElement('canvas');
    cv.width = total.w;
    cv.height = total.h;
    cv.id = 'artsheet';
    cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99;image-rendering:pixelated';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Checkerboard so transparent pixels and dark outlines are both visible.
    for (let cy = 0; cy < total.h; cy += 8) {
      for (let cx = 0; cx < total.w; cx += 8) {
        ctx.fillStyle = ((cx / 8 + cy / 8) | 0) % 2 ? '#4a4652' : '#3f3b47';
        ctx.fillRect(cx, cy, 8, 8);
      }
    }

    const glyphs = await import('/src/art/glyphs.js');
    for (const b of boxes) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      art.drawSprite(ctx, b.n, b.x, b.y, { ax: 0, ay: 0, scale });
      glyphs.drawText(ctx, b.n.slice(0, 18), b.x, b.y + b.h + 2, { color: '#fdf6e0' });
    }
    return total;
  }, { scale: SCALE, only });

  const file = join(ROOT, out);
  await page.locator('#artsheet').screenshot({ path: file });
  await browser.close();
  server.close();

  console.log(`art sheet -> ${out} (${size.w}x${size.h})  errors ${errors.length}`);
  for (const e of errors) console.log(`  ! ${e}`);
  if (errors.length) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });
