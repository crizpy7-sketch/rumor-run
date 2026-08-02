// Rumor fuel and the effects: power ups, the thrown sheet, and the fx set.
//
// Every entry is drawn with real geometry in target-pixel coordinates and
// compiled onto the palette by tools/genart.mjs. See ./kit.js for the shared
// helpers, and ./hero.js for worked examples.
//
//   { w, h, variants?: [[outputName, opts]], draw(ctx, PAL, opts) }

import { TAU, rr, fillRR, ellipse, hardHat, head, vestBody } from './kit.js';

// A question mark glyph, outlined then filled — the actual character reads
// unmistakably at tiny sizes in a way a hand-built hook path did not.
function qmark(ctx, P, cx, cy, s, rot) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.font = '900 9px Arial, "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = P.k;
  ctx.lineWidth = 2.6;
  ctx.strokeText('?', 0, 0);
  ctx.fillStyle = P.y;
  ctx.fillText('?', 0, 0);
  ctx.restore();
}

// One fanned gossip page, drawn about a pivot at the origin and rotated by
// the caller.
function page(ctx, P, angle) {
  ctx.save();
  ctx.translate(8, 14);
  ctx.rotate(angle);
  fillRR(ctx, P.k, -4.3, -11.2, 8.6, 11.2, 1.0);
  fillRR(ctx, P.W, -3.8, -10.7, 7.6, 10.2, 0.8);
  ctx.fillStyle = P.k;
  ctx.fillRect(-2.9, -8.8, 5.4, 0.55);
  ctx.fillRect(-2.9, -7.1, 5.4, 0.55);
  ctx.fillRect(-2.9, -5.4, 4.0, 0.55);
  // Curled corner.
  ctx.fillStyle = P.m;
  ctx.beginPath();
  ctx.moveTo(3.8, -10.7);
  ctx.quadraticCurveTo(2.2, -10.3, 2.6, -9.0);
  ctx.quadraticCurveTo(3.6, -9.3, 3.8, -10.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// One vest half: mirrored via `side` (+1 right, -1 left), pivoted on the
// centre seam so a gap shows the vest is open down the front.
function vestPanel(ctx, P, side, vest) {
  ctx.save();
  ctx.translate(8, 0);
  ctx.scale(side, 1);
  const outline = (inset) => {
    ctx.beginPath();
    ctx.moveTo(0.9 + inset, 3.0);
    ctx.quadraticCurveTo(2.6, 2.2, 4.6 - inset, 3.4 + inset * 0.3);
    ctx.quadraticCurveTo(5.7 - inset, 4.4, 5.3 - inset, 6.0);
    ctx.quadraticCurveTo(3.9, 7.2, 5.2 - inset, 8.4);
    ctx.quadraticCurveTo(5.1 - inset, 10.2, 4.5 - inset, 11.6);
    ctx.quadraticCurveTo(4.2 - inset, 12.8, 3.7 - inset, 13.4 - inset * 0.4);
    ctx.lineTo(1.2 + inset, 13.6 - inset * 0.4);
    ctx.quadraticCurveTo(1.6, 8.0, 0.9 + inset, 3.0);
    ctx.closePath();
  };
  outline(0);
  ctx.fillStyle = P.k;
  ctx.fill();
  outline(0.6);
  ctx.fillStyle = vest;
  ctx.fill();
  ctx.save();
  outline(0.6);
  ctx.clip();
  ctx.fillStyle = P.W;
  ctx.fillRect(0, 6.1, 6, 1.4);
  ctx.fillRect(0, 9.3, 6, 1.4);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(3.5, 2, 3, 12.5);
  ctx.restore();
  ctx.restore();
}

function starPath(ctx, cx, cy, outerR, innerR, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function sparkRay(ctx, P, cx, cy, angle, len, width) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, -len);
  ctx.quadraticCurveTo(width * 0.5, -len * 0.32, 0, 0);
  ctx.quadraticCurveTo(-width * 0.5, -len * 0.32, 0, -len);
  ctx.closePath();
  ctx.fillStyle = P.y;
  ctx.fill();
  ctx.restore();
}

export const PICKUPS = {
  // --- power ups -----------------------------------------------------------
  puSpeed: {
    w: 16, h: 16,
    draw(ctx, P) {
      // Flame trailing off the heel, drawn first so the shoe overlaps it.
      ctx.beginPath();
      ctx.moveTo(4.8, 6.6);
      ctx.quadraticCurveTo(1.8, 5.2, 0.2, 6.8);
      ctx.quadraticCurveTo(1.7, 8.0, 0.6, 9.6);
      ctx.quadraticCurveTo(2.6, 10.7, 4.9, 10.5);
      ctx.quadraticCurveTo(3.5, 8.6, 4.8, 6.6);
      ctx.closePath();
      ctx.fillStyle = P.o;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4.6, 7.1);
      ctx.quadraticCurveTo(2.6, 6.2, 1.5, 7.2);
      ctx.quadraticCurveTo(2.3, 8.1, 1.6, 9.2);
      ctx.quadraticCurveTo(2.9, 9.8, 4.5, 9.5);
      ctx.quadraticCurveTo(3.7, 8.3, 4.6, 7.1);
      ctx.closePath();
      ctx.fillStyle = P.y;
      ctx.fill();

      // Shoe outline (heel at left, toe at right).
      ctx.beginPath();
      ctx.moveTo(4.3, 12.4);
      ctx.quadraticCurveTo(3.0, 9.2, 4.7, 5.9);
      ctx.quadraticCurveTo(6.1, 4.5, 8.5, 4.9);
      ctx.quadraticCurveTo(10.7, 5.1, 12.3, 6.7);
      ctx.quadraticCurveTo(14.5, 7.7, 14.1, 9.7);
      ctx.quadraticCurveTo(13.7, 11.1, 12.1, 11.5);
      ctx.lineTo(5.0, 11.9);
      ctx.quadraticCurveTo(4.3, 11.9, 4.3, 12.4);
      ctx.closePath();
      ctx.fillStyle = P.k;
      ctx.fill();

      // Upper.
      ctx.beginPath();
      ctx.moveTo(4.8, 11.9);
      ctx.quadraticCurveTo(3.8, 9.1, 5.1, 6.4);
      ctx.quadraticCurveTo(6.3, 5.2, 8.4, 5.5);
      ctx.quadraticCurveTo(10.4, 5.7, 11.8, 7.1);
      ctx.quadraticCurveTo(13.5, 8.0, 13.2, 9.5);
      ctx.quadraticCurveTo(12.9, 10.5, 11.9, 10.8);
      ctx.lineTo(5.4, 11.3);
      ctx.quadraticCurveTo(4.8, 11.3, 4.8, 11.9);
      ctx.closePath();
      ctx.fillStyle = P.b;
      ctx.fill();

      // Heel counter shade for volume.
      ctx.beginPath();
      ctx.ellipse(5.3, 8.6, 1.4, 2.6, 0.25, 0, TAU);
      ctx.fillStyle = P.B;
      ctx.fill();

      // Tongue + laces.
      ctx.fillStyle = P.u;
      ctx.beginPath();
      ctx.moveTo(7.6, 6.2);
      ctx.quadraticCurveTo(8.8, 5.9, 9.9, 6.9);
      ctx.quadraticCurveTo(9.0, 7.6, 7.8, 7.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = P.W;
      ctx.lineWidth = 0.55;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(8.0, 6.9); ctx.lineTo(9.3, 7.7);
      ctx.moveTo(8.4, 7.6); ctx.lineTo(9.7, 8.4);
      ctx.stroke();

      // Sole stripe.
      ctx.strokeStyle = P.W;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(4.9, 11.7);
      ctx.quadraticCurveTo(8.5, 12.5, 12.4, 11.1);
      ctx.stroke();
    },
  },

  puPapers: {
    w: 16, h: 16,
    draw(ctx, P) {
      page(ctx, P, -0.34);
      page(ctx, P, -0.11);
      page(ctx, P, 0.12);
      page(ctx, P, 0.34);
    },
  },

  puVest: {
    w: 16, h: 16,
    draw(ctx, P) {
      vestPanel(ctx, P, -1, P.l);
      vestPanel(ctx, P, 1, P.l);
      // Collar hinting the shoulder taper at the top of the seam.
      ctx.fillStyle = P.k;
      ctx.beginPath();
      ctx.moveTo(6.6, 3.0);
      ctx.quadraticCurveTo(8, 4.1, 9.4, 3.0);
      ctx.lineTo(9.0, 3.9);
      ctx.quadraticCurveTo(8, 4.7, 7.0, 3.9);
      ctx.closePath();
      ctx.fill();
    },
  },

  puConfusion: {
    w: 16, h: 18,
    draw(ctx, P) {
      head(ctx, P, 8, 14.6, 2.6, P.f, P.F);
      hardHat(ctx, P, 8, 13.1, 6.6, P.C);
      // Dazed X eyes.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 0.55;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(6.6, 14.6); ctx.lineTo(7.5, 15.4);
      ctx.moveTo(7.5, 14.6); ctx.lineTo(6.6, 15.4);
      ctx.moveTo(8.6, 14.6); ctx.lineTo(9.5, 15.4);
      ctx.moveTo(9.5, 14.6); ctx.lineTo(8.6, 15.4);
      ctx.stroke();
      // The loud part.
      qmark(ctx, P, 3.6, 5.6, 1.15, -0.18);
      qmark(ctx, P, 11.6, 4.4, 1.5, 0.14);
      qmark(ctx, P, 8.0, 8.8, 0.85, -0.08);
    },
  },

  puBomba: {
    w: 16, h: 16,
    draw(ctx, P) {
      const cx = 8;
      // Orange shoulders, cropped at the bottom of the frame.
      ctx.fillStyle = P.k;
      rr(ctx, cx - 6.6, 12.0, 13.2, 5.6, 2.4);
      ctx.fill();
      ctx.fillStyle = P.o;
      rr(ctx, cx - 6.0, 12.5, 12.0, 5.1, 2.0);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      rr(ctx, cx + 1.4, 12.5, 4.6, 5.1, 1.6);
      ctx.fill();

      head(ctx, P, cx, 7.4, 3.3, P.f, P.F);
      // Beard.
      ctx.fillStyle = P.h;
      ctx.beginPath();
      ctx.ellipse(cx, 9.4, 2.9, 2.1, 0, -0.05, Math.PI + 0.05);
      ctx.fill();
      // Shades.
      ctx.fillStyle = P.k;
      rr(ctx, cx - 3.3, 6.2, 6.6, 1.7, 0.7);
      ctx.fill();
      ctx.fillStyle = P.G;
      ctx.fillRect(cx - 2.8, 6.5, 2.1, 1.0);
      ctx.fillRect(cx + 0.7, 6.5, 2.1, 1.0);
      hardHat(ctx, P, cx, 5.4, 9.0, P.C);
    },
  },

  // --- thrown props ----------------------------------------------------------
  sheet: {
    w: 10, h: 8,
    draw(ctx, P) {
      ctx.save();
      ctx.translate(5, 4);
      ctx.rotate(-0.36);
      fillRR(ctx, P.k, -4.3, -1.75, 8.6, 3.5, 1.6);
      fillRR(ctx, P.W, -3.9, -1.4, 7.8, 2.8, 1.3);
      ctx.fillStyle = P.k;
      ctx.fillRect(-2.4, -0.75, 5.4, 0.5);
      ctx.fillRect(-2.4, 0.15, 5.4, 0.5);
      // Roll edge.
      ellipse(ctx, P.k, -3.7, 0, 1.2, 1.55);
      ellipse(ctx, P.C, -3.7, 0, 0.85, 1.15);
      ellipse(ctx, P.m, -3.7, 0, 0.4, 0.55);
      ctx.restore();
    },
  },

  // --- fx --------------------------------------------------------------------
  puff: {
    w: 14, h: 10,
    draw(ctx, P) {
      ctx.globalAlpha = 0.75;
      ellipse(ctx, P.c, 3.4, 6.4, 3.0, 2.4);
      ellipse(ctx, P.c, 10.6, 6.2, 2.8, 2.2);
      ctx.globalAlpha = 0.9;
      ellipse(ctx, P.C, 7.0, 4.6, 3.8, 2.9);
      ctx.globalAlpha = 1;
      ellipse(ctx, P.W, 7.0, 5.6, 2.2, 1.6);
      ctx.globalAlpha = 1;
    },
  },

  spark: {
    w: 12, h: 12,
    draw(ctx, P) {
      sparkRay(ctx, P, 6, 6, 0, 5.6, 2.0);
      sparkRay(ctx, P, 6, 6, Math.PI / 2, 5.6, 2.0);
      sparkRay(ctx, P, 6, 6, Math.PI, 5.6, 2.0);
      sparkRay(ctx, P, 6, 6, -Math.PI / 2, 5.6, 2.0);
      ellipse(ctx, P.y, 6, 6, 1.8, 1.8);
      ellipse(ctx, P.W, 6, 6, 1.1, 1.1);
    },
  },

  star: {
    w: 12, h: 12,
    draw(ctx, P) {
      starPath(ctx, 6, 6, 5.7, 2.3, 0);
      ctx.fillStyle = P.k;
      ctx.fill();
      starPath(ctx, 6, 6, 4.9, 1.9, 0);
      ctx.fillStyle = P.y;
      ctx.fill();
      // Highlight on the upper-left point.
      ctx.save();
      starPath(ctx, 6, 6, 4.9, 1.9, 0);
      ctx.clip();
      ellipse(ctx, P.W, 4.3, 3.6, 1.5, 1.7);
      ctx.restore();
    },
  },

  arrow: {
    w: 14, h: 12,
    draw(ctx, P) {
      const chevron = () => {
        ctx.beginPath();
        ctx.moveTo(2.6, 1.8);
        ctx.lineTo(7.0, 8.2);
        ctx.lineTo(11.4, 1.8);
      };
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = P.k; ctx.lineWidth = 5.4; chevron(); ctx.stroke();
      ctx.strokeStyle = P.o; ctx.lineWidth = 3.6; chevron(); ctx.stroke();
      ctx.strokeStyle = P.W; ctx.lineWidth = 1.1; chevron(); ctx.stroke();
    },
  },

  splash: {
    w: 14, h: 10,
    draw(ctx, P) {
      ctx.globalAlpha = 0.85;
      ellipse(ctx, P.b, 7, 8.4, 5.6, 1.6);
      ellipse(ctx, P.u, 7, 8.1, 4.2, 1.05);
      ctx.globalAlpha = 1;
      const drop = (x, y, r, c) => ellipse(ctx, c, x, y, r, r * 1.3);
      drop(2.6, 5.4, 0.9, P.u);
      drop(4.6, 2.6, 1.0, P.b);
      drop(7.2, 1.6, 1.1, P.u);
      drop(9.8, 2.8, 0.9, P.b);
      drop(11.6, 5.2, 0.85, P.u);
      ctx.strokeStyle = P.u;
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(4.6, 3.4); ctx.quadraticCurveTo(4.2, 5.6, 4.0, 7.2);
      ctx.moveTo(9.8, 3.6); ctx.quadraticCurveTo(10.1, 5.6, 10.2, 7.2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
  },
};
