// HUD chrome. Everything here is drawn in screen space after the world, and
// nothing in it moves with the camera.

import { drawText, textWidth, wrapText } from '../art/glyphs.js';
import { VIEW_W, VIEW_H } from './road.js';

const INK = '#171418';
const PAPER = '#fdf6e0';
const GOLD = '#ffd24a';
const LIME = '#c4e022';
const EMBER = '#ff6a3d';

function panel(ctx, x, y, w, h, alpha = 0.72) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

export function drawHud(ctx, { level, run, buggy, route, stats }) {
  // --- top strip --------------------------------------------------------
  panel(ctx, 0, 0, VIEW_W, 20, 0.66);
  drawText(ctx, `L${level.id}`, 3, 2, { color: GOLD });
  drawText(ctx, level.name, 20, 2, { color: PAPER });

  const score = String(run.score).padStart(6, '0');
  drawText(ctx, score, VIEW_W - 3, 2, { color: GOLD, align: 'right' });

  // Delivery quota.
  const met = run.delivered >= level.quota;
  drawText(ctx, 'EARS', 3, 11, { color: '#7b7684' });
  drawText(ctx, `${run.delivered}/${level.quota}`, 29, 11, { color: met ? LIME : PAPER });

  // Sheets, one tick each.
  const maxTicks = Math.min(stats.sheetMax, 18);
  const tickW = 3;
  const ticksX = VIEW_W - 3 - maxTicks * tickW;
  for (let i = 0; i < maxTicks; i++) {
    const has = i < run.sheets;
    ctx.fillStyle = has ? (run.sheets <= 2 ? EMBER : PAPER) : '#3a3640';
    ctx.fillRect(ticksX + i * tickW, 12, 2, 6);
  }
  drawText(ctx, 'PAPER', ticksX - 34, 11, { color: '#7b7684' });

  // --- combo ------------------------------------------------------------
  if (run.combo > 1) {
    const label = `X${run.combo}`;
    const w = textWidth(label, { scale: 2 });
    panel(ctx, 2, VIEW_H - 34, w + 6, 20, 0.55);
    drawText(ctx, label, 5, VIEW_H - 32, { color: GOLD, scale: 2, shadow: INK });
    const frac = Math.max(0, Math.min(1, run.comboTimer / stats.comboHold));
    ctx.fillStyle = '#3a3640';
    ctx.fillRect(5, VIEW_H - 17, w, 2);
    ctx.fillStyle = frac > 0.35 ? LIME : EMBER;
    ctx.fillRect(5, VIEW_H - 17, Math.round(w * frac), 2);
  }

  // --- speed ------------------------------------------------------------
  const cap = level.speedCap + stats.speedBonus;
  const sp = Math.max(0, Math.min(1.2, buggy.speed / cap));
  const barW = 52;
  panel(ctx, VIEW_W - barW - 6, VIEW_H - 24, barW + 4, 16, 0.55);
  drawText(ctx, 'SPD', VIEW_W - barW - 4, VIEW_H - 22, { color: '#7b7684' });
  ctx.fillStyle = '#3a3640';
  ctx.fillRect(VIEW_W - barW - 4, VIEW_H - 13, barW, 3);
  ctx.fillStyle = buggy.boost > 0 ? EMBER : sp > 0.85 ? GOLD : LIME;
  ctx.fillRect(VIEW_W - barW - 4, VIEW_H - 13, Math.round(barW * Math.min(sp, 1)), 3);

  // --- route progress ---------------------------------------------------
  const y = VIEW_H - 5;
  panel(ctx, 0, y - 1, VIEW_W, 6, 0.6);
  ctx.fillStyle = '#3a3640';
  ctx.fillRect(4, y + 1, VIEW_W - 8, 2);
  const px = (s) => 4 + (VIEW_W - 8) * Math.max(0, Math.min(1, s / route.length));
  for (const tg of route.targets) {
    ctx.fillStyle = tg.hit ? LIME : '#7b7684';
    ctx.fillRect(Math.round(px(tg.s)), y, 1, 4);
  }
  ctx.fillStyle = GOLD;
  const bx = Math.round(px(buggy.s));
  ctx.fillRect(bx - 1, y - 1, 3, 6);
  ctx.fillStyle = PAPER;
  ctx.fillRect(VIEW_W - 5, y - 1, 2, 6);
}

export function drawBanner(ctx, text, alpha = 1) {
  const lines = wrapText(text, VIEW_W - 32);
  const h = lines.length * 10 + 10;
  const y = 74;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = INK;
  ctx.fillRect(8, y - 2, VIEW_W - 16, h + 4);
  ctx.fillStyle = GOLD;
  ctx.fillRect(8, y - 2, VIEW_W - 16, 1);
  ctx.fillRect(8, y + h + 1, VIEW_W - 16, 1);
  lines.forEach((line, i) => {
    drawText(ctx, line, VIEW_W / 2, y + 5 + i * 10, { color: PAPER, align: 'center' });
  });
  ctx.restore();
}

/** Shared framing for the non-play screens. */
export function drawScreenFrame(ctx, title, { subtitle = '', accent = GOLD } = {}) {
  ctx.fillStyle = '#1b1a1f';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Hazard-tape header.
  for (let x = 0; x < VIEW_W; x += 8) {
    ctx.fillStyle = ((x / 8) | 0) % 2 ? accent : '#26242c';
    ctx.fillRect(x, 0, 8, 4);
    ctx.fillRect(x + 4, VIEW_H - 4, 8, 4);
  }
  drawText(ctx, title, VIEW_W / 2, 12, { color: accent, align: 'center', scale: 2, shadow: INK });
  if (subtitle) drawText(ctx, subtitle, VIEW_W / 2, 30, { color: '#b9b19a', align: 'center' });
}

export { INK, PAPER, GOLD, LIME, EMBER, panel };
