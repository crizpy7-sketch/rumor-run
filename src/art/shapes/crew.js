// Crew poses beyond the base worker: the phone zombie, the radio talker,
// the kneeling tool-dropper, the one on his break, and the superintendent.
//
// Every entry is drawn with real geometry in target-pixel coordinates and
// compiled onto the palette by tools/genart.mjs. See ./kit.js for the shared
// helpers, and ./hero.js for worked examples.
//
//   { w, h, variants?: [[outputName, opts]], draw(ctx, PAL, opts) }

import { TAU, rr, fillRR, ellipse, wheel, hardHat, vestBody, head, legs } from './kit.js';

export const CREW = {
  // Head down, one arm bent up in front of the face holding a phone. The
  // "phone zombie" who wanders into the road without looking up.
  workerPhone: {
    w: 16, h: 24,
    variants: [
      ['workerPhone', {}],
      ['workerPhoneY', { hat: 'y' }],
    ],
    draw(ctx, P, opt = {}) {
      const cx = 8;
      const shell = opt.hat || P.C;
      const vest = opt.vest || P.l;
      const skin = opt.skin || P.f;
      const shade = opt.skinShade || P.F;

      legs(ctx, P, cx, 16.4, 7.6, 7.6, P.v);
      vestBody(ctx, P, cx, 9.2, 11.0, 7.8, vest);

      // Far arm hangs slack at the side.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 5.0, 10.0);
      ctx.quadraticCurveTo(cx - 6.0, 13.2, cx - 5.4, 16.0);
      ctx.stroke();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx - 5.0, 10.0);
      ctx.quadraticCurveTo(cx - 6.0, 13.2, cx - 5.4, 16.0);
      ctx.stroke();

      // Near arm bends at the elbow, hand pulled in to chest height — held
      // low, not up at the ear, so this reads apart from workerRadio.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 4.8, 10.4);
      ctx.quadraticCurveTo(cx + 6.4, 11.8, cx + 2.6, 12.2);
      ctx.stroke();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx + 4.8, 10.4);
      ctx.quadraticCurveTo(cx + 6.4, 11.8, cx + 2.6, 12.2);
      ctx.stroke();

      // Head tipped forward and well down, chin dropped toward the phone —
      // the single biggest tell of the pose, so push it further than a
      // normal nod.
      head(ctx, P, cx + 0.3, 7.8, 2.5, skin, shade);
      hardHat(ctx, P, cx + 0.3, 6.4, 7.2, shell);

      // Phone: a small dark slab held at chest height, tipped up toward the
      // lowered face, glass front toward the viewer.
      ctx.save();
      ctx.translate(cx + 2.4, 11.6);
      ctx.rotate(-0.55);
      fillRR(ctx, P.k, -1.3, -2.1, 2.6, 3.8, 0.5);
      fillRR(ctx, P.u, -1.0, -1.75, 2.0, 3.1, 0.35);
      ctx.restore();
    },
  },

  // One arm up, radio pressed to the ear. Short antenna, dark body.
  workerRadio: {
    w: 16, h: 24,
    variants: [
      ['workerRadio', {}],
      ['workerRadioO', { hat: 'o' }],
    ],
    draw(ctx, P, opt = {}) {
      const cx = 8;
      const shell = opt.hat || P.C;
      const vest = opt.vest || P.l;
      const skin = opt.skin || P.f;
      const shade = opt.skinShade || P.F;

      legs(ctx, P, cx, 16.4, 7.6, 7.6, P.v);
      vestBody(ctx, P, cx, 9.2, 11.0, 7.8, vest);

      // Far arm hangs at the side.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 4.9, 10.2);
      ctx.quadraticCurveTo(cx - 5.8, 13.4, cx - 5.2, 16.0);
      ctx.stroke();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx - 4.9, 10.2);
      ctx.quadraticCurveTo(cx - 5.8, 13.4, cx - 5.2, 16.0);
      ctx.stroke();

      // Near arm: elbow out and up, forearm straight up to the ear.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 4.6, 10.6);
      ctx.quadraticCurveTo(cx + 6.9, 9.6, cx + 6.3, 6.0);
      ctx.stroke();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx + 4.6, 10.6);
      ctx.quadraticCurveTo(cx + 6.9, 9.6, cx + 6.3, 6.0);
      ctx.stroke();

      head(ctx, P, cx, 6.0, 2.6, skin, shade);
      hardHat(ctx, P, cx, 4.6, 7.4, shell);

      // Radio: dark body against the ear, plus a short metal antenna.
      ctx.save();
      ctx.translate(cx + 6.4, 5.6);
      fillRR(ctx, P.k, -1.1, -2.0, 2.4, 3.8, 0.5);
      ctx.fillStyle = P.g;
      ctx.fillRect(-0.7, -1.5, 1.6, 1.1);
      ctx.strokeStyle = P.G;
      ctx.lineWidth = 0.7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0.5, -1.9);
      ctx.lineTo(1.2, -4.2);
      ctx.stroke();
      ctx.restore();
    },
  },

  // Standing, one arm extended sideways holding the end of a tape measure —
  // a small yellow tab pinched between finger and thumb.
  workerMeasure: {
    w: 16, h: 24,
    variants: [
      ['workerMeasure', {}],
      ['workerMeasureY', { hat: 'y' }],
    ],
    draw(ctx, P, opt = {}) {
      const cx = 8;
      const shell = opt.hat || P.C;
      const vest = opt.vest || P.l;
      const skin = opt.skin || P.f;
      const shade = opt.skinShade || P.F;

      legs(ctx, P, cx, 16.4, 7.6, 7.6, P.v);
      vestBody(ctx, P, cx, 9.2, 11.0, 7.8, vest);

      // Near arm tucked, hand at the hip (holds the tape body, implied).
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 4.9, 10.2);
      ctx.quadraticCurveTo(cx - 5.6, 12.6, cx - 4.6, 14.2);
      ctx.stroke();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx - 4.9, 10.2);
      ctx.quadraticCurveTo(cx - 5.6, 12.6, cx - 4.6, 14.2);
      ctx.stroke();

      // Far arm extended straight out sideways, almost horizontal, pinching
      // the tape tab at the end. Kept inside the 16px canvas — anything past
      // ~x=15.5 gets silently clipped by the render, not drawn short.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 4.8, 10.6);
      ctx.quadraticCurveTo(cx + 6.8, 10.6, cx + 7.4, 11.4);
      ctx.stroke();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx + 4.8, 10.6);
      ctx.quadraticCurveTo(cx + 6.8, 10.6, cx + 7.4, 11.4);
      ctx.stroke();

      head(ctx, P, cx, 6.0, 2.6, skin, shade);
      hardHat(ctx, P, cx, 4.6, 7.4, shell);

      // The tape line itself, thin and taut, plus the tab at the end.
      ctx.strokeStyle = P.C;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx + 7.4, 11.4);
      ctx.lineTo(cx + 7.4, 16.4);
      ctx.stroke();
      fillRR(ctx, P.k, cx + 6.7, 10.6, 2.0, 1.6, 0.4);
      fillRR(ctx, P.y, cx + 6.9, 10.8, 1.6, 1.2, 0.3);
    },
  },

  // Kneeling on one knee, orange vest, reaching down — he has just dropped
  // his tools. Silhouette drops a full head-height lower than standing.
  workerKneel: {
    w: 16, h: 24,
    variants: [
      ['workerKneel', {}],
      ['workerKneelY', { hat: 'y' }],
    ],
    draw(ctx, P, opt = {}) {
      const cx = 8;
      const shell = opt.hat || P.C;
      const vest = opt.vest || P.o;
      const skin = opt.skin || P.f;
      const shade = opt.skinShade || P.F;

      // Legs are drawn as thick capsule strokes (dark outline, cloth inset)
      // bent at the knee — the same technique as the limbs, scaled up —
      // rather than stacked rectangles, which is what fell apart last round.
      ctx.lineJoin = 'round';

      // Down leg: thigh drops back off the hip, knee touches the ground,
      // shin+foot trail flat along the ground behind him.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 3.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 1.6, 17.2);
      ctx.lineTo(cx - 4.2, 21.0);
      ctx.lineTo(cx - 6.8, 22.0);
      ctx.stroke();
      ctx.strokeStyle = P.v;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(cx - 1.6, 17.2);
      ctx.lineTo(cx - 4.2, 21.0);
      ctx.lineTo(cx - 6.8, 22.0);
      ctx.stroke();
      // Trailing boot.
      ellipse(ctx, P.k, cx - 7.4, 22.3, 1.7, 1.0);

      // Up leg: thigh forward and down to a bent knee, shin near-vertical
      // down to a planted foot — the classic kneeling L.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 2.0, 17.0);
      ctx.lineTo(cx + 4.6, 19.2);
      ctx.lineTo(cx + 3.9, 23.2);
      ctx.stroke();
      ctx.strokeStyle = P.v;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(cx + 2.0, 17.0);
      ctx.lineTo(cx + 4.6, 19.2);
      ctx.lineTo(cx + 3.9, 23.2);
      ctx.stroke();
      // Planted boot.
      fillRR(ctx, P.k, cx + 2.3, 22.8, 3.4, 1.6, 0.6);

      // Torso leans forward and down over the bent front knee.
      vestBody(ctx, P, cx - 0.2, 11.2, 10.0, 6.4, vest);

      // Trailing arm braced back near the down knee.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 4.4, 12.6);
      ctx.quadraticCurveTo(cx - 6.2, 14.6, cx - 4.6, 17.6);
      ctx.stroke();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx - 4.4, 12.6);
      ctx.quadraticCurveTo(cx - 6.2, 14.6, cx - 4.6, 17.6);
      ctx.stroke();

      // Reaching arm: shoulder down, elbow bent, hand toward the ground
      // where the dropped tool landed.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 4.4, 12.4);
      ctx.quadraticCurveTo(cx + 7.2, 14.4, cx + 6.4, 18.4);
      ctx.stroke();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx + 4.4, 12.4);
      ctx.quadraticCurveTo(cx + 7.2, 14.4, cx + 6.4, 18.4);
      ctx.stroke();

      // Head down, chin toward the ground he's reaching at.
      head(ctx, P, cx - 0.4, 9.8, 2.4, skin, shade);
      hardHat(ctx, P, cx - 0.4, 8.4, 7.0, shell);

      // A dropped tool: a small wrench-like shape by the reaching hand.
      ctx.save();
      ctx.translate(cx + 6.2, 19.4);
      ctx.rotate(0.5);
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-1.6, 0);
      ctx.lineTo(1.6, 0);
      ctx.stroke();
      ctx.strokeStyle = P.G;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-1.6, 0);
      ctx.lineTo(1.6, 0);
      ctx.stroke();
      ctx.restore();
    },
  },

  // Sitting — knees forward, orange vest, hands resting on knees. Draw only
  // the person; the cooler he's perched on is somebody else's sprite.
  workerSit: {
    w: 16, h: 24,
    variants: [
      ['workerSit', {}],
      ['workerSitY', { hat: 'y' }],
    ],
    draw(ctx, P, opt = {}) {
      const cx = 8;
      const shell = opt.hat || P.C;
      const vest = opt.vest || P.o;
      const skin = opt.skin || P.f;
      const shade = opt.skinShade || P.F;

      // Thighs run forward (toward viewer) from a seat around y=17, shins
      // drop straight down — the classic seated L, feet flat near the base.
      ctx.fillStyle = P.k;
      fillRR(ctx, P.k, cx - 6.6, 16.6, 5.6, 4.4, 1.1);
      fillRR(ctx, P.k, cx + 1.0, 16.6, 5.6, 4.4, 1.1);
      ctx.fillStyle = P.v;
      ctx.fillRect(cx - 6.1, 17.1, 4.6, 3.2);
      ctx.fillRect(cx + 1.5, 17.1, 4.6, 3.2);

      // Shins, near-vertical, planting the feet under the knees.
      fillRR(ctx, P.k, cx - 6.2, 19.6, 4.6, 4.2, 0.9);
      fillRR(ctx, P.k, cx + 1.6, 19.6, 4.6, 4.2, 0.9);
      ctx.fillStyle = P.v;
      ctx.fillRect(cx - 5.7, 20.0, 3.6, 2.6);
      ctx.fillRect(cx + 2.1, 20.0, 3.6, 2.6);
      // Boots.
      ctx.fillStyle = P.k;
      ctx.fillRect(cx - 6.8, 22.4, 5.6, 1.6);
      ctx.fillRect(cx + 1.0, 22.4, 5.6, 1.6);

      // Shortened seated torso — knees eat the leg length so the hips sit
      // higher on the sprite than a standing worker's.
      vestBody(ctx, P, cx, 10.4, 11.0, 6.6, vest);

      // Arms rest down onto the knees, elbows bent out slightly.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 5.0, 11.6);
      ctx.quadraticCurveTo(cx - 6.6, 14.4, cx - 4.6, 17.0);
      ctx.moveTo(cx + 5.0, 11.6);
      ctx.quadraticCurveTo(cx + 6.6, 14.4, cx + 4.6, 17.0);
      ctx.stroke();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx - 5.0, 11.6);
      ctx.quadraticCurveTo(cx - 6.6, 14.4, cx - 4.6, 17.0);
      ctx.moveTo(cx + 5.0, 11.6);
      ctx.quadraticCurveTo(cx + 6.6, 14.4, cx + 4.6, 17.0);
      ctx.stroke();

      head(ctx, P, cx, 7.2, 2.6, skin, shade);
      hardHat(ctx, P, cx, 5.8, 7.4, shell);
    },
  },

  // Flinching: head pulled down into the shoulders, arms tucked in tight.
  workerDuck: {
    w: 16, h: 24,
    variants: [
      ['workerDuck', {}],
      ['workerDuckY', { hat: 'y' }],
    ],
    draw(ctx, P, opt = {}) {
      const cx = 8;
      const shell = opt.hat || P.C;
      const vest = opt.vest || P.l;
      const skin = opt.skin || P.f;
      const shade = opt.skinShade || P.F;

      // Knees bent a touch, sinking the whole stance down slightly — a
      // flinch pulls a body down and in, not just the head.
      legs(ctx, P, cx, 17.0, 7.6, 7.0, P.v);

      // Torso hunched: wider and shorter than standing, so the shoulders
      // read as raised even before the shoulder mounds go on top.
      vestBody(ctx, P, cx, 11.6, 11.6, 5.8, vest);

      // Arms tucked in tight against the ribs — short strokes hugging the
      // torso silhouette, not reaching out, hands drawn up near the chest.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 5.2, 12.4);
      ctx.quadraticCurveTo(cx - 6.0, 13.6, cx - 3.4, 14.4);
      ctx.moveTo(cx + 5.2, 12.4);
      ctx.quadraticCurveTo(cx + 6.0, 13.6, cx + 3.4, 14.4);
      ctx.stroke();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx - 5.2, 12.4);
      ctx.quadraticCurveTo(cx - 6.0, 13.6, cx - 3.4, 14.4);
      ctx.moveTo(cx + 5.2, 12.4);
      ctx.quadraticCurveTo(cx + 6.0, 13.6, cx + 3.4, 14.4);
      ctx.stroke();

      // Head pulled way down, sunk to where a neck would be.
      head(ctx, P, cx, 10.2, 2.3, skin, shade);
      hardHat(ctx, P, cx, 8.9, 6.8, shell);

      // Raised shoulder mounds that climb up either side of the head,
      // swallowing the neck — this is the tell that sells the flinch.
      ellipse(ctx, P.k, cx - 4.1, 11.0, 2.1, 1.6);
      ellipse(ctx, P.k, cx + 4.1, 11.0, 2.1, 1.6);
      ellipse(ctx, vest, cx - 4.1, 10.7, 1.5, 1.1);
      ellipse(ctx, vest, cx + 4.1, 10.7, 1.5, 1.1);
    },
  },

  // The superintendent: orange hard hat, orange vest, dark trousers, a
  // clipboard held across his chest. He is furious.
  super: {
    w: 16, h: 24,
    draw(ctx, P) {
      const cx = 8;
      const skin = P.f;
      const shade = P.F;

      legs(ctx, P, cx, 16.4, 7.6, 7.6, P.d);
      vestBody(ctx, P, cx, 9.2, 11.0, 7.8, P.o);

      // Arms bent, both forearms crossing in to grip the clipboard against
      // the chest.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 4.8, 10.4);
      ctx.quadraticCurveTo(cx - 6.0, 12.2, cx - 2.6, 12.6);
      ctx.moveTo(cx + 4.8, 10.4);
      ctx.quadraticCurveTo(cx + 6.0, 12.2, cx + 2.6, 12.6);
      ctx.stroke();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx - 4.8, 10.4);
      ctx.quadraticCurveTo(cx - 6.0, 12.2, cx - 2.6, 12.6);
      ctx.moveTo(cx + 4.8, 10.4);
      ctx.quadraticCurveTo(cx + 6.0, 12.2, cx + 2.6, 12.6);
      ctx.stroke();

      // Clipboard: white plastic rectangle with a dark clip across the top.
      fillRR(ctx, P.k, cx - 3.0, 10.2, 6.0, 5.0, 0.6);
      fillRR(ctx, P.C, cx - 2.6, 10.6, 5.2, 4.2, 0.4);
      ctx.fillStyle = P.k;
      ctx.fillRect(cx - 1.2, 10.2, 2.4, 1.0);
      ctx.fillStyle = P.g;
      ctx.fillRect(cx - 1.0, 10.35, 2.0, 0.7);
      // Lines of notes on the board.
      ctx.strokeStyle = P.G;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(cx - 2.0, 12.0); ctx.lineTo(cx + 1.8, 12.0);
      ctx.moveTo(cx - 2.0, 13.0); ctx.lineTo(cx + 1.8, 13.0);
      ctx.moveTo(cx - 2.0, 14.0); ctx.lineTo(cx + 1.0, 14.0);
      ctx.stroke();

      head(ctx, P, cx, 6.0, 2.6, skin, shade);

      // Furious brows: a short dark wedge low over each eye.
      ctx.fillStyle = P.k;
      ctx.save();
      ctx.translate(cx - 1.3, 5.5);
      ctx.rotate(0.35);
      ctx.fillRect(-0.9, -0.3, 1.8, 0.7);
      ctx.restore();
      ctx.save();
      ctx.translate(cx + 1.3, 5.5);
      ctx.rotate(-0.35);
      ctx.fillRect(-0.9, -0.3, 1.8, 0.7);
      ctx.restore();
      // Downturned mouth.
      ctx.strokeStyle = P.k;
      ctx.lineWidth = 0.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 1.1, 7.1);
      ctx.quadraticCurveTo(cx, 6.6, cx + 1.1, 7.1);
      ctx.stroke();

      hardHat(ctx, P, cx, 4.6, 7.4, P.o);
    },
  },
};
