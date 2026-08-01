// Fast checks, no browser required. Run before the playtest — this catches the
// whole class of "it renders nothing and nobody notices" bugs in a second.
//
//   node tools/verify.mjs
//
// Everything here asserts a *property* of the shipped data, not a restatement
// of how the data is built.

import { GLYPHS, GLYPH_H, GLYPH_W, glyphFor } from '../src/art/glyphs.js';
import { ART, PAL } from '../src/art/sprites.js';
import { SPRITES, FOOTPRINTS } from '../src/art/names.js';
import { LEVELS, HAZARDS, TARGETS, SCENERY, buildRoute, baseStats, UPGRADES } from '../src/game/levels.js';
import { ROAD } from '../src/game/road.js';
import { RUMOR_STAGES, RUMOR_SEED, BARKS, fidelityTier, rumorAt } from '../src/game/rumor.js';

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

const MIN_GAP = 2.8;
const APPROACH = 13;
const SEEDS = ['harness', 'a', 'b', 'c', 'd', 'e', 'f', 'g'];

// --- font ------------------------------------------------------------------

for (const [ch, rows] of Object.entries(GLYPHS)) {
  check(rows.length === GLYPH_H, `glyph "${ch}" has ${rows.length} rows, expected ${GLYPH_H}`);
  for (const row of rows) {
    check(row.length === GLYPH_W, `glyph "${ch}" has a row of ${row.length}, expected ${GLYPH_W}`);
    check(/^[.#]+$/.test(row), `glyph "${ch}" row "${row}" uses something other than . and #`);
  }
}

// --- sprites ---------------------------------------------------------------

for (const [name, rows] of Object.entries(ART)) {
  check(rows.length > 0, `sprite "${name}" is empty`);
  const w = rows[0].length;
  for (const row of rows) {
    check(row.length === w, `sprite "${name}" is ragged: expected ${w} columns, got ${row.length}`);
    for (const ch of row) {
      check(ch === '.' || !!PAL[ch], `sprite "${name}" uses undeclared palette key "${ch}"`);
    }
  }
}

for (const name of SPRITES) {
  check(!!ART[name], `names.js pins sprite "${name}" but src/art/sprites.js has no such art`);
}

// Everything gameplay can draw must be pinned and must exist.
for (const [kind, def] of Object.entries(HAZARDS)) {
  check(!!ART[def.sprite], `hazard "${kind}" draws missing sprite "${def.sprite}"`);
  check(!!FOOTPRINTS[kind], `hazard "${kind}" has no footprint pinned in names.js`);
}
for (const [kind, def] of Object.entries(TARGETS)) {
  check(!!ART[def.sprite], `target "${kind}" draws missing sprite "${def.sprite}"`);
  check(!!FOOTPRINTS[def.foot], `target "${kind}" points at missing footprint "${def.foot}"`);
  if (def.rig) check(!!ART[def.rig], `target "${kind}" needs rig sprite "${def.rig}"`);
}
for (const kind of SCENERY) {
  check(!!ART[kind], `scenery "${kind}" has no sprite`);
}
check(!!FOOTPRINTS.buggy, 'the buggy has no footprint');

// --- text fits on screen ---------------------------------------------------

// A bark is drawn in a bubble that must not run off a 288px screen.
const MAX_BARK = 44;
for (const [key, lines] of Object.entries(BARKS)) {
  check(lines.length > 0, `bark category "${key}" is empty`);
  for (const line of lines) {
    check(line.length <= MAX_BARK, `bark too long for the bubble (${line.length} > ${MAX_BARK}): "${line}"`);
  }
}

// Every character the game can print needs a glyph, or it renders as "?".
const printed = [
  RUMOR_SEED,
  ...RUMOR_STAGES.flatMap((s) => Object.values(s)),
  ...Object.values(BARKS).flat(),
  ...LEVELS.flatMap((l) => [l.name, l.blurb]),
  ...UPGRADES.flatMap((u) => [u.name, u.desc]),
];
const missing = new Set();
for (const line of printed) {
  for (const ch of line.toUpperCase()) {
    if (glyphFor(ch) === GLYPHS['?'] && ch !== '?') missing.add(ch);
  }
}
check(missing.size === 0, `no glyph for: ${[...missing].map((c) => JSON.stringify(c)).join(' ')}`);

// The longest word has to fit the narrowest place text is wrapped (248px).
for (const line of printed) {
  const longest = line.split(/\s+/).reduce((a, b) => (a.length > b.length ? a : b), '');
  check(longest.length * 6 - 1 <= 248, `word does not fit any panel: "${longest}"`);
}

// --- the rumour ------------------------------------------------------------

check(RUMOR_STAGES.length === LEVELS.length,
  `${RUMOR_STAGES.length} rumour stages for ${LEVELS.length} shifts — the chain must cover every shift`);
RUMOR_STAGES.forEach((stage, i) => {
  for (const tier of ['clear', 'muddled', 'garbled']) {
    check(typeof stage[tier] === 'string' && stage[tier].length > 0,
      `rumour stage ${i + 1} has no "${tier}" version`);
  }
});
check(fidelityTier({ bullseye: 10 }) === 'clear', 'all bullseyes should read as clear');
check(fidelityTier({ whisper: 10 }) === 'garbled', 'all whispers should read as garbled');
check(fidelityTier({}) === 'garbled', 'delivering nothing should read as garbled');
for (let i = 0; i < LEVELS.length; i++) {
  check(!!rumorAt(i, 'clear'), `no clear rumour for shift ${i + 1}`);
}

// --- levels ----------------------------------------------------------------

const ids = new Set();
for (const level of LEVELS) {
  check(!ids.has(level.id), `duplicate level id ${level.id}`);
  ids.add(level.id);
  check(level.blurb && level.name, `level ${level.id} is missing its name or blurb`);
  for (const kind of level.hazards) check(!!HAZARDS[kind], `level ${level.id} lists unknown hazard "${kind}"`);
  for (const kind of level.targets) check(!!TARGETS[kind], `level ${level.id} lists unknown target "${kind}"`);
}

// --- generated routes ------------------------------------------------------

const stats = baseStats();
const BUGGY_W = FOOTPRINTS.buggy.lt;

for (const level of LEVELS) {
  for (const seed of SEEDS) {
    const route = buildRoute(level, seed);
    const where = `L${level.id} seed "${seed}"`;

    // Enough crews on the route that the quota is not a coin toss.
    check(route.targets.length >= level.quota * 1.5,
      `${where}: ${route.targets.length} crews for a quota of ${level.quota}`);

    // Enough paper to make the quota, counting refills.
    const crates = route.pickups.filter((p) => p.kind === 'crate').length;
    check(stats.sheetMax + crates * 6 >= level.quota,
      `${where}: ${stats.sheetMax} sheets + ${crates} crates cannot cover a quota of ${level.quota}`);

    // Crews must be inside throwing range of somewhere on the road.
    for (const tg of route.targets) {
      const reach = Math.abs(tg.t) - (ROAD.halfW + 2.4);
      check(reach <= stats.throwRange,
        `${where}: a ${tg.kind} sits ${reach.toFixed(1)}m beyond the widest possible throw`);
    }

    // The road is never walled off: somewhere across the paved width there is
    // always a gap a buggy can thread.
    const solid = route.hazards.filter((h) => !h.def.decal);
    for (const h of solid) {
      const near = solid.filter((k) => Math.abs(k.s - h.s) < 4.5);
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
      check(widest >= MIN_GAP - 1e-6,
        `${where}: hazards at s=${h.s.toFixed(1)} leave only ${widest.toFixed(2)}m of road`);
    }

    // Every crew has an open run-up on their own side.
    for (const tg of route.targets) {
      const side = Math.sign(tg.t) || 1;
      const blocking = route.hazards.filter((h) =>
        h.s >= tg.s - APPROACH && h.s <= tg.s + 2 && Math.sign(h.t) === side && Math.abs(h.t) > 1.6);
      check(blocking.length === 0,
        `${where}: a ${tg.kind} at s=${tg.s.toFixed(1)} has ${blocking.length} hazard(s) in its delivery lane`);
    }

    // Nothing should be generated off the end of the route.
    for (const h of route.hazards) {
      check(h.s > -40 && h.s < level.length + 40, `${where}: hazard at s=${h.s.toFixed(1)} is off the route`);
    }
  }
}

// --- upgrades --------------------------------------------------------------

for (const up of UPGRADES) {
  const before = baseStats();
  const after = baseStats();
  up.apply(after);
  const changed = Object.keys(before).some((k) => before[k] !== after[k]);
  check(changed, `upgrade "${up.id}" does not change any stat`);
}

// No combination of upgrades may make a target impossible to hit.
//
// This is the check that would have caught HIGH LOB: it raises the arc, and a
// raised arc sails clean over anyone whose catch window has a low ceiling. A
// throw is only a delivery if the sheet is inside the target's vertical window
// at the moment it crosses their line, so walk every reachable loft/range pair
// and confirm each target kind keeps a usable stretch of lateral distance.
const GRAVITY = 9.8;
const THROW_Z = 1.1;   // height the sheet leaves the buggy at
const ARC = 4.4;       // vertical speed per unit of loft
// The window has to cover the distance people actually throw from — half the
// throw's range, give or take. A configuration whose only usable band sits at
// the very start or very end of the arc reads as "works" by contiguous length
// alone, and that is exactly the broken case: with the original ceiling a
// lofted sheet connected below 1.5m or beyond 8.5m and sailed over every crew
// in between.
const MIN_WINDOW = 2.5;

const maxOf = (id) => {
  const up = UPGRADES.find((u) => u.id === id);
  return up ? (up.max ?? 3) : 0;
};
const lofts = [];
for (let n = 0; n <= maxOf('loft'); n++) lofts.push(1 + 0.45 * n);
const ranges = [];
for (let n = 0; n <= maxOf('arm'); n++) ranges.push(baseStats().throwRange + 2 * n);

for (const [kind, def] of Object.entries(TARGETS)) {
  const foot = FOOTPRINTS[def.foot];
  for (const loft of lofts) {
    for (const range of ranges) {
      const vz = ARC * loft;
      const flight = (2 * vz) / GRAVITY;
      const vt = range / flight;

      const connects = (lat) => {
        const t = lat / vt;
        const z = THROW_Z + vz * t - 0.5 * GRAVITY * t * t;
        return z >= foot.z0 - 0.3 && z <= foot.z0 + foot.zh;
      };

      // Measure the usable band straddling half the range.
      const mid = range * 0.5;
      let span = 0;
      if (connects(mid)) {
        span = 0.1;
        for (let lat = mid; lat > 0.4 && connects(lat); lat -= 0.1) span += 0.1;
        for (let lat = mid; lat <= range && connects(lat); lat += 0.1) span += 0.1;
      }
      check(span >= MIN_WINDOW,
        `${kind} is unhittable from a normal throwing position with loft ` +
        `${loft.toFixed(2)} and range ${range}m: only ${span.toFixed(1)}m of ` +
        `lateral distance around ${mid.toFixed(1)}m connects`);
    }
  }
}

// --- report ----------------------------------------------------------------

if (failures.length) {
  console.error(`verify: ${failures.length} problem(s)\n`);
  for (const f of failures.slice(0, 40)) console.error(`  ! ${f}`);
  if (failures.length > 40) console.error(`  ... and ${failures.length - 40} more`);
  process.exit(1);
}

const routes = LEVELS.length * SEEDS.length;
console.log(`verify: ok — ${Object.keys(ART).length} sprites, ${Object.keys(GLYPHS).length} glyphs, ` +
  `${Object.values(BARKS).flat().length} barks, ${routes} generated routes`);
