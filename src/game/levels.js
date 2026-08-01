// Route data: the eight shifts, the catalogue of things that stand on them, and
// the generator that turns a seed into a route.

import { makeRng, hashSeed } from '../engine/rng.js';
import { ROAD } from './road.js';
import { FOOTPRINTS } from '../art/names.js';

// --- catalogue ------------------------------------------------------------

// `harm` decides what hitting the thing does to the buggy; see play.js.
export const HAZARDS = {
  cone:         { sprite: 'cone', harm: 'clip', onRoad: true, w: 3 },
  barrel:       { sprite: 'barrel', harm: 'hard', onRoad: true, w: 2 },
  planks:       { sprite: 'planks', harm: 'hard', onRoad: true, w: 1.6 },
  mixer:        { sprite: 'mixer', harm: 'hard', onRoad: true, w: 1 },
  sandpile:     { sprite: 'sandpile', harm: 'hard', onRoad: true, w: 1 },
  pothole:      { sprite: 'pothole', harm: 'jolt', onRoad: true, decal: true, w: 2.4 },
  puddle:       { sprite: 'puddle', harm: 'slip', onRoad: true, decal: true, w: 1.8 },
  gravel:       { sprite: 'gravel', harm: 'drag', onRoad: true, decal: true, w: 1.4 },
  barrow:       { sprite: 'barrow', harm: 'clip', onRoad: true, w: 1.2, mobile: 'roll' },
  forklift:     { sprite: 'forklift', harm: 'hard', onRoad: true, w: 1, mobile: 'cross', telegraph: 30 },
  coffeeWorker: { sprite: 'worker', harm: 'soft', onRoad: true, w: 1.4, mobile: 'cross', telegraph: 30 },
  pole:         { sprite: 'pole', harm: 'hard', onRoad: true, w: 1, mobile: 'drop', telegraph: 30 },
};

export const TARGETS = {
  crew:         { sprite: 'worker', foot: 'crew', points: 100, label: 'CREW' },
  scaffoldCrew: { sprite: 'worker', foot: 'scaffoldCrew', points: 180, label: 'SCAFFOLD', rig: 'scaffold' },
  foreman:      { sprite: 'foreman', foot: 'foreman', points: 260, label: 'FOREMAN', bonus: true },
  teaHut:       { sprite: 'teaHut', foot: 'teaHut', points: 70, label: 'TEA HUT', wide: true },
};

export const SCENERY = ['sign', 'floodlight', 'portaloo', 'fence', 'crate'];

// --- levels ---------------------------------------------------------------

const L = (id, name, extra) => ({
  id,
  name,
  theme: 'day',
  length: 900,
  quota: 6,
  speedCap: 15,
  targetGap: 46,
  hazardGap: 30,
  crateGap: 190,
  hazards: ['cone'],
  targets: ['crew'],
  bpm: 104,
  scale: 'work',
  root: 0,
  ...extra,
});

export const LEVELS = [
  L(1, 'MORNING GATE', {
    blurb: 'GATE TO THE SPOIL HEAP. EASY ROAD, LOUD CREWS.',
    theme: 'day', length: 900, quota: 6, speedCap: 15,
    hazards: ['cone', 'cone', 'barrel'],
    targets: ['crew', 'crew', 'teaHut'],
    targetGap: 48, hazardGap: 38, bpm: 100,
  }),
  L(2, 'SPOIL HEAP', {
    blurb: 'THEY DUG UP THE ROAD AND LEFT IT THERE.',
    theme: 'dust', length: 1000, quota: 8, speedCap: 16,
    hazards: ['cone', 'barrel', 'pothole', 'planks'],
    targets: ['crew', 'crew', 'crew', 'teaHut'],
    targetGap: 44, hazardGap: 32, bpm: 104, root: 2,
  }),
  L(3, 'MIXER ALLEY', {
    blurb: 'NARROW, LOUD, AND FULL OF CONCRETE.',
    theme: 'day', length: 1100, quota: 9, speedCap: 17,
    hazards: ['cone', 'barrel', 'pothole', 'mixer', 'barrow'],
    targets: ['crew', 'crew', 'foreman', 'teaHut'],
    targetGap: 42, hazardGap: 28, bpm: 108, root: 3,
  }),
  L(4, 'THE WET POUR', {
    blurb: 'RAIN CAME IN. THE SURFACE DID NOT SET.',
    theme: 'wet', length: 1200, quota: 10, speedCap: 17,
    hazards: ['cone', 'puddle', 'puddle', 'gravel', 'pothole', 'planks'],
    targets: ['crew', 'crew', 'crew', 'foreman'],
    targetGap: 42, hazardGap: 26, bpm: 96, scale: 'night', root: -2,
  }),
  L(5, 'FORKLIFT CROSSING', {
    blurb: 'THEY REVERSE WITHOUT LOOKING. ALL OF THEM.',
    theme: 'dust', length: 1300, quota: 11, speedCap: 18,
    hazards: ['cone', 'barrel', 'forklift', 'forklift', 'coffeeWorker', 'pothole'],
    targets: ['crew', 'crew', 'scaffoldCrew', 'foreman'],
    targetGap: 40, hazardGap: 26, bpm: 112, scale: 'tense', root: 1,
  }),
  L(6, 'SCAFFOLD ROW', {
    blurb: 'THE BEST EARS ON SITE ARE THREE METRES UP.',
    theme: 'dusk', length: 1400, quota: 12, speedCap: 19,
    hazards: ['cone', 'barrel', 'pole', 'planks', 'forklift', 'sandpile'],
    targets: ['scaffoldCrew', 'scaffoldCrew', 'crew', 'foreman'],
    targetGap: 40, hazardGap: 24, bpm: 116, scale: 'bright', root: 3,
  }),
  L(7, 'NIGHT POUR', {
    blurb: 'FLOODLIGHTS ON. NOBODY WENT HOME.',
    theme: 'night', length: 1500, quota: 13, speedCap: 20,
    hazards: ['cone', 'barrel', 'puddle', 'pole', 'forklift', 'coffeeWorker', 'mixer'],
    targets: ['crew', 'scaffoldCrew', 'foreman', 'teaHut'],
    targetGap: 38, hazardGap: 22, bpm: 120, scale: 'tense', root: -1,
  }),
  L(8, 'THE LONG GATE', {
    blurb: 'LAST RUN. BOMBA IS WAITING AT THE FAR GATE.',
    theme: 'night', length: 1700, quota: 14, speedCap: 21,
    hazards: ['cone', 'barrel', 'puddle', 'pole', 'forklift', 'coffeeWorker', 'mixer', 'sandpile', 'gravel'],
    targets: ['crew', 'scaffoldCrew', 'scaffoldCrew', 'foreman', 'teaHut'],
    targetGap: 36, hazardGap: 20, bpm: 126, scale: 'bright', root: 5,
  }),
];

