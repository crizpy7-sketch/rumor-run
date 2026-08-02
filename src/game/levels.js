// Route data: the eight shifts, the catalogue of things that stand on them, and
// the generator that turns a seed into a route.

import { makeRng, hashSeed } from '../engine/rng.js';
import { ROAD } from './road.js';
import { FOOTPRINTS } from '../art/names.js';

// --- catalogue --------------------------------------------------------------
//
// Three families, straight off the jobsite: the material you stack, the crew
// who stand in front of it, and the machines that do not look where they are
// going. `harm` decides what hitting the thing does to the cart; `say` is what
// the site shouts as you go past.

export const HAZARDS = {
  // Scaffold material — inert, heavy, and left exactly where it was dropped.
  pipePile:      { sprite: 'pipePile', harm: 'hard', family: 'material', say: 'STAY CLEAR!' },
  frameStack:    { sprite: 'frameStack', harm: 'hard', family: 'material', say: 'HIGH STACK!' },
  plankBundle:   { sprite: 'plankBundle', harm: 'hard', family: 'material', say: 'MIND THE BOARDS!' },
  jacks:         { sprite: 'jacks', harm: 'clip', family: 'material', say: 'JACKS OUT!' },
  couplers:      { sprite: 'couplers', harm: 'clip', family: 'material', say: 'COUNT THEM AGAIN!' },
  steelBeams:    { sprite: 'steelBeams', harm: 'hard', family: 'material', say: 'CAUTION!' },

  // Crew obstacles — nobody gets hurt, everybody gets annoyed.
  pipeCarriers:  { sprite: 'pipeLong', harm: 'soft', family: 'crew', say: 'COMING THRU!', mobile: 'walk', telegraph: 30, carry: true },
  radioTalker:   { sprite: 'workerRadioO', harm: 'soft', family: 'crew', say: '...OVER!' },
  breakBlockade: { sprite: 'workerSit', harm: 'soft', family: 'crew', say: '15 MIN, JEFE!', crowd: true },
  phoneZombie:   { sprite: 'workerPhoneY', harm: 'soft', family: 'crew', say: '...', mobile: 'wander' },
  toolDrop:      { sprite: 'workerKneel', harm: 'soft', family: 'crew', say: 'OOPS!', spill: true },
  measuring:     { sprite: 'workerMeasure', harm: 'soft', family: 'crew', say: 'GOTTA BE PERFECT!', tape: true },

  // Heavy equipment — these ones will actually end your shift.
  forklift:      { sprite: 'forklift', harm: 'hard', family: 'heavy', say: 'BEEP BEEP!', mobile: 'cross', telegraph: 30 },
  companyTruck:  { sprite: 'truck', harm: 'hard', family: 'heavy', say: 'MOVE IT!', mobile: 'cross', telegraph: 30 },
  flatbed:       { sprite: 'flatbed', harm: 'hard', family: 'heavy', say: 'WIDE LOAD!', mobile: 'cross', telegraph: 36 },
  craneSwing:    { sprite: 'craneHook', harm: 'hard', family: 'heavy', say: 'SWING!', mobile: 'swing', telegraph: 30 },
  dumpster:      { sprite: 'dumpster', harm: 'hard', family: 'heavy', say: 'NOT TRASH!' },
  concretePour:  { sprite: 'wetPatch', harm: 'slip', family: 'heavy', say: 'WET FLOOR!', decal: true },

  // Site furniture and weather debris.
  cone:          { sprite: 'cone', harm: 'clip', family: 'material', say: 'MIND THE CONES!', w: 3 },
  barrel:        { sprite: 'barrel', harm: 'clip', family: 'material', say: 'ROLL IT BACK!', w: 2 },
  pothole:       { sprite: 'pothole', harm: 'jolt', family: 'material', say: 'THAT ONE AGAIN!', decal: true, w: 2 },
  puddle:        { sprite: 'puddle', harm: 'slip', family: 'material', say: 'SLIPPY!', decal: true, w: 2 },
  gravel:        { sprite: 'gravel', harm: 'drag', family: 'material', say: 'LOOSE STUFF!', decal: true },
  sandpile:      { sprite: 'sandpile', harm: 'hard', family: 'material', say: 'WHOSE SAND?' },
  rollingPipe:   { sprite: 'pipeLong', harm: 'clip', family: 'chaos', say: 'PIPE LOOSE!', mobile: 'roll' },
  debris:        { sprite: 'couplers', harm: 'clip', family: 'chaos', say: 'SCAFFOLD DOWN!' },
};

