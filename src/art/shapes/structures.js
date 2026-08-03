// Structures: the things on site that are too big to drive into and too big to
// miss. These are landmarks, not obstacles — they stand well back off the
// shoulder and give the route somewhere to be.
//
// Every entry is drawn with real geometry in target-pixel coordinates and
// compiled onto the palette by tools/genart.mjs.

import { TAU, rr, fillRR, ellipse } from './kit.js';

/**
 * A run of scaffold: standards, ledgers, boards and diagonal braces. Shared by
 * the tower and by the face of the GCS building so they read as the same kit.
 */
function scaffoldBay(ctx, P, x, y, w, h, opts = {}) {
  const { brace = true, board = true, netting = null } = opts;

  if (netting) {
    ctx.fillStyle = netting;
    ctx.fillRect(x, y, w, h);
  }

  // Standards (verticals).
  ctx.fillStyle = P.k;
  ctx.fillRect(x - 0.6, y, 1.6, h);
  ctx.fillRect(x + w - 1.0, y, 1.6, h);
  ctx.fillStyle = P.H;
  ctx.fillRect(x - 0.2, y, 0.9, h);
  ctx.fillRect(x + w - 0.6, y, 0.9, h);

  // Ledger along the top of the lift.
  ctx.fillStyle = P.k;
  ctx.fillRect(x - 0.6, y, w + 1.6, 1.4);
  ctx.fillStyle = P.H;
  ctx.fillRect(x, y + 0.2, w, 0.7);

  // Diagonal brace.
  if (brace) {
    ctx.strokeStyle = P.G;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(x + 0.6, y + h - 1);
    ctx.lineTo(x + w - 1.2, y + 1.5);
    ctx.stroke();
  }

  // Timber boards on the lift.
  if (board) {
    ctx.fillStyle = P.k;
    ctx.fillRect(x - 1.4, y + h - 3.4, w + 3, 3.0);
    ctx.fillStyle = P.s;
    ctx.fillRect(x - 1.0, y + h - 3.1, w + 2.2, 1.3);
    ctx.fillStyle = P.S;
    ctx.fillRect(x - 1.0, y + h - 1.8, w + 2.2, 1.0);
    // Toe board.
    ctx.fillStyle = P.T;
    ctx.fillRect(x - 1.0, y + h - 4.2, w + 2.2, 0.9);
  }
}

/** The three letters, drawn as paths so they stay crisp when quantised. */
function gcsLetters(ctx, P, x, y, size) {
  const r = size / 2;
  ctx.strokeStyle = P.y;
  ctx.lineWidth = Math.max(1.4, size * 0.26);
  ctx.lineCap = 'butt';

  // G
  let cx = x + r;
  ctx.beginPath();
  ctx.arc(cx, y + r, r, -0.42, Math.PI * 1.42, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.98, y + r);
  ctx.lineTo(cx + r * 0.15, y + r);
  ctx.stroke();

  // C
  cx = x + size * 1.35 + r;
  ctx.beginPath();
  ctx.arc(cx, y + r, r, -0.42, Math.PI * 1.42, false);
  ctx.stroke();

  // S — one continuous spine. Built from two opposed arcs it came out as a
  // backwards N, which is exactly the sort of thing only looking at the render
  // catches.
  const sx = x + size * 2.7;
  const sw = size;
  const sh = size;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(sx + sw * 0.92, y + sh * 0.22);
  ctx.quadraticCurveTo(sx + sw * 0.5, y - sh * 0.06, sx + sw * 0.12, y + sh * 0.24);
  ctx.quadraticCurveTo(sx - sw * 0.12, y + sh * 0.48, sx + sw * 0.5, y + sh * 0.52);
  ctx.quadraticCurveTo(sx + sw * 1.12, y + sh * 0.56, sx + sw * 0.88, y + sh * 0.8);
  ctx.quadraticCurveTo(sx + sw * 0.5, y + sh * 1.06, sx + sw * 0.08, y + sh * 0.82);
  ctx.stroke();
}