// --- upgrades -------------------------------------------------------------

export const UPGRADES = [
  { id: 'arm',   name: 'BETTER ARM',   desc: '+2M THROW RANGE',        apply: (s) => { s.throwRange += 2; } },
  { id: 'grip',  name: 'SITE TYRES',   desc: 'SHARPER STEERING',       apply: (s) => { s.grip += 0.22; } },
  { id: 'rack',  name: 'PAPER RACK',   desc: '+5 SHEETS CARRIED',      apply: (s) => { s.sheetMax += 5; } },
  { id: 'guard', name: 'BUMP GUARD',   desc: 'CRASHES COST LESS',      apply: (s) => { s.guard += 0.3; } },
  { id: 'turbo', name: 'TUNED ENGINE', desc: '+2 M/S TOP SPEED',       apply: (s) => { s.speedBonus += 2; } },
  { id: 'eye',   name: 'SPOTTER',      desc: 'HAZARDS FLAG EARLIER',   apply: (s) => { s.spotter += 12; } },
  { id: 'loop',  name: 'LOUD MOUTH',   desc: 'COMBO HOLDS LONGER',     apply: (s) => { s.comboHold += 1.1; } },
  { id: 'luck',  name: 'SUPPLY LINE',  desc: 'MORE PAPER CRATES',      apply: (s) => { s.crateBonus += 0.5; } },
  { id: 'loft',  name: 'HIGH LOB',     desc: 'SHEETS FLY HIGHER',      apply: (s) => { s.loft += 0.45; } },
];

export function baseStats() {
  return {
    throwRange: 10,
    grip: 1,
    sheetMax: 12,
    guard: 0,
    speedBonus: 0,
    spotter: 0,
    // Crews are ~40 m apart, which is about three seconds at cruise: the combo
    // has to outlive the gap or it can never chain.
    comboHold: 4.2,
    crateBonus: 0,
    loft: 1,
    owned: [],
  };
}

/** Three upgrades the player has not already taken. */
export function offerUpgrades(rng, stats, count = 3) {
  const pool = UPGRADES.filter((u) => stats.owned.filter((o) => o === u.id).length < 3);
  return rng.shuffled(pool).slice(0, count);
}

// --- route generation -----------------------------------------------------

/**
 * Build a whole route up front. Everything is deterministic from the level
 * seed, so a capture run and a play run see the same jobsite.
 */
