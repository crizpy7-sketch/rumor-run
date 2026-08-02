// Vector -> pixel art compiler.
//
//   node tools/genart.mjs                        compile everything
//   node tools/genart.mjs --only cone,barrel     compile a subset (still writes all)
//   node tools/genart.mjs --preview a,b --sheet shots/mine.png
//                                               render a subset to a contact
//                                               sheet WITHOUT writing generated.js
//
// Renders every entry in src/art/shapes/ with real curves at 8x, box-filters it
// down to the target size, and snaps each pixel to the nearest palette colour.
// Output is written to src/art/generated.js as ordinary sprite rows, so
// everything downstream — validation, flipping, tinting, recolouring, the
// contact sheet — treats these identically to hand-authored art.
//
// Committing the generated rows rather than rasterising at boot keeps the art
// checkable by the node verifier and free at runtime.
//
// `--preview` exists so several people can iterate on different shape modules
// at the same time without racing each other for src/art/generated.js.

import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
import { launchOptions } from './browser.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SS = 8;            // supersampling factor
const ALPHA_CUT = 0.45;  // below this a pixel is transparent

const args = process.argv.slice(2);
const arg = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : null);
const preview = arg('--preview');
const sheetOut = arg('--sheet') || 'shots/preview.png';
const only = arg('--only');

async function main() {
  const { server, port } = await serve(0);
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e)));

  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });

  const result = await page.evaluate(async ({ ss, alphaCut, wanted, previewList }) => {
    const { SHAPES } = await import('/src/art/shapes.js');
    const { PAL } = await import('/src/art/sprites.js');

    const keys = Object.keys(PAL);
    const rgb = keys.map((k) => {
      const h = PAL[k];
      return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    });
    const nearest = (r, g, b) => {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < rgb.length; i++) {
        // Weighted to human luminance response so shading ramps quantise the
        // way an eye would group them, not the way raw euclidean RGB does.
        const dr = (r - rgb[i][0]) * 0.5;
        const dg = (g - rgb[i][1]) * 0.7;
        const db = (b - rgb[i][2]) * 0.3;
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) { bestD = d; best = i; }
      }
      return keys[best];
    };

    const render = (shape, opt) => {
      const cv = document.createElement('canvas');
      cv.width = shape.w * ss;
      cv.height = shape.h * ss;
      const ctx = cv.getContext('2d');
      ctx.scale(ss, ss);
      const resolved = {};
      for (const [k, v] of Object.entries(opt || {})) resolved[k] = PAL[v] || v;
      shape.draw(ctx, PAL, resolved);

      const img = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const rows = [];
      for (let y = 0; y < shape.h; y++) {
        let row = '';
        for (let x = 0; x < shape.w; x++) {
          // Box-filter the supersampled block, premultiplied so edges do not
          // bleed the colour of transparent pixels into the average.
          let r = 0; let g = 0; let b = 0; let a = 0;
          for (let sy = 0; sy < ss; sy++) {
            for (let sx = 0; sx < ss; sx++) {
              const i = (((y * ss + sy) * cv.width) + (x * ss + sx)) * 4;
              const al = img[i + 3] / 255;
              r += img[i] * al; g += img[i + 1] * al; b += img[i + 2] * al; a += al;
            }
          }
          const n = ss * ss;
          if (a / n < alphaCut) { row += '.'; continue; }
          row += nearest(r / a, g / a, b / a);
        }
        rows.push(row);
      }
      return rows;
    };

    // Variants are declared by the shape itself, so adding one never means
    // editing this tool.
    const out = {};
    const names = Object.keys(SHAPES).filter((n) => !wanted || wanted.includes(n));
    for (const name of names) {
      const shape = SHAPES[name];
      const variants = shape.variants || [[name, {}]];
      for (const [outName, opt] of variants) out[outName] = render(shape, opt);
    }

    // Preview mode draws a contact sheet in the page and returns nothing else.
    if (previewList) {
      const want = previewList.filter((n) => out[n]);
      const list = want.length ? want : Object.keys(out);
      const scale = 4;
      const pad = 10;
      const labelH = 12;
      const maxW = 1360;
      const boxes = list.map((n) => ({ n, w: out[n][0].length * scale, h: out[n].length * scale }));
      let x = pad; let y = pad; let rowH = 0;
      for (const bx of boxes) {
        if (x + bx.w + pad > maxW) { x = pad; y += rowH + labelH + pad; rowH = 0; }
        bx.x = x; bx.y = y; x += bx.w + pad; rowH = Math.max(rowH, bx.h);
      }
      const cv = document.createElement('canvas');
      cv.width = maxW;
      cv.height = y + rowH + labelH + pad;
      cv.id = 'preview';
      cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99;image-rendering:pixelated';
      document.body.appendChild(cv);
      const ctx = cv.getContext('2d');
      for (let cy = 0; cy < cv.height; cy += 8) {
        for (let cx = 0; cx < cv.width; cx += 8) {
          ctx.fillStyle = ((cx / 8 + cy / 8) | 0) % 2 ? '#4a4652' : '#3f3b47';
          ctx.fillRect(cx, cy, 8, 8);
        }
      }
      const glyphs = await import('/src/art/glyphs.js');
      for (const bx of boxes) {
        const rows = out[bx.n];
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(bx.x - 2, bx.y - 2, bx.w + 4, bx.h + 4);
        for (let py = 0; py < rows.length; py++) {
          for (let px = 0; px < rows[py].length; px++) {
            const ch = rows[py][px];
            if (ch === '.') continue;
            ctx.fillStyle = PAL[ch];
            ctx.fillRect(bx.x + px * scale, bx.y + py * scale, scale, scale);
          }
        }
        glyphs.drawText(ctx, bx.n.slice(0, 18), bx.x, bx.y + bx.h + 2, { color: '#fdf6e0' });
      }
      return { preview: true, count: list.length };
    }

    return { sprites: out };
  }, {
    ss: SS,
    alphaCut: ALPHA_CUT,
    wanted: only ? only.split(',') : null,
    previewList: preview ? preview.split(',') : null,
  });

  if (preview) {
    await mkdir(dirname(join(ROOT, sheetOut)), { recursive: true });
    await page.locator('#preview').screenshot({ path: join(ROOT, sheetOut) });
  }

  await browser.close();
  server.close();

  if (errors.length) {
    for (const e of errors) console.error(`  ! ${e.split('\n')[0]}`);
    process.exit(1);
  }

  if (preview) {
    console.log(`preview of ${result.count} sprite(s) -> ${sheetOut}`);
    return;
  }

  const out = result.sprites;
  const body = Object.entries(out)
    .map(([name, rows]) => `  ${name}: [\n${rows.map((r) => `    '${r}',`).join('\n')}\n  ],`)
    .join('\n');

  const file = `// GENERATED by tools/genart.mjs — do not edit by hand.
//
// Vector sources live in src/art/shapes/. Regenerate with:
//
//   node tools/genart.mjs
//
// These are ordinary sprite rows, palette-locked, so everything downstream
// treats them exactly like hand-authored art.

export const GENERATED = {
${body}
};
`;
  await writeFile(join(ROOT, 'src/art/generated.js'), file);

  const names = Object.keys(out);
  console.log(`generated ${names.length} sprites -> src/art/generated.js`);
  console.log(`  ${names.join(', ')}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
