// HUD chrome. Everything here is drawn in screen space after the world, and
// nothing in it moves with the camera.

import { drawText, textWidth, wrapText } from '../art/glyphs.js';
import { drawSprite } from '../art/sprites.js';
import { VIEW_W, VIEW_H } from './road.js';

const INK = '#14121a';
const PAPER = '#fdf6e0';
const GOLD = '#ffd24a';
const LIME = '#c8e04a';
const EMBER = '#ff7a3d';
const DIM = '#8b8598';

function panel(ctx, x, y, w, h, alpha = 0.72) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** A hazard-tape rule, the same one the site uses on everything. */
function tape(ctx, x, y, w, h = 3, a = GOLD, b = '#26242c') {
  for (let i = 0; i < w; i += 6) {
    ctx.fillStyle = ((i / 6) | 0) % 2 ? a : b;
    ctx.fillRect(x + i, y, Math.min(6, w - i), h);
  }
}

export function drawHud(ctx, { level, run, buggy, route, stats, sup }) {
  // --- top strip --------------------------------------------------------
  panel(ctx, 0, 0, VIEW_W, 26, 0.7);
  tape(ctx, 0, 26, VIEW_W, 2);

  drawText(ctx, `L${level.id}`, 4, 3, { color: GOLD });
  drawText(ctx, level.name, 24, 3, { color: PAPER });
  drawText(ctx, String(run.score).padStart(7, '0'), VIEW_W - 4, 3, { color: GOLD, align: 'right' });

  const met = run.delivered >= level.quota;
  drawText(ctx, 'EARS', 4, 14, { color: DIM });
  drawText(ctx, `${run.delivered}/${level.quota}`, 34, 14, { color: met ? LIME : PAPER });

  // Paper, one tick each.
  const maxTicks = Math.min(stats.sheetMax, 22);
  const tickW = 4;
  const ticksX = VIEW_W - 4 - maxTicks * tickW;
  for (let i = 0; i < maxTicks; i++) {
    const has = i < run.sheets;
    ctx.fillStyle = has ? (run.sheets <= 2 ? EMBER : PAPER) : '#332f3a';
    ctx.fillRect(ticksX + i * tickW, 15, 3, 8);
  }
  drawText(ctx, 'PAPER', ticksX - 40, 14, { color: DIM });

  // --- active rumor fuel ------------------------------------------------
  const active = [];
  if (run.bombaTime > 0) active.push(['BOMBA TIME', run.bombaTime, 8, EMBER]);
  if (run.shield > 0) active.push(['VEST', run.shield, 12, LIME]);
  if (run.confusion > 0) active.push(['CONFUSION', run.confusion, 9, GOLD]);
  if (buggy.boost > 0) active.push(['BOOST', buggy.boost, 5, EMBER]);
  active.forEach(([label, left, full, colour], i) => {
    const y = 34 + i * 14;
    const w = 76;
    panel(ctx, 4, y, w, 12, 0.6);
    drawText(ctx, label, 7, y + 1, { color: colour });
    ctx.fillStyle = '#332f3a';
    ctx.fillRect(7, y + 9, w - 6, 2);
    ctx.fillStyle = colour;
    ctx.fillRect(7, y + 9, Math.round((w - 6) * Math.max(0, left / full)), 2);
  });

  // --- the superintendent, closing ---------------------------------------
  if (sup && sup.active) {
    const gap = buggy.s - sup.s;
    if (gap < 26) {
      const heat = 1 - Math.max(0, gap - 4) / 22;
      const w = 108;
      panel(ctx, VIEW_W / 2 - w / 2, 32, w, 14, 0.72);
      drawText(ctx, 'SUPER BEHIND YOU', VIEW_W / 2, 35, {
        color: Math.floor(run.time * 8) % 2 && heat > 0.6 ? EMBER : PAPER, align: 'center',
      });
      ctx.fillStyle = '#332f3a';
      ctx.fillRect(VIEW_W / 2 - w / 2 + 4, 43, w - 8, 2);
      ctx.fillStyle = EMBER;
      ctx.fillRect(VIEW_W / 2 - w / 2 + 4, 43, Math.round((w - 8) * heat), 2);
    }
  }

  // --- combo -------------------------------------------------------------
  if (run.combo > 1) {
    const label = `X${run.combo}`;
    const w = textWidth(label, { scale: 2 });
    panel(ctx, 3, VIEW_H - 44, w + 8, 26, 0.55);
    drawText(ctx, label, 7, VIEW_H - 41, { color: GOLD, scale: 2, shadow: INK });
    const frac = Math.max(0, Math.min(1, run.comboTimer / stats.comboHold));
    ctx.fillStyle = '#332f3a';
    ctx.fillRect(7, VIEW_H - 24, w, 3);
    ctx.fillStyle = frac > 0.35 ? LIME : EMBER;
    ctx.fillRect(7, VIEW_H - 24, Math.round(w * frac), 3);
  }

  // --- speed -------------------------------------------------------------
  const cap = level.speedCap + stats.speedBonus;
  const sp = Math.max(0, Math.min(1.2, buggy.speed / cap));
  const barW = 72;
  panel(ctx, VIEW_W - barW - 8, VIEW_H - 32, barW + 5, 20, 0.55);
  drawText(ctx, 'SPD', VIEW_W - barW - 6, VIEW_H - 29, { color: DIM });
  ctx.fillStyle = '#332f3a';
  ctx.fillRect(VIEW_W - barW - 6, VIEW_H - 18, barW, 4);
  ctx.fillStyle = buggy.boost > 0 ? EMBER : sp > 0.85 ? GOLD : LIME;
  ctx.fillRect(VIEW_W - barW - 6, VIEW_H - 18, Math.round(barW * Math.min(sp, 1)), 4);

  // --- route progress ----------------------------------------------------
  const y = VIEW_H - 7;
  panel(ctx, 0, y - 2, VIEW_W, 9, 0.6);
  ctx.fillStyle = '#332f3a';
  ctx.fillRect(5, y + 1, VIEW_W - 10, 3);
  const px = (s) => 5 + (VIEW_W - 10) * Math.max(0, Math.min(1, s / route.length));
  for (const tg of route.targets) {
    ctx.fillStyle = tg.hit ? LIME : DIM;
    ctx.fillRect(Math.round(px(tg.s)), y, 1, 5);
  }
  for (const p of route.pickups) {
    if (p.taken) continue;
    ctx.fillStyle = GOLD;
    ctx.fillRect(Math.round(px(p.s)), y + 1, 1, 3);
  }
  ctx.fillStyle = GOLD;
  ctx.fillRect(Math.round(px(buggy.s)) - 1, y - 2, 3, 8);
  // The trailer office, waiting at the end.
  ctx.fillStyle = PAPER;
  ctx.fillRect(VIEW_W - 7, y - 2, 3, 8);
}

