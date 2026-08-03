// Hero sprites: the cart, the crew base, Bomba, and the two props that show
// off what curves buy you.

import { TAU, rr, fillRR, ellipse, wheel, hardHat, vestBody, head, legs } from './kit.js';

export const HERO = {
  // --- Federico's cart ---------------------------------------------------
  cart: {
    w: 28, h: 28,
    variants: [
      ['cart', {}],
      ['cartLeft', { lean: -1 }],
      ['cartRight', { lean: 1 }],
      ['cartWreck', { wreck: true, lean: 1 }],
    ],
    draw(ctx, P, opt = {}) {
      const cx = 14;
      const lean = opt.lean || 0;
      const wreck = !!opt.wreck;
      // Steering is a real lean about the contact patch rather than a sheared
      // copy of the straight-on frame — the whole cart rolls, and the roof
      // swings further than the wheels do.
      ctx.save();
      ctx.translate(cx, 25);
      ctx.rotate(lean * 0.055);
      ctx.translate(-cx, -25);
      // Body panels go to bare metal when the cart is wrecked.
      const bodyLight = wreck ? P.H : P.M;
      const bodyMid = wreck ? P.G : P.m;
      const bodyDeep = wreck ? P.g : P.N;
      const lamp = wreck ? P.R : P.o;

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
      ctx.fillStyle = bodyLight;
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
      grad.addColorStop(0, bodyLight);
      grad.addColorStop(0.55, bodyMid);
      grad.addColorStop(1, bodyDeep);
      ctx.fillStyle = grad;
      rr(ctx, cx - 10.6, 14.8, 21.2, 7.2, 2.1);
      ctx.fill();

      fillRR(ctx, P.k, cx - 8.6, 15.0, 17.2, 3.6, 0.7);
      fillRR(ctx, P.W, cx - 8.2, 15.3, 16.4, 3.0, 0.6);
      ctx.fillStyle = P.C;
      ctx.fillRect(cx - 7.4, 16.0, 14.8, 0.6);
      ctx.fillRect(cx - 7.4, 17.1, 14.8, 0.6);

      ellipse(ctx, P.k, cx - 8.8, 20.6, 1.7, 1.3);
      ellipse(ctx, lamp, cx - 8.8, 20.6, 1.1, 0.9);
      ellipse(ctx, P.k, cx + 8.8, 20.6, 1.7, 1.3);
      ellipse(ctx, lamp, cx + 8.8, 20.6, 1.1, 0.9);

      // Wheels lean out of the turn a touch, so the near one shows more rim.
      wheel(ctx, P, cx - 9.6 - lean * 0.5, 23.6, 3.8);
      wheel(ctx, P, cx + 9.6 - lean * 0.5, 23.6, 3.8);
      ctx.restore();

      if (wreck) {
        // Smoke off the back, and a wheel knocked out of true.
        ctx.fillStyle = 'rgba(120,116,132,0.85)';
        ellipse(ctx, 'rgba(120,116,132,0.85)', cx - 2, 3.5, 3.4, 2.6);
        ellipse(ctx, 'rgba(150,146,160,0.7)', cx + 2.5, 1.6, 2.6, 2.0);
        ellipse(ctx, 'rgba(90,86,100,0.8)', cx + 5.5, 4.2, 2.0, 1.6);
      }
    },
  },

  // --- the crew ----------------------------------------------------------
  worker: {
    w: 16, h: 24,
    variants: [
      ['worker', {}],
      ['workerY', { hat: 'y' }],
      ['workerO', { hat: 'o' }],
      ['workerDark', { hat: 'y', skin: 'e', skinShade: 'E' }],
      ['workerOrangeVest', { vest: 'o' }],
    ],
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
    variants: [
      ['workerCheer', {}],
      ['workerCheerY', { hat: 'y' }],
      ['workerCheerO', { hat: 'o', skin: 'e', skinShade: 'E' }],
    ],
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
    variants: [['bomba', {}], ['bombaThumb', { thumb: true }]],
    draw(ctx, P, opt = {}) {
      const cx = 9;
      if (opt.thumb) {
        // Arm out and a thumb up: the approval that ends the game.
        ctx.strokeStyle = P.k;
        ctx.lineWidth = 3.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + 4.0, 13.0);
        ctx.quadraticCurveTo(cx + 7.6, 12.0, cx + 7.2, 8.6);
        ctx.stroke();
        ctx.strokeStyle = P.o;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx + 4.0, 13.0);
        ctx.quadraticCurveTo(cx + 7.6, 12.0, cx + 7.2, 8.6);
        ctx.stroke();
        ellipse(ctx, P.k, cx + 7.2, 7.4, 2.0, 2.2);
        ellipse(ctx, P.f, cx + 7.2, 7.6, 1.4, 1.6);
        ctx.fillStyle = P.k;
        ctx.fillRect(cx + 6.6, 4.8, 1.3, 2.6);
        ctx.fillStyle = P.f;
        ctx.fillRect(cx + 6.8, 5.1, 0.9, 2.2);
      }
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