export function buildRoute(level, seedSalt = '') {
  const rng = makeRng(hashSeed(`rumor-run:${level.id}:${seedSalt}`));
  const targets = [];
  const hazards = [];
  const pickups = [];
  const scenery = [];

  const startS = 70;
  const endS = level.length - 60;

  // Targets alternate sides with a bias, so you learn to work both hands.
  let side = rng.chance(0.5) ? 1 : -1;
  for (let s = startS; s < endS; s += level.targetGap * rng.range(0.82, 1.2)) {
    if (rng.chance(0.72)) side = -side;
    const kind = rng.pick(level.targets);
    const def = TARGETS[kind];
    // Crews stand just off the shoulder: close enough that a throw from the
    // right-hand side of the road reaches them, far enough that you have to
    // commit to a side before the gap closes.
    const offset = def.wide ? rng.range(1.8, 2.8) : rng.range(0.8, 2.4);
    targets.push({
      kind,
      def,
      s: Math.round(s * 10) / 10,
      t: side * (ROAD.edge + offset),
      side,
      hit: false,
      quality: null,
      react: 0,
      barkAt: 0,
      bark: '',
    });
  }

  // Hazards, kept a respectful distance from targets so a delivery is never
  // impossible to line up.
  for (let s = startS - 30; s < endS + 20; s += level.hazardGap * rng.range(0.7, 1.35)) {
    const kind = rng.pick(level.hazards);
    const def = HAZARDS[kind];
    const count = def.w > 1 ? rng.int(1, Math.round(def.w)) : 1;
    for (let i = 0; i < count; i++) {
      const spread = i === 0 ? 0 : rng.range(-1, 1) * 2.6;
      const t = clamp(rng.range(-ROAD.halfW + 0.8, ROAD.halfW - 0.8) + spread, -ROAD.halfW - 0.4, ROAD.halfW + 0.4);
      const h = {
        kind,
        def,
        s: Math.round((s + i * rng.range(2, 5)) * 10) / 10,
        t,
        t0: t,
        state: 'idle',
        timer: 0,
        dir: rng.chance(0.5) ? 1 : -1,
        speed: rng.range(2.4, 4.2),
        hitBy: false,
        nearCounted: false,
      };
      if (def.mobile === 'cross') {
        h.dir = rng.chance(0.5) ? 1 : -1;
        h.t = -h.dir * (ROAD.halfW + 2.5);
        h.t0 = h.t;
      }
      if (def.mobile === 'drop') {
        h.t = rng.range(-2.4, 2.4);
        h.t0 = h.t;
        h.z = 6;
      }
      hazards.push(h);
    }
  }

  // Paper crates on the road, plus the odd mug of tea for a speed burst.
  for (let s = 120; s < endS; s += level.crateGap * rng.range(0.8, 1.2)) {
    pickups.push({
      kind: rng.chance(0.22) ? 'tea' : 'crate',
      s: Math.round(s * 10) / 10,
      t: rng.range(-ROAD.halfW + 1.2, ROAD.halfW - 1.2),
      taken: false,
    });
  }

  // Set dressing well off the route.
  for (let s = 0; s < level.length + 40; s += rng.range(18, 46)) {
    const sd = rng.chance(0.5) ? 1 : -1;
    scenery.push({
      kind: rng.pick(SCENERY),
      s,
      t: sd * rng.range(ROAD.edge + 6, ROAD.edge + 20),
    });
  }

  const sortS = (a, b) => a.s - b.s;
  targets.sort(sortS);
  hazards.sort(sortS);
  pickups.sort(sortS);
  scenery.sort(sortS);

  return {
    targets,
    hazards: makeFair(hazards, targets),
    pickups,
    scenery,
    length: level.length,
  };
}

const BUGGY_W = FOOTPRINTS.buggy.lt;
const MIN_GAP = 2.8;        // metres of clean road a buggy needs to thread
const APPROACH = 13;        // metres of run-up a delivery needs

/**
 * A random route is not automatically a fair one. Two passes fix that:
 *
 *  1. Never let solid hazards close the road. Walking the route in order, a
 *     hazard is dropped if adding it would leave less than MIN_GAP of clean
 *     surface anywhere across the paved width.
 *  2. Keep the delivery line open. The outer half of a crew's own side is
 *     cleared for the length of the run-up, so a throw is always *possible* —
 *     taking it is still the player's problem.
 */
function makeFair(hazards, targets) {
  const kept = [];
  for (const h of hazards) {
    if (h.def.decal) { kept.push(h); continue; } // flat hazards punish, they do not block
    const near = kept.filter((k) => !k.def.decal && Math.abs(k.s - h.s) < 4.5).concat([h]);
    const spans = near
      .map((k) => {
        const half = (FOOTPRINTS[k.kind].lt + BUGGY_W) / 2;
        return [k.t - half, k.t + half];
      })
      .sort((a, b) => a[0] - b[0]);

    let widest = 0;
    let cursor = -ROAD.halfW;
    for (const [a, b] of spans) {
      if (a > cursor) widest = Math.max(widest, a - cursor);
      cursor = Math.max(cursor, b);
    }
    widest = Math.max(widest, ROAD.halfW - cursor);
    if (widest >= MIN_GAP) kept.push(h);
  }

  const clear = new Set();
  for (const tg of targets) {
    const side = Math.sign(tg.t) || 1;
    for (const h of kept) {
      if (h.s < tg.s - APPROACH || h.s > tg.s + 2) continue;
      if (Math.sign(h.t) === side && Math.abs(h.t) > 1.6) clear.add(h);
    }
  }
  return kept.filter((h) => !clear.has(h));
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
