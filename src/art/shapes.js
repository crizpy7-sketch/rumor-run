// Vector sources for the pixel art.
//
// Sprites here are drawn with real geometry — arcs, beziers, gradients — in
// target-pixel coordinates with sub-pixel precision, then supersampled and
// quantised onto the palette by tools/genart.mjs. Hand-placing characters in an
// ASCII grid cannot make a round wheel or a domed hard hat; this can, and the
// output is still palette-locked pixel art with hard edges.
//
// Coordinates are in final pixels. Fractions are not only allowed, they are the
// point: a brim edge at y=3.4 lands differently from one at y=3.0 once the
// supersampler averages it down.

const TAU = Math.PI * 2;

/** Rounded rectangle path. */
function rr(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.lineTo(x + w - k, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + k);
  ctx.lineTo(x + w, y + h - k);
  ctx.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  ctx.lineTo(x + k, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - k);
  ctx.lineTo(x, y + k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.closePath();
}

function fillRR(ctx, c, x, y, w, h, r) {
  ctx.fillStyle = c;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
}

function ellipse(ctx, c, cx, cy, rx, ry) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.fill();
}

/** A wheel: tyre, rim, hub — actually round, which an ASCII grid cannot do. */
function wheel(ctx, P, cx, cy, r, hub = P.y) {
  ellipse(ctx, P.k, cx, cy, r, r);
  ellipse(ctx, P.g, cx, cy, r * 0.72, r * 0.72);
  ellipse(ctx, hub, cx, cy, r * 0.38, r * 0.38);
  ellipse(ctx, P.k, cx, cy, r * 0.16, r * 0.16);
}

/** A hard hat: dome plus brim, with a highlight along the crown. */
function hardHat(ctx, P, cx, cy, w, shell) {
  const r = w / 2;
  // Brim, an ellipse wider than the dome.
  ellipse(ctx, P.k, cx, cy, r * 1.18, r * 0.42);
  ellipse(ctx, shell, cx, cy - 0.3, r * 1.1, r * 0.34);
  // Dome.
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 1.05, 0, Math.PI, TAU);
  ctx.fill();
  // Crown highlight and a shadow under the near edge.
  ctx.fillStyle = P.W;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.28, cy - r * 0.5, r * 0.3, r * 0.34, -0.5, Math.PI, TAU);
  ctx.fill();
  ctx.strokeStyle = P.k;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 1.05, 0, Math.PI, TAU);
  ctx.stroke();
}

/** A body in a hi-viz vest: shoulders, taper, two reflective bands. */
function vestBody(ctx, P, cx, top, w, h, vest) {
  const half = w / 2;
  ctx.fillStyle = P.k;
  ctx.beginPath();
  ctx.moveTo(cx - half, top + h);
  ctx.lineTo(cx - half * 0.92, top + h * 0.28);
  ctx.quadraticCurveTo(cx - half * 0.85, top - 0.4, cx - half * 0.42, top);
  ctx.lineTo(cx + half * 0.42, top);
  ctx.quadraticCurveTo(cx + half * 0.85, top - 0.4, cx + half * 0.92, top + h * 0.28);
  ctx.lineTo(cx + half, top + h);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = vest;
  ctx.fillRect(cx - half, top - 1, w, h + 2);
  // Reflective bands.
  ctx.fillStyle = P.W;
  ctx.fillRect(cx - half, top + h * 0.34, w, h * 0.16);
  ctx.fillRect(cx - half * 0.55, top, w * 0.16, h);
  ctx.fillRect(cx + half * 0.39, top, w * 0.16, h);
  // Shade down the right side so the torso has volume.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(cx + half * 0.35, top - 1, half * 0.7, h + 2);
  ctx.restore();
}

function head(ctx, P, cx, cy, r, skin, shade) {
  ellipse(ctx, P.k, cx, cy, r + 0.55, r + 0.55);
  ellipse(ctx, skin, cx, cy, r, r);
  ellipse(ctx, shade, cx + r * 0.42, cy + r * 0.12, r * 0.55, r * 0.8);
}