export const TARGETS = {
  crew:         { sprite: 'worker', cheer: 'workerCheer', foot: 'crew', points: 100, label: 'CREW' },
  scaffoldCrew: { sprite: 'workerY', cheer: 'workerCheerY', foot: 'scaffoldCrew', points: 190, label: 'SCAFFOLD', rig: 'scaffold' },
  foreman:      { sprite: 'workerO', cheer: 'workerCheerO', foot: 'foreman', points: 260, label: 'FOREMAN', bonus: true },
  breakCrew:    { sprite: 'workerSit', cheer: 'workerCheer', foot: 'breakCrew', points: 80, label: 'BREAK CREW', wide: true },
};

// --- power ups (rumor fuel) -------------------------------------------------

export const POWERUPS = {
  speed:     { sprite: 'puSpeed', name: 'SPEED BOOST', colour: '#ff7a3d', apply: (run, buggy) => { buggy.boost = 5; } },
  papers:    { sprite: 'puPapers', name: 'EXTRA RUMORS', colour: '#fdf6e0', apply: (run, buggy, stats) => { run.sheets = Math.min(stats.sheetMax, run.sheets + 8); } },
  vest:      { sprite: 'puVest', name: 'SHIELD VEST', colour: '#c8e04a', apply: (run) => { run.shield = 12; } },
  confusion: { sprite: 'puConfusion', name: 'CONFUSION', colour: '#ffd24a', apply: (run) => { run.confusion = 9; } },
  bomba:     { sprite: 'puBomba', name: 'BOMBA TIME', colour: '#ff7a3d', apply: (run) => { run.bombaTime = 8; } },
};

export const SCENERY = ['signStay', 'signCaution', 'floodlight', 'portaloo', 'fence', 'cooler', 'toolbox'];

// --- levels -----------------------------------------------------------------

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
  chaos: {},
  bpm: 104,
  scale: 'work',
  root: 0,
  ...extra,
});

export const LEVELS = [
  L(1, 'MORNING GATE', {
    blurb: 'GATE TO THE SPOIL HEAP. EASY ROAD, LOUD CREWS.',
    theme: 'day', length: 900, quota: 6, speedCap: 15,
    hazards: ['cone', 'cone', 'barrel', 'pipePile'],
    targets: ['crew', 'crew', 'breakCrew'],
    targetGap: 48, hazardGap: 38, bpm: 100,
  }),
  L(2, 'SPOIL HEAP', {
    blurb: 'THEY DUG UP THE ROAD AND LEFT THE MATERIAL ON IT.',
    theme: 'dust', length: 1000, quota: 8, speedCap: 16,
    hazards: ['cone', 'barrel', 'pothole', 'plankBundle', 'couplers', 'jacks'],
    targets: ['crew', 'crew', 'crew', 'breakCrew'],
    targetGap: 44, hazardGap: 32, bpm: 104, root: 2,
  }),
  L(3, 'MIXER ALLEY', {
    blurb: 'NARROW, LOUD, AND EVERY MACHINE IS REVERSING.',
    theme: 'day', length: 1100, quota: 9, speedCap: 17,
    hazards: ['cone', 'barrel', 'pothole', 'dumpster', 'forklift', 'steelBeams'],
    targets: ['crew', 'crew', 'foreman', 'breakCrew'],
    targetGap: 42, hazardGap: 28, bpm: 108, root: 3,
  }),
  L(4, 'THE WET POUR', {
    blurb: 'RAIN CAME IN. THE SURFACE NEVER SET.',
    theme: 'wet', length: 1200, quota: 10, speedCap: 17,
    hazards: ['cone', 'puddle', 'puddle', 'concretePour', 'gravel', 'pothole', 'plankBundle'],
    targets: ['crew', 'crew', 'crew', 'foreman'],
    targetGap: 42, hazardGap: 26, bpm: 96, scale: 'night', root: -2,
    chaos: { rain: true },
  }),
  L(5, 'FORKLIFT CROSSING', {
    blurb: 'THEY REVERSE WITHOUT LOOKING. ALL OF THEM.',
    theme: 'dust', length: 1300, quota: 11, speedCap: 18,
    hazards: ['cone', 'barrel', 'forklift', 'forklift', 'companyTruck', 'phoneZombie', 'pothole'],
    targets: ['crew', 'crew', 'scaffoldCrew', 'foreman'],
    targetGap: 40, hazardGap: 26, bpm: 112, scale: 'tense', root: 1,
  }),
  L(6, 'SCAFFOLD ROW', {
    blurb: 'THE BEST EARS ON SITE ARE THREE METRES UP.',
    theme: 'dusk', length: 1400, quota: 12, speedCap: 19,
    hazards: ['cone', 'frameStack', 'pipeCarriers', 'measuring', 'craneSwing', 'sandpile', 'toolDrop'],
    targets: ['scaffoldCrew', 'scaffoldCrew', 'crew', 'foreman'],
    targetGap: 40, hazardGap: 24, bpm: 116, scale: 'bright', root: 3,
    chaos: { wind: true },
  }),
  L(7, 'NIGHT POUR', {
    blurb: 'FLOODLIGHTS ON. NOBODY WENT HOME.',
    theme: 'night', length: 1500, quota: 13, speedCap: 20,
    hazards: ['cone', 'barrel', 'puddle', 'craneSwing', 'forklift', 'radioTalker', 'flatbed', 'concretePour'],
    targets: ['crew', 'scaffoldCrew', 'foreman', 'breakCrew'],
    targetGap: 38, hazardGap: 24, bpm: 120, scale: 'tense', root: -1,
    chaos: { night: true, superintendent: true },
  }),
  L(8, 'THE LONG GATE', {
    blurb: 'LAST RUN. BOMBA IS AT THE TRAILER OFFICE.',
    theme: 'storm', length: 1700, quota: 14, speedCap: 21,
    hazards: ['cone', 'barrel', 'puddle', 'craneSwing', 'forklift', 'companyTruck', 'flatbed',
      'breakBlockade', 'pipeCarriers', 'dumpster', 'sandpile', 'concretePour'],
    targets: ['crew', 'scaffoldCrew', 'scaffoldCrew', 'foreman', 'breakCrew'],
    targetGap: 36, hazardGap: 22, bpm: 126, scale: 'bright', root: 5,
    chaos: { rain: true, wind: true, collapse: true, superintendent: true },
  }),
];