export const STRUCTURES = {
  // --- the GCS building --------------------------------------------------
  // A concrete frame going up, wrapped in scaffold, with the company name on
  // a banner near the top. This is the thing you drive past all shift.
  gcsBuilding: {
    w: 104, h: 136,
    draw(ctx, P) {
      const left = 6;
      const right = 98;
      const w = right - left;
      const groundY = 130;
      const floors = 5;
      const floorH = 20;
      const topY = groundY - floors * floorH;

      // Ground shadow so it sits rather than floats.
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      ellipse(ctx, 'rgba(0,0,0,0.30)', (left + right) / 2, groundY + 2, w * 0.54, 4);

      // --- concrete frame -------------------------------------------------
      fillRR(ctx, P.k, left - 2, topY - 3, w + 4, groundY - topY + 5, 1.5);
      const shell = ctx.createLinearGradient(left, 0, right, 0);
      shell.addColorStop(0, P.C);
      shell.addColorStop(0.55, P.c);
      shell.addColorStop(1, P.G);
      ctx.fillStyle = shell;
      ctx.fillRect(left, topY, w, groundY - topY);

      // Floor slabs and the dark of the unfinished interior.
      for (let f = 0; f < floors; f++) {
        const y = topY + f * floorH;
        ctx.fillStyle = P.k;
        ctx.fillRect(left, y, w, 2.2);
        ctx.fillStyle = P.H;
        ctx.fillRect(left, y + 2.2, w, 1.0);

        // Bays: glazed lower down, open above, because it is still going up.
        const glazed = f >= floors - 2;
        for (let b = 0; b < 4; b++) {
          const bx = left + 5 + b * ((w - 10) / 4);
          const bw = (w - 10) / 4 - 4;
          ctx.fillStyle = P.k;
          ctx.fillRect(bx, y + 4.5, bw, floorH - 8);
          if (glazed) {
            const glass = ctx.createLinearGradient(bx, y, bx + bw, y + floorH);
            glass.addColorStop(0, P.u);
            glass.addColorStop(1, P.B);
            ctx.fillStyle = glass;
            ctx.fillRect(bx + 0.8, y + 5.2, bw - 1.6, floorH - 9.4);
            ctx.fillStyle = 'rgba(253,246,224,0.35)';
            ctx.fillRect(bx + 1.4, y + 5.8, bw * 0.32, floorH - 10.6);
          } else {
            ctx.fillStyle = P.d;
            ctx.fillRect(bx + 0.8, y + 5.2, bw - 1.6, floorH - 9.4);
            // A column visible through the opening.
            ctx.fillStyle = P.G;
            ctx.fillRect(bx + bw * 0.45, y + 5.2, 2, floorH - 9.4);
          }
        }
      }

      // Rebar sprouting from the unfinished top.
      ctx.strokeStyle = P.x;
      ctx.lineWidth = 0.9;
      for (let i = 0; i < 11; i++) {
        const rx = left + 4 + i * ((w - 8) / 10);
        ctx.beginPath();
        ctx.moveTo(rx, topY);
        ctx.lineTo(rx + (i % 2 ? 1.2 : -1.2), topY - 5 - (i % 3) * 1.6);
        ctx.stroke();
      }

      // --- scaffold up the near face --------------------------------------
      const bayW = 22;
      for (let f = 0; f < floors; f++) {
        const y = topY + f * floorH;
        for (let b = 0; b < 4; b++) {
          scaffoldBay(ctx, P, left + 2 + b * bayW, y, bayW, floorH, {
            brace: (f + b) % 2 === 0,
            netting: f < 2 ? 'rgba(143,166,44,0.22)' : null,
          });
        }
      }

      // Ladder access on the end bay.
      ctx.strokeStyle = P.y;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(left + 5, topY);
      ctx.lineTo(left + 5, groundY);
      ctx.moveTo(left + 10, topY);
      ctx.lineTo(left + 10, groundY);
      ctx.stroke();
      for (let y = topY + 4; y < groundY; y += 5) {
        ctx.beginPath();
        ctx.moveTo(left + 5, y);
        ctx.lineTo(left + 10, y);
        ctx.stroke();
      }

      // --- the banner -------------------------------------------------------
      const bannerY = topY + 4;
      fillRR(ctx, P.k, left + 26, bannerY, 56, 16, 2);
      fillRR(ctx, P.v, left + 27.2, bannerY + 1.2, 53.6, 13.6, 1.5);
      ctx.fillStyle = P.y;
      ctx.fillRect(left + 27.2, bannerY + 1.2, 53.6, 1.2);
      gcsLetters(ctx, P, left + 34, bannerY + 3.4, 11);

      // Site hoarding along the base, with a gate.
      fillRR(ctx, P.k, left - 4, groundY - 12, w + 8, 12, 1);
      ctx.fillStyle = P.b;
      ctx.fillRect(left - 3, groundY - 11, w + 6, 10);
      ctx.fillStyle = P.B;
      for (let i = 0; i < 12; i++) {
        ctx.fillRect(left - 3 + i * ((w + 6) / 12), groundY - 11, 1.2, 10);
      }
      ctx.fillStyle = P.y;
      ctx.fillRect(left - 3, groundY - 11, w + 6, 1.4);
      ctx.fillStyle = P.k;
      ctx.fillRect(left + 40, groundY - 11, 20, 10);
      ctx.fillStyle = P.G;
      ctx.fillRect(left + 41, groundY - 10, 18, 8);
      ctx.fillStyle = P.k;
      ctx.fillRect(left + 49.4, groundY - 10, 1.2, 8);
    },
  },

  // --- a standalone scaffold tower ---------------------------------------
  scaffoldTower: {
    w: 34, h: 92,
    draw(ctx, P) {
      const left = 4;
      const w = 26;
      const lifts = 5;
      const liftH = 17;
      const groundY = 88;
      const topY = groundY - lifts * liftH;

      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ellipse(ctx, 'rgba(0,0,0,0.28)', left + w / 2, groundY + 1, w * 0.6, 3);

      for (let i = 0; i < lifts; i++) {
        scaffoldBay(ctx, P, left, topY + i * liftH, w, liftH, {
          brace: true,
          netting: i === 0 ? 'rgba(143,166,44,0.20)' : null,
        });
      }

      // Base plates on adjustable jacks.
      ctx.fillStyle = P.k;
      ctx.fillRect(left - 2, groundY - 2, 5, 2.4);
      ctx.fillRect(left + w - 3, groundY - 2, 5, 2.4);
      ctx.fillStyle = P.y;
      ctx.fillRect(left - 1.4, groundY - 3.4, 3.6, 1.6);
      ctx.fillRect(left + w - 2.4, groundY - 3.4, 3.6, 1.6);

      // Guard rail and a warning tag at the top lift.
      ctx.fillStyle = P.k;
      ctx.fillRect(left - 1, topY - 5, w + 2, 1.4);
      ctx.fillStyle = P.H;
      ctx.fillRect(left - 0.6, topY - 4.8, w + 1.2, 0.8);
      fillRR(ctx, P.k, left + w - 10, topY - 3, 9, 6, 1);
      ctx.fillStyle = P.y;
      ctx.fillRect(left + w - 9.2, topY - 2.2, 7.4, 4.4);
      ctx.fillStyle = P.k;
      ctx.fillRect(left + w - 6.2, topY - 1.4, 1.4, 2.2);
      ctx.fillRect(left + w - 6.2, topY + 1.2, 1.4, 0.8);
    },
  },
};
