// Everything with wheels that is not the cart.
//
// Every entry is drawn with real geometry in target-pixel coordinates and
// compiled onto the palette by tools/genart.mjs. See ./kit.js for the shared
// helpers, and ./hero.js for worked examples.
//
//   { w, h, variants?: [[outputName, opts]], draw(ctx, PAL, opts) }

import { TAU, rr, fillRR, ellipse, wheel, hardHat, vestBody, head, legs } from './kit.js';

export const VEHICLES = {
  // --- forklift ------------------------------------------------------------
  forklift: {
    w: 28, h: 26,
    draw(ctx, P) {
      const cx = 14;

      // Mast first, so the body/cage sit in front of it and it reads as
      // rising up BEHIND the driver rather than as loose antennae. Two
      // thick rails, bright metal so they pop off the dark background, with
      // bold cross rungs — this is the single feature that says "forklift".
      const railL = cx - 7.2, railR = cx + 7.2;
      ctx.fillStyle = P.k;
      fillRR(ctx, P.k, railL - 1.3, 1.0, 2.6, 20.4, 0.6);
      fillRR(ctx, P.k, railR - 1.3, 1.0, 2.6, 20.4, 0.6);
      const railG = ctx.createLinearGradient(railL - 1.0, 0, railL + 1.0, 0);
      railG.addColorStop(0, P.g);
      railG.addColorStop(0.5, P.c);
      railG.addColorStop(1, P.H);
      ctx.fillStyle = railG;
      fillRR(ctx, railG, railL - 0.9, 1.4, 1.8, 19.6, 0.4);
      fillRR(ctx, railG, railR - 0.9, 1.4, 1.8, 19.6, 0.4);
      ctx.fillStyle = P.g;
      for (let i = 0; i < 5; i++) {
        fillRR(ctx, P.g, railL - 1.1, 2.6 + i * 3.9, railR - railL + 2.2, 1.3, 0.3);
      }

      // Overhead guard, spanning the rails, with the amber beacon on top.
      fillRR(ctx, P.k, cx - 8.6, 0.2, 17.2, 2.0, 0.8);
      fillRR(ctx, P.H, cx - 8.0, 0.6, 16.0, 1.2, 0.6);
      ellipse(ctx, P.k, cx, -0.6, 1.7, 1.2);
      ellipse(ctx, P.o, cx, -0.8, 1.2, 0.8);
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 6.4, 2.0); ctx.lineTo(cx - 6.4, 13.4);
      ctx.moveTo(cx + 6.4, 2.0); ctx.lineTo(cx + 6.4, 13.4);
      ctx.stroke();

      // Counterweight body, the yellow bulk of the machine, the cage's seat
      // tucked into its top.
      ctx.fillStyle = P.k;
      rr(ctx, cx - 9.6, 12.8, 19.2, 9.0, 2.0);
      ctx.fill();
      let g = ctx.createLinearGradient(0, 12.8, 0, 21.8);
      g.addColorStop(0, P.Y);
      g.addColorStop(0.55, P.y);
      g.addColorStop(1, P.Z);
      ctx.fillStyle = g;
      rr(ctx, cx - 8.8, 13.4, 17.6, 7.6, 1.6);
      ctx.fill();

      // Seat back, glimpsed inside the cage.
      fillRR(ctx, P.k, cx - 3.6, 9.6, 7.2, 4.6, 1.2);
      fillRR(ctx, P.d, cx - 3.0, 10.0, 6.0, 3.8, 1.0);

      // Carriage + forks, at the very front and bottom, peeking out under
      // the counterweight toward the camera.
      fillRR(ctx, P.k, cx - 6.6, 20.4, 13.2, 2.2, 0.5);
      ctx.fillStyle = P.H;
      ctx.fillRect(cx - 6.0, 20.7, 12.0, 1.4);
      ctx.fillStyle = P.k;
      fillRR(ctx, P.k, cx - 5.8, 22.2, 3.6, 3.2, 0.5);
      fillRR(ctx, P.k, cx + 2.2, 22.2, 3.6, 3.2, 0.5);
      ctx.fillStyle = P.c;
      ctx.fillRect(cx - 5.3, 22.6, 2.6, 2.4);
      ctx.fillRect(cx + 2.7, 22.6, 2.6, 2.4);

      // Wheels: big rear pair set into the counterweight, small front
      // steer pair down by the forks.
      wheel(ctx, P, cx - 7.4, 20.2, 3.9, P.k);
      wheel(ctx, P, cx + 7.4, 20.2, 3.9, P.k);
      wheel(ctx, P, cx - 4.6, 24.6, 2.0, P.k);
      wheel(ctx, P, cx + 4.6, 24.6, 2.0, P.k);

      // Outline the counterweight again on top so the big wheels tuck
      // under it cleanly.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 1.0;
      rr(ctx, cx - 9.6, 12.8, 19.2, 9.0, 2.0);
      ctx.stroke();
    },
  },

  // --- pickup truck ---------------------------------------------------------
  truck: {
    w: 34, h: 20,
    draw(ctx, P) {
      const cx = 17;

      // Load bed, low and wide, filling the back half.
      fillRR(ctx, P.k, cx - 12.6, 8.4, 25.2, 8.6, 1.8);
      let g = ctx.createLinearGradient(0, 8.4, 0, 17.0);
      g.addColorStop(0, P.C);
      g.addColorStop(0.55, P.c);
      g.addColorStop(1, P.H);
      ctx.fillStyle = g;
      rr(ctx, cx - 11.8, 9.0, 24.0, 7.4, 1.4);
      ctx.fill();
      // Bed rim + inner well.
      fillRR(ctx, P.g, cx - 10.6, 9.6, 21.2, 3.0, 0.7);

      // Cab, set forward (toward the top of the frame) and connected flush
      // to the bed — no gap between the two panels.
      ctx.fillStyle = P.k;
      rr(ctx, cx - 9.6, 0.6, 19.2, 9.0, 2.0);
      ctx.fill();
      const cabG = ctx.createLinearGradient(0, 0.6, 0, 9.6);
      cabG.addColorStop(0, P.W);
      cabG.addColorStop(0.5, P.C);
      cabG.addColorStop(1, P.c);
      ctx.fillStyle = cabG;
      rr(ctx, cx - 8.8, 1.2, 17.6, 8.0, 1.6);
      ctx.fill();

      // Rear glass.
      fillRR(ctx, P.k, cx - 6.4, 2.0, 12.8, 4.4, 1.0);
      ctx.fillStyle = P.u;
      rr(ctx, cx - 5.8, 2.5, 11.6, 3.4, 0.8);
      ctx.fill();
      ctx.fillStyle = P.k;
      ctx.fillRect(cx - 0.35, 2.5, 0.7, 3.4);

      // Door seam + small blue company logo.
      ctx.strokeStyle = P.g;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - 8.8, 6.8); ctx.lineTo(cx + 8.8, 6.8);
      ctx.stroke();
      ellipse(ctx, P.k, cx - 6.2, 8.0, 1.5, 1.2);
      ellipse(ctx, P.b, cx - 6.2, 8.0, 1.05, 0.85);

      // Tail lights on the bed corners.
      fillRR(ctx, P.k, cx - 12.2, 9.2, 1.8, 3.0, 0.4);
      fillRR(ctx, P.R, cx - 11.9, 9.6, 1.2, 2.2, 0.3);
      fillRR(ctx, P.k, cx + 10.4, 9.2, 1.8, 3.0, 0.4);
      fillRR(ctx, P.R, cx + 10.7, 9.6, 1.2, 2.2, 0.3);

      // Bumper.
      fillRR(ctx, P.k, cx - 11.6, 16.4, 23.2, 1.8, 0.6);
      ctx.fillStyle = P.H;
      ctx.fillRect(cx - 11.0, 16.6, 22.0, 0.9);

      // Four round wheels.
      wheel(ctx, P, cx - 10.6, 6.6, 3.1, P.k);
      wheel(ctx, P, cx + 10.6, 6.6, 3.1, P.k);
      wheel(ctx, P, cx - 10.6, 16.8, 3.5, P.k);
      wheel(ctx, P, cx + 10.6, 16.8, 3.5, P.k);
    },
  },

  // --- flatbed lorry ---------------------------------------------------------
  // A long lorry reads best half-turned rather than dead-on from behind, so
  // this one is drawn as a low three-quarter elevation: cab at the left end,
  // low bed running out to the right, both sitting on one continuous
  // chassis rail so they are visibly one vehicle, not two boxes.
  flatbed: {
    w: 40, h: 22,
    draw(ctx, P) {
      const railY = 17.2, railH = 1.3;
      const cabL = 1.0, cabR = 12.4, cabTop = 2.6;
      const deckY = 12.0, deckBottom = 17.2;
      const bedR = 38.6;

      // Chassis rail: one long bar the full length of the vehicle. Drawn
      // first and reaching under both the cab and the bed, this alone
      // guarantees the two ends read as one machine.
      fillRR(ctx, P.k, cabL - 0.4, railY, bedR - cabL + 0.8, railH + 1.0, 0.6);
      ctx.fillStyle = P.g;
      ctx.fillRect(cabL, railY + 0.5, bedR - cabL, railH - 0.3);

      // Headboard: the solid bulkhead wall directly behind the cab that
      // keeps a shifting load off the driver — it physically touches both
      // the cab's back edge and the bed's front edge, welding them together.
      fillRR(ctx, P.k, cabR - 1.4, 1.6, 4.4, deckBottom - 1.6, 0.8);
      const hbG = ctx.createLinearGradient(0, 1.6, 0, deckBottom);
      hbG.addColorStop(0, P.H);
      hbG.addColorStop(1, P.g);
      ctx.fillStyle = hbG;
      rr(ctx, cabR - 0.8, 2.2, 3.4, deckBottom - 2.8, 0.6);
      ctx.fill();

      // Cab: a boxy back panel with a rear window, planted on the rail.
      ctx.fillStyle = P.k;
      rr(ctx, cabL, cabTop, cabR - cabL, deckBottom - cabTop, 1.6);
      ctx.fill();
      const cabG = ctx.createLinearGradient(0, cabTop, 0, deckBottom);
      cabG.addColorStop(0, P.b);
      cabG.addColorStop(1, P.B);
      ctx.fillStyle = cabG;
      rr(ctx, cabL + 0.7, cabTop + 0.6, cabR - cabL - 1.4, deckBottom - cabTop - 1.2, 1.2);
      ctx.fill();
      fillRR(ctx, P.k, cabL + 1.6, cabTop + 1.4, cabR - cabL - 3.2, 4.2, 0.8);
      ctx.fillStyle = P.u;
      rr(ctx, cabL + 2.1, cabTop + 1.8, cabR - cabL - 4.2, 3.3, 0.6);
      ctx.fill();
      ctx.fillStyle = P.k;
      ctx.fillRect(cabL + (cabR - cabL) / 2 - 0.35, cabTop + 1.8, 0.7, 3.3);

      // Low flatbed deck, running from the headboard out to the rear.
      ctx.fillStyle = P.k;
      rr(ctx, cabR - 1.2, deckY, bedR - cabR + 1.2, deckBottom - deckY, 1.0);
      ctx.fill();
      let deckG = ctx.createLinearGradient(0, deckY, 0, deckBottom);
      deckG.addColorStop(0, P.H);
      deckG.addColorStop(0.5, P.G);
      deckG.addColorStop(1, P.g);
      ctx.fillStyle = deckG;
      rr(ctx, cabR - 0.4, deckY + 0.6, bedR - cabR + 0.2, deckBottom - deckY - 1.0, 0.7);
      ctx.fill();

      // Timber load stacked on the deck, leaning against the headboard —
      // horizontal planks (s/S/T ramp) with two strap bands wrapping down
      // over the top and onto the deck's near face.
      const loadL = cabR + 1.4, loadR = bedR - 1.6, loadTop = 4.0, loadBottom = deckY + 0.4;
      fillRR(ctx, P.k, loadL - 0.6, loadTop - 0.6, loadR - loadL + 1.2, loadBottom - loadTop + 1.2, 1.0);
      const plankColors = [P.T, P.S, P.s, P.S, P.T, P.s];
      const plankH = (loadBottom - loadTop) / plankColors.length;
      for (let i = 0; i < plankColors.length; i++) {
        ctx.fillStyle = plankColors[i];
        ctx.fillRect(loadL, loadTop + i * plankH, loadR - loadL, plankH - 0.3);
      }
      // End-grain hint at the right (rear) end of the stack.
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(loadR - 1.6, loadTop, 1.6, loadBottom - loadTop);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(loadL, loadTop, 1.2, loadBottom - loadTop);
      // Straps.
      ctx.fillStyle = P.o;
      ctx.fillRect(loadL + (loadR - loadL) * 0.28, loadTop - 0.8, 1.5, loadBottom - loadTop + 2.6);
      ctx.fillRect(loadL + (loadR - loadL) * 0.68, loadTop - 0.8, 1.5, loadBottom - loadTop + 2.6);
      ctx.fillStyle = P.O;
      ctx.fillRect(loadL + (loadR - loadL) * 0.28, loadBottom + 0.4, 1.5, 1.3);
      ctx.fillRect(loadL + (loadR - loadL) * 0.68, loadBottom + 0.4, 1.5, 1.3);

      // Rear bumper + tail light at the far end.
      fillRR(ctx, P.k, bedR - 1.6, deckBottom + 0.2, 2.6, 3.4, 0.6);
      ellipse(ctx, P.k, bedR - 0.3, deckBottom + 2.0, 1.3, 1.0);
      ellipse(ctx, P.R, bedR - 0.3, deckBottom + 2.0, 0.85, 0.65);

      // Six wheels: one pair under the cab, two tandem pairs under the bed.
      wheel(ctx, P, 5.2, 19.0, 3.0, P.k);
      wheel(ctx, P, 9.6, 19.0, 3.0, P.k);
      wheel(ctx, P, 21.0, 19.4, 3.1, P.k);
      wheel(ctx, P, 24.6, 19.4, 3.1, P.k);
      wheel(ctx, P, 32.0, 19.4, 3.1, P.k);
      wheel(ctx, P, 35.6, 19.4, 3.1, P.k);
    },
  },

  // --- concrete mixer ---------------------------------------------------------
  mixer: {
    w: 40, h: 26,
    draw(ctx, P) {
      // Chassis.
      fillRR(ctx, P.k, 2, 15, 36, 6, 1.5);
      ctx.fillStyle = P.g;
      ctx.fillRect(3, 16, 34, 4);

      // Cab at the right, seen from behind.
      fillRR(ctx, P.k, 26, 6, 13, 11, 2);
      const cabG = ctx.createLinearGradient(26, 6, 39, 17);
      cabG.addColorStop(0, P.C);
      cabG.addColorStop(1, P.G);
      ctx.fillStyle = cabG;
      rr(ctx, 27, 7, 11, 9, 1.6); ctx.fill();
      fillRR(ctx, P.k, 28.5, 8.2, 8, 4.4, 0.8);
      fillRR(ctx, P.u, 29.2, 8.8, 6.6, 3.2, 0.6);

      // The drum: two ellipses joined into a taper, with spiral fins. This is
      // the shape that makes it a mixer instead of a box on wheels.
      ctx.fillStyle = P.k;
      ctx.beginPath();
      ctx.moveTo(6, 4.5);
      ctx.bezierCurveTo(14, 1.5, 21, 3.0, 24, 7.5);
      ctx.lineTo(24, 12.5);
      ctx.bezierCurveTo(21, 16.5, 14, 17.5, 6, 15.0);
      ctx.closePath();
      ctx.fill();
      const drum = ctx.createLinearGradient(0, 3, 0, 16);
      drum.addColorStop(0, P.C);
      drum.addColorStop(0.5, P.c);
      drum.addColorStop(1, P.G);
      ctx.fillStyle = drum;
      ctx.beginPath();
      ctx.moveTo(7, 5.4);
      ctx.bezierCurveTo(14.5, 2.8, 20.5, 4.2, 23, 8.0);
      ctx.lineTo(23, 12.2);
      ctx.bezierCurveTo(20.5, 15.6, 14.5, 16.4, 7, 14.2);
      ctx.closePath();
      ctx.fill();

      // Fins, following the drum's curve.
      ctx.strokeStyle = P.H;
      ctx.lineWidth = 1.1;
      for (const off of [-3, 1.5, 6]) {
        ctx.beginPath();
        ctx.moveTo(10 + off, 4.2);
        ctx.quadraticCurveTo(13 + off, 9.6, 10.5 + off, 15.2);
        ctx.stroke();
      }
      // Drum mouth at the left, and the chute below it.
      ellipse(ctx, P.k, 6.4, 9.8, 2.0, 5.2);
      ellipse(ctx, P.g, 6.4, 9.8, 1.3, 4.2);
      ctx.fillStyle = P.k;
      ctx.beginPath();
      ctx.moveTo(3.0, 12.0); ctx.lineTo(7.0, 12.0);
      ctx.lineTo(6.0, 18.0); ctx.lineTo(2.0, 17.0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.H;
      ctx.beginPath();
      ctx.moveTo(3.6, 12.6); ctx.lineTo(6.4, 12.6);
      ctx.lineTo(5.5, 17.2); ctx.lineTo(2.9, 16.4);
      ctx.closePath(); ctx.fill();

      // Ladder up the drum housing.
      ctx.strokeStyle = P.g;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(15, 5.0 + i * 2.6); ctx.lineTo(19, 5.6 + i * 2.6);
        ctx.stroke();
      }

      wheel(ctx, P, 8, 21, 3.6);
      wheel(ctx, P, 17, 21, 3.6);
      wheel(ctx, P, 26.5, 21, 3.4);
      wheel(ctx, P, 34, 21, 3.4);
    },
  },

  dumpster: {
    w: 34, h: 20,
    draw(ctx, P) {
      const cx = 17;
      const top = 2.4, bottom = 16.0;
      const topHalf = 13.4, botHalf = 9.6;

      // Tapered tub: wider at the top rim than the base, drawn as one
      // trapezoid so front and back read as a single connected container.
      ctx.fillStyle = P.k;
      ctx.beginPath();
      ctx.moveTo(cx - topHalf - 0.8, top);
      ctx.lineTo(cx + topHalf + 0.8, top);
      ctx.lineTo(cx + botHalf + 0.8, bottom);
      ctx.lineTo(cx - botHalf - 0.8, bottom);
      ctx.closePath();
      ctx.fill();

      const g = ctx.createLinearGradient(cx - topHalf, 0, cx + topHalf, 0);
      g.addColorStop(0, P.b);
      g.addColorStop(0.5, P.B);
      g.addColorStop(1, P.v);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - topHalf, top + 0.6);
      ctx.lineTo(cx + topHalf, top + 0.6);
      ctx.lineTo(cx + botHalf, bottom - 0.4);
      ctx.lineTo(cx - botHalf, bottom - 0.4);
      ctx.closePath();
      ctx.fill();

      // Ribbed panels: vertical corrugations that follow the taper.
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 1.0;
      const ribs = 6;
      for (let i = 1; i < ribs; i++) {
        const t = i / ribs;
        const xt = cx - topHalf + t * (topHalf * 2);
        const xb = cx - botHalf + t * (botHalf * 2);
        ctx.beginPath();
        ctx.moveTo(xt, top + 1.0);
        ctx.lineTo(xb, bottom - 0.6);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 0.6;
      for (let i = 1; i < ribs; i++) {
        const t = i / ribs;
        const xt = cx - topHalf + t * (topHalf * 2) + 0.5;
        const xb = cx - botHalf + t * (botHalf * 2) + 0.5;
        ctx.beginPath();
        ctx.moveTo(xt, top + 1.0);
        ctx.lineTo(xb, bottom - 0.6);
        ctx.stroke();
      }

      // Rolled rim along the top edge.
      fillRR(ctx, P.k, cx - topHalf - 1.2, top - 1.4, topHalf * 2 + 2.4, 2.4, 1.0);
      const rimG = ctx.createLinearGradient(0, top - 1.4, 0, top + 1.0);
      rimG.addColorStop(0, P.c);
      rimG.addColorStop(1, P.G);
      ctx.fillStyle = rimG;
      fillRR(ctx, rimG, cx - topHalf - 0.6, top - 1.0, topHalf * 2 + 1.2, 1.7, 0.8);

      // Timber offcuts stacked above the rim, jutting out at angles.
      const planks = [
        [-9.0, -6.4, 0.22, P.S],
        [-4.0, -8.6, -0.18, P.s],
        [1.5, -7.2, 0.3, P.T],
        [6.0, -9.4, -0.28, P.s],
        [9.6, -6.0, 0.12, P.S],
        [-1.5, -10.0, 0.05, P.T],
      ];
      for (const [dx, len, ang, col] of planks) {
        const x0 = cx + dx, y0 = top - 0.4;
        ctx.save();
        ctx.translate(x0, y0);
        ctx.rotate(ang);
        ctx.fillStyle = P.k;
        fillRR(ctx, P.k, -1.1, len, 2.2, -len, 0.5);
        ctx.fillStyle = col;
        ctx.fillRect(-0.75, len + 0.4, 1.5, -len - 0.8);
        ctx.restore();
      }

      // Base skids the bin rests on (no wheels — a skip sits on the ground).
      fillRR(ctx, P.k, cx - botHalf - 1.4, bottom - 0.4, botHalf * 2 + 2.8, 2.2, 0.6);
      ctx.fillStyle = P.g;
      ctx.fillRect(cx - botHalf - 0.8, bottom - 0.1, botHalf * 2 + 1.6, 1.3);
    },
  },
};
