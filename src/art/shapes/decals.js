// Ground decals: the things the cart drives over rather than into.
//
// These lie flat on the road, so they get no outline and no vertical shading —
// what sells them is the shape of the edge and the wear pattern inside it. They
// were the last of the hand-typed art, and a typed grid could not make a
// pothole's rim look broken or a puddle's edge look wet.

import { TAU, ellipse } from './kit.js';

/** An irregular closed blob — the base shape for anything spilled on tarmac. */
function blob(ctx, cx, cy, rx, ry, wobble, seed = 1) {
  const steps = 18;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * TAU;
    // Deterministic wobble so the same decal always has the same outline.
    const n = Math.sin(a * 3 + seed) * 0.5 + Math.sin(a * 5 + seed * 2.3) * 0.3;
    const r = 1 + n * wobble;
    const x = cx + Math.cos(a) * rx * r;
    const y = cy + Math.sin(a) * ry * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export const DECALS = {
  // A hole with a broken rim and a dark floor, deeper on the far side.
  pothole: {
    w: 22, h: 12,
    draw(ctx, P) {
      const cx = 11;
      const cy = 6;
      ctx.fillStyle = P.g;
      blob(ctx, cx, cy, 9.5, 5.0, 0.10, 1.4); ctx.fill();
      ctx.fillStyle = P.k;
      blob(ctx, cx, cy + 0.4, 8.2, 4.1, 0.12, 2.1); ctx.fill();
      ctx.fillStyle = P.d;
      blob(ctx, cx - 0.6, cy + 0.9, 6.0, 2.8, 0.14, 3.3); ctx.fill();
      // Loose chippings around the rim.
      ctx.fillStyle = P.G;
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7 + 0.3;
        ctx.fillRect(cx + Math.cos(a) * 8.6, cy + Math.sin(a) * 4.6, 1, 1);
      }
    },
  },

  // Standing water: dark at the edge, sky reflected in the middle.
  puddle: {
    w: 26, h: 12,
    draw(ctx, P) {
      const cx = 13;
      const cy = 6;
      ctx.fillStyle = P.v;
      blob(ctx, cx, cy, 11.5, 5.0, 0.13, 4.2); ctx.fill();
      const g = ctx.createLinearGradient(0, cy - 5, 0, cy + 5);
      g.addColorStop(0, P.B);
      g.addColorStop(0.55, P.b);
      g.addColorStop(1, P.v);
      ctx.fillStyle = g;
      blob(ctx, cx, cy, 10.0, 3.9, 0.13, 4.2); ctx.fill();
      // Reflection highlight, offset the way a real one sits.
      ctx.fillStyle = P.u;
      ellipse(ctx, P.u, cx - 2.6, cy - 1.0, 3.4, 1.0);
      ctx.fillStyle = 'rgba(253,246,224,0.5)';
      ellipse(ctx, 'rgba(253,246,224,0.5)', cx - 3.2, cy - 1.3, 1.8, 0.5);
    },
  },

  // Loose stone scattered thicker in the middle than at the edges.
  gravel: {
    w: 30, h: 14,
    draw(ctx, P) {
      const cx = 15;
      const cy = 7;
      for (let i = 0; i < 120; i++) {
        // Deterministic scatter, denser toward the centre.
        const a = i * 2.39996;
        const rad = Math.sqrt((i % 47) / 47);
        const x = cx + Math.cos(a) * rad * 14;
        const y = cy + Math.sin(a) * rad * 6.2;
        const tone = i % 5;
        ctx.fillStyle = tone === 0 ? P.C : tone === 1 ? P.c : tone === 2 ? P.H : tone === 3 ? P.G : P.g;
        const s = tone < 2 ? 1 : 1.6;
        ctx.fillRect(x, y, s, s);
      }
    },
  },

  // Fresh concrete: a wet sheen with a trowelled edge and a boot print.
  wetPatch: {
    w: 30, h: 14,
    draw(ctx, P) {
      const cx = 15;
      const cy = 7;
      ctx.fillStyle = P.G;
      blob(ctx, cx, cy, 13.5, 6.0, 0.09, 7.7); ctx.fill();
      ctx.fillStyle = P.c;
      blob(ctx, cx, cy, 12.0, 5.0, 0.09, 7.7); ctx.fill();
      ctx.fillStyle = P.C;
      blob(ctx, cx - 0.8, cy - 0.5, 9.5, 3.6, 0.08, 8.9); ctx.fill();
      // Sheen.
      ctx.fillStyle = 'rgba(253,246,224,0.45)';
      ellipse(ctx, 'rgba(253,246,224,0.45)', cx - 3.5, cy - 1.4, 4.5, 1.2);
      // Somebody already walked through it.
      ctx.fillStyle = P.H;
      ellipse(ctx, P.H, cx + 4.5, cy + 1.0, 1.8, 1.1);
      ellipse(ctx, P.H, cx + 7.8, cy - 0.6, 1.8, 1.1);
    },
  },

  // A single scaffold tube lying across the road.
  pipeLong: {
    w: 40, h: 8,
    draw(ctx, P) {
      const y = 4;
      // Body as a cylinder: dark rim, bright top highlight, shadow beneath.
      ctx.fillStyle = P.k;
      ctx.fillRect(2, y - 3.2, 36, 6.4);
      const g = ctx.createLinearGradient(0, y - 3, 0, y + 3);
      g.addColorStop(0, P.c);
      g.addColorStop(0.3, P.C);
      g.addColorStop(0.62, P.H);
      g.addColorStop(1, P.G);
      ctx.fillStyle = g;
      ctx.fillRect(2.6, y - 2.6, 34.8, 5.2);
      // Ends, drawn as ellipses so the tube reads as hollow.
      ellipse(ctx, P.k, 2.8, y, 1.9, 3.1);
      ellipse(ctx, P.H, 2.8, y, 1.3, 2.4);
      ellipse(ctx, P.g, 2.8, y, 0.7, 1.5);
      ellipse(ctx, P.k, 37.2, y, 1.9, 3.1);
      ellipse(ctx, P.H, 37.2, y, 1.3, 2.4);
      ellipse(ctx, P.g, 37.2, y, 0.7, 1.5);
      // A couple of rust marks so it is not a clean showroom tube.
      ctx.fillStyle = P.x;
      ctx.fillRect(13, y - 1.6, 3, 1.2);
      ctx.fillRect(24, y + 0.6, 4, 1.0);
    },
  },
};