// --- upgrades ---------------------------------------------------------------

export const UPGRADES = [
  { id: 'arm',   name: 'BETTER ARM',   desc: '+2M THROW RANGE',        apply: (s) => { s.throwRange += 2; } },
  { id: 'grip',  name: 'SITE TYRES',   desc: 'SHARPER STEERING',       apply: (s) => { s.grip += 0.22; } },
  { id: 'rack',  name: 'PAPER RACK',   desc: '+5 SHEETS CARRIED',      apply: (s) => { s.sheetMax += 5; } },
  { id: 'guard', name: 'BUMP GUARD',   desc: 'CRASHES COST LESS',      apply: (s) => { s.guard += 0.3; } },
  { id: 'turbo', name: 'TUNED ENGINE', desc: '+2 M/S TOP SPEED',       apply: (s) => { s.speedBonus += 2; } },
  { id: 'eye',   name: 'SPOTTER',      desc: 'HAZARDS FLAG EARLIER',   apply: (s) => { s.spotter += 12; } },
  { id: 'loop',  name: 'LOUD MOUTH',   desc: 'COMBO HOLDS LONGER',     apply: (s) => { s.comboHold += 1.1; } },
  { id: 'luck',  name: 'SUPPLY LINE',  desc: 'MORE RUMOR FUEL',        apply: (s) => { s.crateBonus += 0.5; } },
  // Capped at one: the arc is already at the ceiling of what a crew on the
  // ground can catch, and a second helping would throw clean over everyone.
  { id: 'loft',  name: 'HIGH LOB',     desc: 'SHEETS FLY HIGHER',      max: 1, apply: (s) => { s.loft += 0.45; } },
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

/** Three upgrades the player has not already maxed out. */
export function offerUpgrades(rng, stats, count = 3) {
  const pool = UPGRADES.filter((u) => stats.owned.filter((o) => o === u.id).length < (u.max ?? 3));
  return rng.shuffled(pool).slice(0, count);
}

// --- route generation -------------------------------------------------------

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
      variant: rng.int(0, 2),
    });
  }

  for (let s = startS - 30; s < endS + 20; s += level.hazardGap * rng.range(0.7, 1.35)) {
    const kind = rng.pick(level.hazards);
    const def = HAZARDS[kind];
    const count = def.w > 1 ? rng.int(1, Math.round(def.w)) : 1;
    for (let i = 0; i < count; i++) {
      const spread = i === 0 ? 0 : rng.range(-1, 1) * 2.6;
      const t = clamp(rng.range(-ROAD.halfW + 0.8, ROAD.halfW - 0.8) + spread,
        -ROAD.halfW - 0.4, ROAD.halfW + 0.4);
      hazards.push(makeHazard(kind, def, s + i * rng.range(2, 5), t, rng));
    }
  }

  // Weather debris: pipes that got away, and whatever the scaffold shed.
  if (level.chaos.wind) {
    for (let s = startS; s < endS; s += rng.range(90, 160)) {
      hazards.push(makeHazard('rollingPipe', HAZARDS.rollingPipe, s,
        (rng.chance(0.5) ? 1 : -1) * rng.range(1.4, 3.4), rng));
    }
  }
  if (level.chaos.collapse) {
    for (let s = startS + 120; s < endS; s += rng.range(170, 280)) {
      for (let i = 0; i < 3; i++) {
        hazards.push(makeHazard('debris', HAZARDS.debris, s + i * rng.range(1.5, 3.5),
          rng.range(-4, 4), rng));
      }
    }
  }

  // Rumor fuel along the route.
  const kinds = Object.keys(POWERUPS);
  for (let s = 120; s < endS; s += level.crateGap * rng.range(0.8, 1.2)) {
    const kind = rng.chance(0.42) ? 'papers' : rng.pick(kinds);
    pickups.push({
      kind,
      def: POWERUPS[kind],
      s: Math.round(s * 10) / 10,
      t: rng.range(-ROAD.halfW + 1.2, ROAD.halfW - 1.2),
      taken: false,
    });
  }

  // Set dressing well off the route.
  for (let s = 0; s < level.length + 40; s += rng.range(16, 40)) {
    const sd = rng.chance(0.5) ? 1 : -1;
    scenery.push({
      kind: rng.pick(level.chaos.night ? ['floodlight', 'floodlight', ...SCENERY] : SCENERY),
      s,
      t: sd * rng.range(ROAD.edge + 5, ROAD.edge + 22),
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
    chaos: level.chaos,
  };
}

function makeHazard(kind, def, s, t, rng) {
  const h = {
    kind,
    def,
    s: Math.round(s * 10) / 10,
    t,
    t0: t,
    state: 'idle',
    timer: 0,
    dir: rng.chance(0.5) ? 1 : -1,
    speed: rng.range(2.4, 4.2),
    phase: rng.range(0, Math.PI * 2),
    hitBy: false,
    nearCounted: false,
    said: false,
  };
  if (def.mobile === 'cross' || def.mobile === 'walk') {
    h.t = -h.dir * (ROAD.halfW + 3.5);
    h.t0 = h.t;
  }
  if (def.mobile === 'swing') {
    h.z = 0.4;
  }
  if (def.mobile === 'roll') {
    h.speed = rng.range(1.6, 3.0);
  }
  return h;
}

const BUGGY_W = FOOTPRINTS.cart.lt;
const MIN_GAP = 2.8;        // metres of clean road a cart needs to thread
const APPROACH = 13;        // metres of run-up a delivery needs
const CLUSTER = 4.5;        // hazards this close read as one wall

/** Widest run of clean paved road left by a set of hazards, in metres. */
export function widestGap(hazards) {
  const spans = hazards
    .map((h) => {
      const half = (FOOTPRINTS[h.kind].lt + BUGGY_W) / 2;
      return [h.t - half, h.t + half];
    })
    .sort((a, b) => a[0] - b[0]);

  let widest = 0;
  let cursor = -ROAD.halfW;
  for (const [a, b] of spans) {
    if (a > cursor) widest = Math.max(widest, a - cursor);
    cursor = Math.max(cursor, b);
  }
  return Math.max(widest, ROAD.halfW - cursor);
}

/**
 * A random route is not automatically a fair one. Two passes fix that:
 *
 *  1. Never let solid hazards close the road. A hazard within CLUSTER metres of
 *     others forms one wall, and every wall must leave MIN_GAP of clean surface
 *     somewhere across the paved width. Note this looks *both ways* along the
 *     route: checking only backwards misses the case where a hazard is fine
 *     against its predecessors and fine against its successors, but lethal with
 *     both at once.
 *  2. Keep the delivery line open. The outer half of a crew's own side is
 *     cleared for the length of the run-up, so a throw is always *possible* —
 *     taking it is still the player's problem.
 */
function makeFair(hazards, targets) {
  let kept = hazards.slice();

  for (let guard = 0; guard < 400; guard++) {
    const solid = kept.filter((h) => !h.def.decal);
    let tightest = null;
    for (const h of solid) {
      const wall = solid.filter((k) => Math.abs(k.s - h.s) < CLUSTER);
      const gap = widestGap(wall);
      if (gap < MIN_GAP && (!tightest || gap < tightest.gap)) tightest = { wall, gap };
    }
    if (!tightest) break;

    let best = null;
    for (const candidate of tightest.wall) {
      const opened = widestGap(tightest.wall.filter((k) => k !== candidate));
      if (!best || opened > best.opened) best = { candidate, opened };
    }
    kept = kept.filter((h) => h !== best.candidate);
  }

  const blocked = new Set();
  for (const tg of targets) {
    const side = Math.sign(tg.t) || 1;
    for (const h of kept) {
      if (h.s < tg.s - APPROACH || h.s > tg.s + 2) continue;
      if (Math.sign(h.t) === side && Math.abs(h.t) > 1.6) blocked.add(h);
    }
  }
  return kept.filter((h) => !blocked.has(h));
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