function legs(ctx, P, cx, top, w, h, cloth) {
  const half = w / 2;
  fillRR(ctx, P.k, cx - half, top, w, h, 0.8);
  ctx.fillStyle = cloth;
  ctx.fillRect(cx - half + 0.7, top + 0.6, half - 1.1, h - 1.8);
  ctx.fillRect(cx + 0.4, top + 0.6, half - 1.1, h - 1.8);
  // Boots.
  ctx.fillStyle = P.k;
  ctx.fillRect(cx - half - 0.4, top + h - 2.2, w + 0.8, 2.2);
}

export const SHAPES = {
  // --- Federico's cart ---------------------------------------------------
  cart: {
    w: 28, h: 28,
    draw(ctx, P) {
      const cx = 14;

      // Canopy: a curved roof on two posts. The cab stays open — you see
      // through it, the way you do on a real site cart, which reads far better
      // than a filled dark box.
      ctx.fillStyle = P.k;
      ctx.beginPath();
      ctx.moveTo(cx - 10.0, 3.4);
      ctx.quadraticCurveTo(cx, -0.8, cx + 10.0, 3.4);
      ctx.lineTo(cx + 10.0, 5.0);
      ctx.quadraticCurveTo(cx, 1.2, cx - 10.0, 5.0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = P.M;
      ctx.beginPath();
      ctx.moveTo(cx - 9.0, 3.7);
      ctx.quadraticCurveTo(cx, 0.2, cx + 9.0, 3.7);
      ctx.lineTo(cx + 9.0, 4.5);
      ctx.quadraticCurveTo(cx, 1.7, cx - 9.0, 4.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = P.k;
      ctx.fillRect(cx - 9.0, 4.2, 1.2, 8.6);
      ctx.fillRect(cx + 7.8, 4.2, 1.2, 8.6);

      // Seat back, directly behind the driver only.
      fillRR(ctx, P.k, cx - 5.4, 8.4, 10.8, 6.2, 1.6);
      fillRR(ctx, P.d, cx - 4.8, 8.8, 9.6, 5.6, 1.3);

      // Federico. Bigger than before: he is the character, not trim.
      ctx.fillStyle = P.k;
      rr(ctx, cx - 5.0, 10.2, 10.0, 4.0, 1.6);
      ctx.fill();
      ctx.fillStyle = P.o;
      rr(ctx, cx - 4.4, 10.6, 8.8, 3.4, 1.3);
      ctx.fill();
      ctx.fillStyle = P.W;
      ctx.fillRect(cx - 3.0, 11.4, 1.4, 2.6);
      ctx.fillRect(cx + 1.6, 11.4, 1.4, 2.6);

      head(ctx, P, cx, 7.4, 3.1, P.f, P.F);
      // Beard along the jaw.
      ctx.fillStyle = P.h;
      ctx.beginPath();
      ctx.ellipse(cx, 8.6, 2.8, 2.2, 0, -0.15, Math.PI + 0.15);
      ctx.fill();
      // Cap: dome plus a peak.
      ctx.fillStyle = P.k;
      ctx.beginPath();
      ctx.ellipse(cx, 6.4, 3.4, 2.9, 0, Math.PI, TAU);
      ctx.fill();
      ctx.fillStyle = P.d;
      ctx.beginPath();
      ctx.ellipse(cx, 6.3, 2.8, 2.3, 0, Math.PI, TAU);
      ctx.fill();
      ctx.fillStyle = P.k;
      rr(ctx, cx - 3.8, 6.1, 7.6, 1.2, 0.5);
      ctx.fill();
      // Eyes.
      ctx.fillStyle = P.k;
      ctx.fillRect(cx - 1.7, 7.2, 1.0, 1.1);
      ctx.fillRect(cx + 0.7, 7.2, 1.0, 1.1);

      // Body: a rounded tub, wider at the bed, with the sheets in it.
      fillRR(ctx, P.k, cx - 11.4, 14.2, 22.8, 8.4, 2.6);
      const grad = ctx.createLinearGradient(0, 14, 0, 22.6);
      grad.addColorStop(0, P.M);
      grad.addColorStop(0.55, P.m);
      grad.addColorStop(1, P.N);
      ctx.fillStyle = grad;
      rr(ctx, cx - 10.6, 14.8, 21.2, 7.2, 2.1);
      ctx.fill();

      fillRR(ctx, P.k, cx - 8.6, 15.0, 17.2, 3.6, 0.7);
      fillRR(ctx, P.W, cx - 8.2, 15.3, 16.4, 3.0, 0.6);
      ctx.fillStyle = P.C;
      ctx.fillRect(cx - 7.4, 16.0, 14.8, 0.6);
      ctx.fillRect(cx - 7.4, 17.1, 14.8, 0.6);

      ellipse(ctx, P.k, cx - 8.8, 20.6, 1.7, 1.3);
      ellipse(ctx, P.o, cx - 8.8, 20.6, 1.1, 0.9);
      ellipse(ctx, P.k, cx + 8.8, 20.6, 1.7, 1.3);
      ellipse(ctx, P.o, cx + 8.8, 20.6, 1.1, 0.9);

      wheel(ctx, P, cx - 9.6, 23.6, 3.8);
      wheel(ctx, P, cx + 9.6, 23.6, 3.8);
    },
  },

  // --- the crew ----------------------------------------------------------
  worker: {
    w: 16, h: 24,
    draw(ctx, P, opt = {}) {
      const cx = 8;
      const shell = opt.hat || P.C;
      const vest = opt.vest || P.l;
      const skin = opt.skin || P.f;
      const shade = opt.skinShade || P.F;
      legs(ctx, P, cx, 16.4, 7.6, 7.6, P.v);
      vestBody(ctx, P, cx, 9.2, 11.0, 7.8, vest);
      head(ctx, P, cx, 6.0, 2.6, skin, shade);
      hardHat(ctx, P, cx, 4.6, 7.4, shell);
    },
  },

  workerCheer: {
    w: 16, h: 24,
    draw(ctx, P, opt = {}) {
      const cx = 8;
      const shell = opt.hat || P.C;
      const vest = opt.vest || P.l;
      // Arms up, thrown wide.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 4.2, 11.5);
      ctx.quadraticCurveTo(cx - 7.4, 8.0, cx - 6.6, 4.2);
      ctx.moveTo(cx + 4.2, 11.5);
      ctx.quadraticCurveTo(cx + 7.4, 8.0, cx + 6.6, 4.2);
      ctx.stroke();
      ctx.strokeStyle = opt.skin || P.f;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx - 4.2, 11.5);
      ctx.quadraticCurveTo(cx - 7.4, 8.0, cx - 6.6, 4.2);
      ctx.moveTo(cx + 4.2, 11.5);
      ctx.quadraticCurveTo(cx + 7.4, 8.0, cx + 6.6, 4.2);
      ctx.stroke();
      legs(ctx, P, cx, 16.4, 7.6, 7.6, P.v);
      vestBody(ctx, P, cx, 9.2, 11.0, 7.8, vest);
      head(ctx, P, cx, 6.0, 2.6, opt.skin || P.f, opt.skinShade || P.F);
      hardHat(ctx, P, cx, 4.6, 7.4, shell);
      // Open mouth — they are shouting about it.
      ctx.fillStyle = P.k;
      ctx.fillRect(cx - 0.8, 6.8, 1.6, 1.2);
    },
  },

  // --- Bomba -------------------------------------------------------------
  bomba: {
    w: 18, h: 26,
    draw(ctx, P) {
      const cx = 9;
      legs(ctx, P, cx, 17.6, 8.6, 8.4, P.v);
      vestBody(ctx, P, cx, 9.8, 12.4, 8.4, P.o);
      head(ctx, P, cx, 6.0, 3.2, P.f, P.F);
      // Beard.
      ctx.fillStyle = P.h;
      ctx.beginPath();
      ctx.ellipse(cx, 8.0, 2.7, 2.0, 0, -0.05, Math.PI + 0.05);
      ctx.fill();
      // Shades: one bar, two lenses.
      ctx.fillStyle = P.k;
      rr(ctx, cx - 3.0, 5.0, 6.0, 1.6, 0.6);
      ctx.fill();
      ctx.fillStyle = P.G;
      ctx.fillRect(cx - 2.5, 5.3, 1.9, 0.9);
      ctx.fillRect(cx + 0.6, 5.3, 1.9, 0.9);
      hardHat(ctx, P, cx, 4.4, 8.2, P.C);
    },
  },

  // --- site furniture ----------------------------------------------------
  cone: {
    w: 12, h: 13,
    draw(ctx, P) {
      const cx = 6;
      // Base.
      ellipse(ctx, P.k, cx, 11.4, 5.6, 1.8);
      ellipse(ctx, P.O, cx, 11.0, 5.0, 1.4);
      // Cone body, as an actual tapering shape with a curved base.
      ctx.fillStyle = P.k;
      ctx.beginPath();
      ctx.moveTo(cx - 4.2, 11.0);
      ctx.quadraticCurveTo(cx - 1.6, 1.4, cx, 0.8);
      ctx.quadraticCurveTo(cx + 1.6, 1.4, cx + 4.2, 11.0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = P.o;
      ctx.beginPath();
      ctx.moveTo(cx - 3.4, 10.6);
      ctx.quadraticCurveTo(cx - 1.2, 2.2, cx, 1.7);
      ctx.quadraticCurveTo(cx + 1.2, 2.2, cx + 3.4, 10.6);
      ctx.closePath();
      ctx.fill();
      // Reflective collars, following the taper.
      ctx.fillStyle = P.W;
      ctx.beginPath();
      ctx.moveTo(cx - 2.5, 6.6); ctx.lineTo(cx + 2.5, 6.6);
      ctx.lineTo(cx + 2.2, 5.0); ctx.lineTo(cx - 2.2, 5.0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.moveTo(cx + 1.0, 1.9); ctx.lineTo(cx + 3.4, 10.6);
      ctx.lineTo(cx + 1.4, 10.6); ctx.closePath(); ctx.fill();
    },
  },

  barrel: {
    w: 14, h: 16,
    draw(ctx, P) {
      const cx = 7;
      // A cylinder: elliptical top, straight sides, elliptical bottom.
      ctx.fillStyle = P.k;
      ctx.beginPath();
      ctx.moveTo(cx - 5.6, 3.0);
      ctx.lineTo(cx - 5.6, 13.0);
      ctx.ellipse(cx, 13.0, 5.6, 2.0, 0, Math.PI, 0, true);
      ctx.lineTo(cx + 5.6, 3.0);
      ctx.closePath();
      ctx.fill();
      const g = ctx.createLinearGradient(cx - 5, 0, cx + 5, 0);
      g.addColorStop(0, P.O);
      g.addColorStop(0.35, P.o);
      g.addColorStop(1, P.r);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - 4.8, 3.2);
      ctx.lineTo(cx - 4.8, 12.8);
      ctx.ellipse(cx, 12.8, 4.8, 1.6, 0, Math.PI, 0, true);
      ctx.lineTo(cx + 4.8, 3.2);
      ctx.closePath();
      ctx.fill();
      // Bands.
      ctx.fillStyle = P.W;
      ctx.fillRect(cx - 4.8, 5.4, 9.6, 2.2);
      ctx.fillRect(cx - 4.8, 9.6, 9.6, 2.2);
      // Lid.
      ellipse(ctx, P.k, cx, 3.0, 5.6, 2.0);
      ellipse(ctx, P.C, cx, 2.8, 4.6, 1.5);
    },
  },
};