export function drawBanner(ctx, text, alpha = 1) {
  const lines = wrapText(text, VIEW_W - 44);
  const h = lines.length * 11 + 14;
  const y = 96;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = INK;
  ctx.fillRect(12, y - 3, VIEW_W - 24, h + 6);
  tape(ctx, 12, y - 3, VIEW_W - 24, 2);
  tape(ctx, 12, y + h + 1, VIEW_W - 24, 2);
  lines.forEach((line, i) => {
    drawText(ctx, line, VIEW_W / 2, y + 8 + i * 11, { color: PAPER, align: 'center' });
  });
  ctx.restore();
}

/** Shared framing for the non-play screens. */
export function drawScreenFrame(ctx, title, { subtitle = '', accent = GOLD } = {}) {
  ctx.fillStyle = '#1b1a1f';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // A faint brick wall behind everything, like the sheet's header.
  for (let y = 0; y < VIEW_H; y += 8) {
    for (let x = (y / 8) % 2 ? -8 : 0; x < VIEW_W; x += 16) {
      ctx.fillStyle = '#211f27';
      ctx.fillRect(x + 1, y + 1, 14, 6);
    }
  }
  tape(ctx, 0, 0, VIEW_W, 5, accent);
  tape(ctx, 0, VIEW_H - 5, VIEW_W, 5, accent);

  drawText(ctx, title, VIEW_W / 2, 14, { color: accent, align: 'center', scale: 2, shadow: INK });
  if (subtitle) drawText(ctx, subtitle, VIEW_W / 2, 34, { color: '#b9b19a', align: 'center' });
}

export { INK, PAPER, GOLD, LIME, EMBER, DIM, panel, tape };
