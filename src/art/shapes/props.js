// Site furniture: signage, fencing, lighting, and the crane hook.
//
// Every entry is drawn with real geometry in target-pixel coordinates and
// compiled onto the palette by tools/genart.mjs. See ./kit.js for the shared
// helpers, and ./hero.js for worked examples.
//
//   { w, h, variants?: [[outputName, opts]], draw(ctx, PAL, opts) }

import { TAU, rr, fillRR, ellipse } from './kit.js';

// --- shared sign parts -------------------------------------------------

/** Grey channel post, outlined, with a thin highlight down one edge. */
function signPost(ctx, P, cx, top, bottom) {
  const w = 1.7;
  fillRR(ctx, P.k, cx - w / 2 - 0.5, top, w + 1.0, bottom - top, 0.6);
  fillRR(ctx, P.G, cx - w / 2, top + 0.4, w, bottom - top - 0.4, 0.5);
  ctx.fillStyle = P.H;
  ctx.fillRect(cx - w / 2 + 0.2, top + 0.6, 0.45, bottom - top - 1.2);
}

/** A yellow diamond warning sign: an actual rotated square, black-bordered. */
function diamondSign(ctx, P, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  const s = r * 1.42;
  ctx.fillStyle = P.k;
  rr(ctx, -s / 2, -s / 2, s, s, s * 0.12);
  ctx.fill();
  const s2 = s - 1.6;
  ctx.fillStyle = P.y;
  rr(ctx, -s2 / 2, -s2 / 2, s2, s2, s2 * 0.12);
  ctx.fill();
  ctx.restore();
  // Shade the lower-right quarter for form (light is upper left).
  ctx.fillStyle = 'rgba(20,18,26,0.16)';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.92, cy);
  ctx.lineTo(cx, cy + r * 0.92);
  ctx.closePath();
  ctx.fill();
}

function pictoStay(ctx, P, cx, cy) {
  // A simple standing-figure pictogram: head + trapezoid body.
  ellipse(ctx, P.k, cx, cy - 2.3, 1.1, 1.1);
  ctx.fillStyle = P.k;
  ctx.beginPath();
  ctx.moveTo(cx - 0.9, cy - 1.1);
  ctx.lineTo(cx + 0.9, cy - 1.1);
  ctx.lineTo(cx + 1.7, cy + 2.5);
  ctx.lineTo(cx - 1.7, cy + 2.5);
  ctx.closePath();
  ctx.fill();
}

function pictoCaution(ctx, P, cx, cy) {
  fillRR(ctx, P.k, cx - 0.7, cy - 3.0, 1.4, 3.9, 0.6);
  ellipse(ctx, P.k, cx, cy + 2.4, 0.9, 0.9);
}

