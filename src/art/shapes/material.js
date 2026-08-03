// Scaffold material: the stuff that gets stacked on the road and left there.
//
// Every entry is drawn with real geometry in target-pixel coordinates and
// compiled onto the palette by tools/genart.mjs. See ./kit.js for the shared
// helpers, and ./hero.js for worked examples.
//
//   { w, h, variants?: [[outputName, opts]], draw(ctx, PAL, opts) }

import { TAU, rr, fillRR, ellipse, wheel, hardHat, vestBody, head, legs } from './kit.js';

// A steel tube end: outer ring, inner bore, highlight arc upper-left.
function pipeEnd(ctx, P, cx, cy, r) {
  ellipse(ctx, P.k, cx, cy, r + 0.4, r + 0.4);
  ellipse(ctx, P.H, cx, cy, r, r);
  ellipse(ctx, P.g, cx, cy, r * 0.56, r * 0.56);
  // Highlight arc, upper-left rim.
  ctx.strokeStyle = P.W;
  ctx.lineWidth = r * 0.32;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, Math.PI * 1.05, Math.PI * 1.65);
  ctx.stroke();
}

export const MATERIAL = {
  // --- pipePile: pyramid of scaffold tubes seen end-on ---------------------
  pipePile: {
    w: 30, h: 20,
    draw(ctx, P) {
      const r = 2.55;
      const rows = [
        { n: 5, y: 16.6 },
        { n: 4, y: 12.0 },
        { n: 3, y: 7.7 },
      ];
      const spacing = r * 2.0;
      for (const row of rows) {
        const totalW = (row.n - 1) * spacing;
        const startX = 15 - totalW / 2;
        for (let i = 0; i < row.n; i++) {
          pipeEnd(ctx, P, startX + i * spacing, row.y, r);
        }
      }
    },
  },

  // --- frameStack: blue scaffold frames leaning, stacked for depth ---------
  frameStack: {
    w: 26, h: 24,
    draw(ctx, P) {
      // Draw back-to-front so nearer frames overlap.
      function frame(cx, topY, botY, halfW, tube, shade) {
        const legL = cx - halfW;
        const legR = cx + halfW;
        // Legs.
        ctx.strokeStyle = P.k;
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(legL, topY); ctx.lineTo(legL, botY);
        ctx.moveTo(legR, topY); ctx.lineTo(legR, botY);
        ctx.stroke();
        ctx.strokeStyle = tube;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(legL, topY); ctx.lineTo(legL, botY);
        ctx.moveTo(legR, topY); ctx.lineTo(legR, botY);
        ctx.stroke();
        // Rungs (horizontal braces).
        const rungYs = [topY + (botY - topY) * 0.28, topY + (botY - topY) * 0.68];
        ctx.strokeStyle = P.k;
        ctx.lineWidth = 2.2;
        for (const ry of rungYs) {
          ctx.beginPath(); ctx.moveTo(legL, ry); ctx.lineTo(legR, ry); ctx.stroke();
        }
        ctx.strokeStyle = shade;
        ctx.lineWidth = 1.1;
        for (const ry of rungYs) {
          ctx.beginPath(); ctx.moveTo(legL, ry); ctx.lineTo(legR, ry); ctx.stroke();
        }
        // Diagonal brace.
        ctx.strokeStyle = P.k;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(legL, rungYs[0]); ctx.lineTo(legR, rungYs[1]);
        ctx.stroke();
        ctx.strokeStyle = shade;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(legL, rungYs[0]); ctx.lineTo(legR, rungYs[1]);
        ctx.stroke();
        // Foot pads.
        ellipse(ctx, P.k, legL, botY, 1.5, 0.9);
        ellipse(ctx, P.g, legL, botY, 1.0, 0.55);
        ellipse(ctx, P.k, legR, botY, 1.5, 0.9);
        ellipse(ctx, P.g, legR, botY, 1.0, 0.55);
      }

      // Back frame: smaller, higher and to the left, dim so it reads as
      // farther away, only its top and one leg peeking past the front frame.
      frame(6.6, 1.6, 14.8, 3.8, P.B, P.v);
      // Front frame: dominant, bigger, brighter blue, offset lower-right so
      // the two never fully coincide.
      frame(16.5, 3.4, 22.6, 6.8, P.b, P.B);
    },
  },

  // --- plankBundle: strapped stack of timber boards -------------------------
  plankBundle: {
    w: 32, h: 16,
    draw(ctx, P) {
      const left = 2.5, right = 29.5;
      const plankH = 1.7;
      const tones = [P.s, P.S, P.s, P.S, P.s, P.S];
      const topY = 3.2;
      // Outline block behind everything.
      fillRR(ctx, P.k, left - 0.6, topY - 0.6, right - left + 1.2, plankH * tones.length + 1.2, 1.2);
      for (let i = 0; i < tones.length; i++) {
        const y = topY + i * plankH;
        ctx.fillStyle = tones[i];
        ctx.fillRect(left, y, right - left, plankH - 0.2);
        // End grain: rounded left cap in a lighter/darker tone with rings.
        ellipse(ctx, tones[i], left, y + (plankH - 0.2) / 2, 1.0, (plankH - 0.2) / 2);
        ctx.strokeStyle = P.T;
        ctx.lineWidth = 0.35;
        ctx.beginPath();
        ctx.ellipse(left, y + (plankH - 0.2) / 2, 0.6, (plankH - 0.2) / 2 - 0.35, 0, 0, TAU);
        ctx.stroke();
      }
      // Straps: two dark metal bands wrapping the bundle.
      const strapXs = [8.5, 23.5];
      for (const sx of strapXs) {
        fillRR(ctx, P.k, sx - 1.1, topY - 1.2, 2.2, plankH * tones.length + 2.4, 0.6);
        ctx.fillStyle = P.g;
        ctx.fillRect(sx - 0.75, topY - 1.0, 1.5, plankH * tones.length + 2.0);
        ctx.fillStyle = P.G;
        ctx.fillRect(sx - 0.3, topY - 1.0, 0.5, plankH * tones.length + 2.0);
      }
    },
  },

  // --- jacks: adjustable base jacks at slightly different heights -----------
  jacks: {
    w: 26, h: 20,
    draw(ctx, P) {
      function jack(cx, rodTop) {
        const baseY = 18.6;
        const nutY = baseY - 3.6;
        // Base plate: a flat plate seen at a slight angle, wide and squat.
        ellipse(ctx, P.k, cx, baseY, 3.4, 1.5);
        ctx.fillStyle = P.g;
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 0.1, 2.9, 1.2, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = P.G;
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 0.35, 2.9, 1.2, 0, Math.PI, TAU);
        ctx.fill();
        // Threaded rod, thick enough to read: dark outline, steel fill.
        ctx.fillStyle = P.k;
        fillRR(ctx, P.k, cx - 1.3, rodTop, 2.6, baseY - rodTop - 1.0, 0.6);
        ctx.fillStyle = P.H;
        ctx.fillRect(cx - 0.9, rodTop + 0.3, 1.8, baseY - rodTop - 1.6);
        ctx.fillStyle = P.G;
        ctx.fillRect(cx + 0.15, rodTop + 0.3, 0.65, baseY - rodTop - 1.6);
        // Thread ticks: bold horizontal-ish rungs up the rod.
        ctx.strokeStyle = P.G;
        ctx.lineWidth = 0.6;
        for (let ty = rodTop + 1.6; ty < nutY - 1.6; ty += 1.5) {
          ctx.beginPath();
          ctx.moveTo(cx - 0.9, ty);
          ctx.lineTo(cx + 0.9, ty + 0.6);
          ctx.stroke();
        }
        // Round steel cap at the very top of the rod.
        ellipse(ctx, P.k, cx, rodTop, 1.5, 1.0);
        ellipse(ctx, P.H, cx, rodTop - 0.1, 1.15, 0.75);
        // Big yellow adjusting nut, wrapped around the rod.
        ellipse(ctx, P.k, cx, nutY, 3.1, 2.1);
        ctx.fillStyle = P.Y;
        ctx.beginPath();
        ctx.ellipse(cx, nutY, 2.6, 1.7, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = P.y;
        ctx.beginPath();
        ctx.ellipse(cx, nutY - 0.4, 2.6, 1.5, 0, Math.PI, TAU);
        ctx.fill();
        ctx.fillStyle = P.Z;
        ctx.fillRect(cx - 2.6, nutY + 0.7, 5.2, 1.1);
        ctx.fillStyle = P.W;
        ctx.beginPath();
        ctx.ellipse(cx - 1.1, nutY - 0.7, 1.0, 0.5, -0.3, 0, TAU);
        ctx.fill();
      }

      jack(4.5, 5.4);
      jack(13.0, 2.6);
      jack(21.5, 7.4);
    },
  },

  // --- couplers: open timber crate heaped with small steel couplers --------
  couplers: {
    w: 28, h: 18,
    draw(ctx, P) {
      const cxL = 2.0, cxR = 26.0, botY = 17.0, wallTop = 8.6;
      // Crate body: simple timber box, front face plus a sliver of each side
      // wall for depth — no fussy trapezoids to muddy the silhouette.
      fillRR(ctx, P.k, cxL - 0.8, wallTop - 0.8, cxR - cxL + 1.6, botY - wallTop + 1.6, 1.0);
      ctx.fillStyle = P.s;
      ctx.fillRect(cxL, wallTop, cxR - cxL, botY - wallTop);
      // Plank seams on the front face.
      ctx.strokeStyle = P.S;
      ctx.lineWidth = 0.5;
      for (let px = cxL + 4; px < cxR; px += 4.2) {
        ctx.beginPath(); ctx.moveTo(px, wallTop + 0.3); ctx.lineTo(px, botY - 0.3); ctx.stroke();
      }
      // Dark interior strip along the top rim, so the pile reads as sitting
      // inside the crate rather than floating on a lid.
      fillRR(ctx, P.T, cxL + 0.6, wallTop - 1.0, cxR - cxL - 1.2, 2.0, 0.6);
      // Side wall slivers.
      ctx.fillStyle = P.S;
      ctx.fillRect(cxL - 0.8, wallTop, 0.8, botY - wallTop);
      ctx.fillRect(cxR, wallTop, 0.8, botY - wallTop);
      // Front rail cap, catching the light.
      ctx.fillStyle = P.S;
      fillRR(ctx, P.S, cxL - 0.4, botY - 1.6, cxR - cxL + 0.8, 1.8, 0.6);

      // A single steel coupler shape: a squarish clamp body with a bolt boss.
      function coupler(px, py, ang, size, tone, shadeT) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang);
        const w = size * 1.5, h = size * 1.05;
        fillRR(ctx, P.k, -w / 2 - 0.3, -h / 2 - 0.3, w + 0.6, h + 0.6, size * 0.35);
        fillRR(ctx, tone, -w / 2, -h / 2, w, h, size * 0.3);
        // Shaded lower-right half for volume.
        ctx.fillStyle = shadeT;
        ctx.globalAlpha = 0.55;
        fillRR(ctx, shadeT, 0, -h / 2, w / 2, h, size * 0.25);
        ctx.globalAlpha = 1;
        // Bolt boss.
        ellipse(ctx, P.k, w * 0.18, 0, size * 0.36, size * 0.36);
        ellipse(ctx, P.c, w * 0.18, -size * 0.03, size * 0.2, size * 0.2);
        // Highlight edge, upper-left.
        ctx.strokeStyle = P.W;
        ctx.lineWidth = size * 0.22;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(-w / 2 + size * 0.15, h / 2 - size * 0.15);
        ctx.lineTo(-w / 2 + size * 0.15, -h / 2 + size * 0.15);
        ctx.lineTo(w / 2 - size * 0.15, -h / 2 + size * 0.15);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Hand-placed heap: fewer, bigger, clearly separated couplers so each
      // one reads as an individual piece of hardware, piled and jumbled.
      const pile = [
        [7.0, 12.4, -0.3, 2.6, P.H, P.g],
        [11.5, 13.6, 0.5, 2.9, P.G, P.g],
        [16.4, 12.6, -0.6, 2.7, P.c, P.G],
        [20.6, 13.8, 0.25, 2.6, P.H, P.g],
        [9.0, 9.6, 0.9, 2.4, P.c, P.G],
        [13.6, 8.8, -0.4, 2.5, P.G, P.g],
        [18.2, 9.4, 0.6, 2.3, P.H, P.g],
        [5.4, 9.2, -0.8, 2.1, P.G, P.g],
        [22.6, 10.0, -0.5, 2.2, P.c, P.G],
        [11.0, 5.8, 0.3, 2.1, P.H, P.g],
        [15.6, 5.4, -0.7, 2.0, P.c, P.G],
        [8.2, 6.4, 0.7, 1.9, P.G, P.g],
      ];
      for (const [px, py, ang, size, tone, shade] of pile) coupler(px, py, ang, size, tone, shade);
    },
  },

  // --- steelBeams: stack of I-beams seen end-on -----------------------------
  steelBeams: {
    w: 32, h: 14,
    draw(ctx, P) {
      // A short, chunky receding body — thick enough to read as solid steel,
      // not a wire — drawn first so the end cap sits on top of it.
      function beamBody(cx, cy, w, h, runLen, tone) {
        const nearHalf = h / 2;
        const farHalf = h * 0.42;
        const dx = runLen, dy = -runLen * 0.18;
        ctx.fillStyle = P.k;
        ctx.beginPath();
        ctx.moveTo(cx + w / 2 - 0.3, cy - nearHalf - 0.3);
        ctx.lineTo(cx + w / 2 + dx, cy - farHalf + dy - 0.3);
        ctx.lineTo(cx + w / 2 + dx, cy + farHalf + dy + 0.3);
        ctx.lineTo(cx + w / 2 - 0.3, cy + nearHalf + 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = tone;
        ctx.beginPath();
        ctx.moveTo(cx + w / 2 - 0.2, cy - nearHalf * 0.7);
        ctx.lineTo(cx + w / 2 + dx, cy - farHalf + dy);
        ctx.lineTo(cx + w / 2 + dx, cy + farHalf + dy);
        ctx.lineTo(cx + w / 2 - 0.2, cy + nearHalf * 0.7);
        ctx.closePath();
        ctx.fill();
        // Top edge catches the light.
        ctx.fillStyle = P.H;
        ctx.beginPath();
        ctx.moveTo(cx + w / 2 - 0.2, cy - nearHalf * 0.7);
        ctx.lineTo(cx + w / 2 + dx, cy - farHalf + dy);
        ctx.lineTo(cx + w / 2 + dx, cy - farHalf + dy + h * 0.14);
        ctx.lineTo(cx + w / 2 - 0.2, cy - nearHalf * 0.7 + h * 0.14);
        ctx.closePath();
        ctx.fill();
      }

      // The I cross-section on the near end: bold flanges and a web, an
      // unmistakable capital "I" silhouette, big enough to read at 4x.
      function iBeamEnd(cx, cy, w, h) {
        const flangeH = h * 0.26;
        const webW = w * 0.32;
        fillRR(ctx, P.k, cx - w / 2 - 0.6, cy - h / 2 - 0.6, w + 1.2, h + 1.2, 0.8);
        // Bottom flange (shaded).
        ctx.fillStyle = P.g;
        ctx.fillRect(cx - w / 2, cy + h / 2 - flangeH, w, flangeH);
        // Web.
        ctx.fillStyle = P.G;
        ctx.fillRect(cx - webW / 2, cy - h / 2 + flangeH, webW, h - flangeH * 2);
        // Top flange (lit).
        ctx.fillStyle = P.c;
        ctx.fillRect(cx - w / 2, cy - h / 2, w, flangeH);
        // Highlight streak, upper-left corner of the top flange.
        ctx.fillStyle = P.W;
        ctx.fillRect(cx - w / 2 + 0.5, cy - h / 2 + 0.3, w * 0.4, flangeH * 0.35);
      }

      // Two beams resting side by side, a third nested above in the gap —
      // the same pyramid trick as pipePile, so the ends never touch.
      const rows = [
        { cx: 8.5, cy: 10.0, w: 8.6, h: 6.6, len: 9 },
        { cx: 22.0, cy: 10.4, w: 8.2, h: 6.2, len: 8 },
        { cx: 15.0, cy: 3.6, w: 7.4, h: 5.4, len: 7 },
      ];
      for (const row of rows) {
        beamBody(row.cx, row.cy, row.w, row.h, row.len, P.H);
        iBeamEnd(row.cx, row.cy, row.w, row.h);
      }
    },
  },

  // --- sandpile: heap of sand ------------------------------------------------
  sandpile: {
    w: 24, h: 14,
    draw(ctx, P) {
      const cx = 12, baseY = 12.6;
      // Base shadow ellipse.
      ellipse(ctx, 'rgba(0,0,0,0.25)', cx, baseY + 0.4, 11.0, 2.0);
      // Outline mound.
      ctx.fillStyle = P.k;
      ctx.beginPath();
      ctx.moveTo(cx - 11.2, baseY);
      ctx.quadraticCurveTo(cx - 9.5, 2.6, cx - 1.5, 1.4);
      ctx.quadraticCurveTo(cx + 3.0, 1.0, cx + 6.5, 4.2);
      ctx.quadraticCurveTo(cx + 11.6, 6.5, cx + 11.2, baseY);
      ctx.closePath();
      ctx.fill();
      // Gradient body: light crest (upper-left) to dark shadow (lower-right).
      const g = ctx.createLinearGradient(cx - 8, 1, cx + 8, baseY);
      g.addColorStop(0, P.y);
      g.addColorStop(0.45, P.Y);
      g.addColorStop(1, P.Z);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - 10.4, baseY - 0.4);
      ctx.quadraticCurveTo(cx - 8.8, 3.2, cx - 1.5, 2.1);
      ctx.quadraticCurveTo(cx + 2.8, 1.7, cx + 6.0, 4.7);
      ctx.quadraticCurveTo(cx + 10.6, 6.8, cx + 10.4, baseY - 0.4);
      ctx.closePath();
      ctx.fill();
      // Crest highlight streak.
      ctx.fillStyle = P.W;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(cx - 3.2, 3.6, 4.4, 1.3, -0.15, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Grain texture: scattered dots.
      let seed = 3;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (let i = 0; i < 22; i++) {
        const t = rnd();
        const px = cx - 10 + t * 20;
        // Approximate the mound's local top by lerping between the two arc
        // control heights so grains sit on/under the surface, not above it.
        const surfaceY = 2.2 + Math.pow((px - (cx - 1.5)) / 10, 2) * 5.5;
        const py = surfaceY + rnd() * (baseY - surfaceY) * 0.85;
        const tone = px < cx - 1 ? P.Z : (rnd() > 0.5 ? P.Y : P.Z);
        ctx.fillStyle = tone;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(px, py, 0.6, 0.5);
        ctx.globalAlpha = 1;
      }
    },
  },
};
