// The contract between art and gameplay.
//
// Every drawable thing in the game is named here exactly once, together with
// its road-space footprint. Gameplay code reads the footprint, art code reads
// the sprite name, and neither is allowed to invent one — which is what stops
// a barrel from *looking* twice the size it *hits* at.
//
//   ls  length along the road, in metres
//   lt  width across the road, in metres
//   z0  height of the bottom of the hitbox above the ground, in metres
//   zh  height of the hitbox itself, in metres
//   ax  horizontal anchor within the sprite, 0..1 (0.5 = centred)
//   ay  vertical anchor, 1 = the sprite's feet sit on the ground point

const foot = (ls, lt, extra = {}) => ({ ls, lt, z0: 0, zh: 2, ax: 0.5, ay: 1, ...extra });

export const FOOTPRINTS = {
  // --- the player ------------------------------------------------------
  buggy: foot(2.6, 1.9, { zh: 1.6 }),

  // --- hazards ---------------------------------------------------------
  cone: foot(0.7, 0.7, { zh: 0.7 }),
  barrel: foot(1.0, 1.0, { zh: 1.1 }),
  pothole: foot(1.8, 1.5, { zh: 0.2, ay: 0.5 }),
  puddle: foot(2.2, 2.0, { zh: 0.1, ay: 0.5 }),
  gravel: foot(3.0, 2.6, { zh: 0.1, ay: 0.5 }),
  planks: foot(1.6, 2.6, { zh: 0.6 }),
  mixer: foot(2.2, 2.2, { zh: 2.2 }),
  forklift: foot(3.0, 2.2, { zh: 2.4 }),
  barrow: foot(1.6, 1.2, { zh: 1.0 }),
  coffeeWorker: foot(0.9, 0.9, { zh: 1.8 }),
  pole: foot(0.8, 3.4, { zh: 0.8 }),
  sandpile: foot(2.4, 2.4, { zh: 1.2 }),

  // --- targets ---------------------------------------------------------
  // Catch windows are deliberately tall for anyone standing on the ground: they
  // can reach up. A short ceiling here means a lobbed sheet sails over their
  // heads and the HIGH LOB upgrade silently breaks every ground delivery.
  crew: foot(1.6, 1.6, { z0: 0.2, zh: 3.4 }),
  // Starts above the ground, so reaching a scaffold means getting closer than
  // you would for a crew standing in the mud.
  scaffoldCrew: foot(1.8, 1.8, { z0: 1.6, zh: 2.4 }),
  foreman: foot(1.4, 1.4, { z0: 0.2, zh: 3.4 }),
  teaHut: foot(3.0, 2.6, { z0: 0.6, zh: 3.4 }),

  // --- pickups ---------------------------------------------------------
  crate: foot(1.4, 1.4, { zh: 1.0 }),
  tea: foot(1.0, 1.0, { zh: 0.8 }),

  // --- inert scenery (never collides) ----------------------------------
  sign: foot(0.6, 1.2, { zh: 2.2 }),
  floodlight: foot(0.8, 0.8, { zh: 4.0 }),
  portaloo: foot(1.4, 1.4, { zh: 2.4 }),
  fence: foot(0.4, 2.4, { zh: 1.4 }),
  bomba: foot(1.6, 1.2, { zh: 1.2 }),
};

// Sprite names, pinned so a typo fails loudly at boot instead of drawing
// nothing three levels in.
export const SPRITES = [
  'buggy', 'buggyLeft', 'buggyRight', 'buggyWreck',
  'cone', 'barrel', 'pothole', 'puddle', 'gravel', 'planks', 'mixer',
  'forklift', 'barrow', 'pole', 'sandpile',
  'worker', 'workerCheer', 'workerDuck', 'foreman', 'scaffold', 'teaHut',
  'crate', 'tea', 'sheet', 'sign', 'floodlight', 'portaloo', 'fence',
  'bomba', 'puff', 'spark', 'arrow', 'star',
];

export function footprintOf(name) {
  const f = FOOTPRINTS[name];
  if (!f) throw new Error(`no footprint pinned for "${name}" (see src/art/names.js)`);
  return f;
}