export const PROPS = {
  signStay: {
    w: 16, h: 22,
    draw(ctx, P) {
      const cx = 8;
      signPost(ctx, P, cx, 12.5, 22);
      diamondSign(ctx, P, cx, 7, 5.6);
      pictoStay(ctx, P, cx, 7.2);
    },
  },

  signCaution: {
    w: 16, h: 22,
    draw(ctx, P) {
      const cx = 8;
      signPost(ctx, P, cx, 12.5, 22);
      diamondSign(ctx, P, cx, 7, 5.6);
      pictoCaution(ctx, P, cx, 7.2);
    },
  },

  fence: {
    w: 22, h: 14,
    draw(ctx, P) {
      // Concrete feet, drawn first so the posts plant into them.
      fillRR(ctx, P.k, 1.0, 10.2, 5.4, 3.4, 0.6);
      fillRR(ctx, P.C, 1.6, 10.7, 4.2, 2.5, 0.5);
      fillRR(ctx, P.k, 15.6, 10.2, 5.4, 3.4, 0.6);
      fillRR(ctx, P.C, 16.2, 10.7, 4.2, 2.5, 0.5);

      // Tube frame: two posts, top and bottom rails.
      const postW = 1.6;
      [2.6, 18.8].forEach((px) => {
        fillRR(ctx, P.k, px - postW / 2 - 0.3, 0.8, postW + 0.6, 10.4, 0.5);
        fillRR(ctx, P.G, px - postW / 2, 1.1, postW, 9.9, 0.4);
        ctx.fillStyle = P.H;
        ctx.fillRect(px - postW / 2 + 0.25, 1.3, 0.4, 9.4);
      });
      fillRR(ctx, P.k, 1.6, 0.6, 18.8, 1.7, 0.5);
      fillRR(ctx, P.G, 1.9, 0.85, 18.2, 1.2, 0.4);
      fillRR(ctx, P.k, 1.6, 9.4, 18.8, 1.7, 0.5);
      fillRR(ctx, P.G, 1.9, 9.65, 18.2, 1.2, 0.4);

      // Mesh: a chain-link diamond grid, clipped inside the rails, thin and
      // gappy so the road shows through — a real panel, not a filled block.
      const left = 4.0, right = 18.0, top = 2.4, bottom = 9.1;
      ctx.save();
      rr(ctx, left, top, right - left, bottom - top, 0.2);
      ctx.clip();
      ctx.strokeStyle = P.H;
      ctx.lineWidth = 0.38;
      ctx.globalAlpha = 0.85;
      const span = bottom - top;
      for (let x = left - span; x <= right + span; x += 2.1) {
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x + span, bottom);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, bottom);
        ctx.lineTo(x + span, top);
        ctx.stroke();
      }
      ctx.restore();
    },
  },

  floodlight: {
    w: 16, h: 26,
    draw(ctx, P) {
      const apex = { x: 8, y: 19.5 };

      // Tripod legs: two splayed front legs and a shorter, dimmer rear leg
      // for depth.
      const leg = (tx, ty, w, c) => {
        ctx.strokeStyle = P.k;
        ctx.lineWidth = w + 0.7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(apex.x, apex.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(apex.x, apex.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ellipse(ctx, P.k, tx, ty, 1.1, 0.6);
        ellipse(ctx, P.G, tx, ty - 0.1, 0.7, 0.4);
      };
      leg(9.3, 24.6, 1.0, P.g);
      leg(2.6, 25.6, 1.3, P.G);
      leg(13.4, 25.6, 1.3, P.G);

      // Mast, a small cylinder rising to the lamp pivot.
      fillRR(ctx, P.k, 7.0, 6.6, 2.0, 13.2, 0.7);
      fillRR(ctx, P.G, 7.3, 6.9, 1.4, 12.7, 0.5);
      ctx.fillStyle = P.H;
      ctx.fillRect(7.35, 7.1, 0.5, 11.9);

      // Faint glow spilling from the lens, laid down before the head so the
      // housing reads crisp on top of it.
      ellipse(ctx, P.Y, 8, 10.4, 5.4, 3.2);
      ctx.globalAlpha = 0.7;
      ellipse(ctx, P.y, 8, 9.8, 3.6, 2.2);
      ctx.globalAlpha = 1;

      // Lamp head: a rectangular housing tilted down toward the road, with
      // a bright lens.
      ctx.save();
      ctx.translate(8, 7.2);
      ctx.rotate(0.32);
      fillRR(ctx, P.k, -4.3, -2.3, 8.6, 5.6, 1.0);
      fillRR(ctx, P.G, -3.8, -1.9, 7.6, 4.8, 0.8);
      ctx.fillStyle = P.H;
      ctx.fillRect(-3.8, -1.9, 7.6, 0.7);
      const lens = ctx.createLinearGradient(-3, -1, 3, 2);
      lens.addColorStop(0, P.W);
      lens.addColorStop(1, P.y);
      rr(ctx, -3.1, -1.0, 6.2, 3.2, 0.6);
      ctx.fillStyle = lens;
      ctx.fill();
      ctx.restore();
    },
  },

  portaloo: {
    w: 18, h: 24,
    draw(ctx, P) {
      const cx = 9;
      // Cabin body.
      fillRR(ctx, P.k, 2.4, 4.4, 13.2, 18.4, 1.3);
      fillRR(ctx, P.l, 3.0, 4.9, 12.0, 17.4, 1.0);
      // Shaded right-hand face.
      ctx.save();
      rr(ctx, 3.0, 4.9, 12.0, 17.4, 1.0);
      ctx.clip();
      ctx.fillStyle = P.L;
      ctx.fillRect(cx + 2.2, 4.4, 6.0, 18.4);
      ctx.restore();

      // Slightly overhanging roof cap.
      fillRR(ctx, P.k, 1.2, 1.8, 15.6, 3.4, 1.0);
      fillRR(ctx, P.L, 1.7, 2.1, 14.6, 2.4, 0.8);
      ctx.fillStyle = P.l;
      ctx.fillRect(1.9, 2.2, 8.6, 1.0);

      // Door seam and panel.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(5.6, 7.4, 6.8, 14.6);
      ctx.fillStyle = 'rgba(20,18,26,0.14)';
      ctx.fillRect(5.6, 7.4, 6.8, 14.6);

      // Vent slot near the top.
      ctx.fillStyle = P.k;
      ctx.fillRect(7.3, 8.6, 3.4, 0.5);
      ctx.fillRect(7.3, 9.5, 3.4, 0.5);
      ctx.fillRect(7.3, 10.4, 3.4, 0.5);

      // Door handle.
      ellipse(ctx, P.k, 11.4, 15.0, 0.55, 0.8);
    },
  },

  cooler: {
    w: 14, h: 10,
    draw(ctx, P) {
      const cx = 7;
      // Handle: a stroked arc riding on top of the lid.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, 2.6, 1.7, Math.PI * 1.06, Math.PI * 1.94, false);
      ctx.stroke();
      ctx.strokeStyle = P.H;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(cx, 2.6, 1.7, Math.PI * 1.1, Math.PI * 1.9, false);
      ctx.stroke();

      // Body.
      fillRR(ctx, P.k, 1.0, 3.9, 12.0, 5.5, 1.1);
      const bg = ctx.createLinearGradient(1.4, 0, 12.4, 0);
      bg.addColorStop(0, P.b);
      bg.addColorStop(1, P.B);
      rr(ctx, 1.6, 4.4, 10.8, 4.6, 0.9);
      ctx.fillStyle = bg;
      ctx.fill();

      // Lid.
      fillRR(ctx, P.k, 1.0, 1.5, 12.0, 3.0, 1.0);
      fillRR(ctx, P.C, 1.6, 1.9, 10.8, 2.3, 0.8);

      // Front latch, straddling the lid/body seam.
      fillRR(ctx, P.k, cx - 1.2, 3.6, 2.4, 1.5, 0.4);
      fillRR(ctx, P.C, cx - 0.85, 3.85, 1.7, 1.0, 0.3);
    },
  },

  toolbox: {
    w: 14, h: 10,
    draw(ctx, P) {
      const cx = 7;
      // Curved carry handle, wire-thin metal.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, 2.0, 2.0, Math.PI * 1.08, Math.PI * 1.92, false);
      ctx.stroke();
      ctx.strokeStyle = P.H;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(cx, 2.0, 2.0, Math.PI * 1.12, Math.PI * 1.88, false);
      ctx.stroke();

      // Body: red metal with a gradient for roundness.
      fillRR(ctx, P.k, 1.0, 4.0, 12.0, 5.6, 1.1);
      const body = ctx.createLinearGradient(1.4, 4.0, 12.4, 9.4);
      body.addColorStop(0, P.R);
      body.addColorStop(1, P.x);
      rr(ctx, 1.6, 4.5, 10.8, 4.7, 0.9);
      ctx.fillStyle = body;
      ctx.fill();

      // Lighter top face.
      fillRR(ctx, P.k, 1.0, 2.6, 12.0, 2.0, 0.9);
      fillRR(ctx, P.o, 1.6, 2.9, 10.8, 1.4, 0.6);

      // Latch on the front.
      fillRR(ctx, P.k, cx - 1.1, 6.3, 2.2, 1.6, 0.35);
      fillRR(ctx, P.H, cx - 0.75, 6.55, 1.5, 1.05, 0.25);
    },
  },

  craneHook: {
    w: 22, h: 30,
    draw(ctx, P) {
      const cx = 11;
      // Cable running up out of frame.
      ctx.fillStyle = P.g;
      ctx.fillRect(cx - 0.5, 0, 1, 8);

      // Hook block: a heavy pulley housing.
      fillRR(ctx, P.k, cx - 4.5, 7.5, 9, 6, 1.6);
      const blockG = ctx.createLinearGradient(cx - 4, 7, cx + 4, 13);
      blockG.addColorStop(0, P.H);
      blockG.addColorStop(1, P.G);
      ctx.fillStyle = blockG;
      rr(ctx, cx - 3.8, 8.1, 7.6, 4.8, 1.2); ctx.fill();
      ellipse(ctx, P.g, cx, 10.5, 1.4, 1.4);

      // The hook: a thick C traced by two arcs, with a point. This is the part
      // that was missing entirely when it was typed by hand.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, 13.2);
      ctx.lineTo(cx, 16.0);
      ctx.arc(cx, 18.4, 2.6, -Math.PI / 2, Math.PI * 0.75, false);
      ctx.stroke();
      ctx.strokeStyle = P.H;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx, 13.2);
      ctx.lineTo(cx, 16.0);
      ctx.arc(cx, 18.4, 2.6, -Math.PI / 2, Math.PI * 0.75, false);
      ctx.stroke();
      // Tip.
      ctx.fillStyle = P.k;
      ellipse(ctx, P.k, cx - 2.0, 20.4, 1.2, 1.2);
      ellipse(ctx, P.c, cx - 2.0, 20.4, 0.6, 0.6);

      // Slung bundle of pipe hanging under the hook.
      ctx.fillStyle = P.k;
      rr(ctx, cx - 9, 22.5, 18, 6, 1.4); ctx.fill();
      for (let i = 0; i < 5; i++) {
        ellipse(ctx, P.H, cx - 7 + i * 3.4, 25.5, 1.6, 2.2);
        ellipse(ctx, P.g, cx - 7 + i * 3.4, 25.5, 0.8, 1.3);
      }
      ctx.strokeStyle = P.o;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx - 4, 21.8); ctx.lineTo(cx - 4, 29.0);
      ctx.moveTo(cx + 4, 21.8); ctx.lineTo(cx + 4, 29.0);
      ctx.stroke();
    },
  },
};
