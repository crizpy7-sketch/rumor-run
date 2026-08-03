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
  cart: foot(2.8, 2.0, { zh: 1.8 }),

  // --- scaffold material ------------------------------------------------
  pipePile: foot(2.2, 3.4, { zh: 1.2 }),
  frameStack: foot(2.0, 3.0, { zh: 2.2 }),
  plankBundle: foot(1.8, 3.8, { zh: 0.9 }),
  jacks: foot(1.8, 3.0, { zh: 1.4 }),
  couplers: foot(1.8, 3.2, { zh: 1.0 }),
  steelBeams: foot(1.6, 3.8, { zh: 0.8 }),

  // --- crew in the way --------------------------------------------------
  pipeCarriers: foot(1.4, 4.2, { zh: 1.8 }),
  radioTalker: foot(1.2, 1.4, { zh: 1.9 }),
  breakBlockade: foot(2.0, 3.2, { zh: 1.8 }),
  phoneZombie: foot(1.1, 1.3, { zh: 1.9 }),
  toolDrop: foot(1.6, 2.2, { zh: 1.2 }),
  measuring: foot(1.3, 3.4, { zh: 1.9 }),

  // --- heavy equipment --------------------------------------------------
  forklift: foot(3.2, 2.6, { zh: 2.6 }),
  companyTruck: foot(4.2, 2.4, { zh: 2.2 }),
  flatbed: foot(5.0, 2.6, { zh: 2.4 }),
  craneSwing: foot(2.4, 2.6, { z0: 0.4, zh: 3.0 }),
  dumpster: foot(3.4, 2.6, { zh: 1.8 }),
  concretePour: foot(3.0, 3.2, { zh: 0.1, ay: 0.5 }),

  // --- small stuff ------------------------------------------------------
  cone: foot(0.8, 0.8, { zh: 0.8 }),
  barrel: foot(1.1, 1.1, { zh: 1.2 }),
  pothole: foot(2.0, 1.8, { zh: 0.2, ay: 0.5 }),
  puddle: foot(2.4, 2.2, { zh: 0.1, ay: 0.5 }),
  gravel: foot(3.2, 2.8, { zh: 0.1, ay: 0.5 }),
  sandpile: foot(2.4, 2.6, { zh: 1.3 }),
  // Narrow enough that one alone still leaves a threadable gap: a pipe that
  // spans the road is not a hazard, it is a wall.
  rollingPipe: foot(1.0, 3.0, { zh: 0.5 }),
  debris: foot(1.6, 1.8, { zh: 0.7 }),

  // --- targets ----------------------------------------------------------
  // Catch windows are deliberately tall for anyone standing on the ground:
  // they can reach up. A short ceiling means a lobbed sheet sails over their
  // heads and the HIGH LOB upgrade silently breaks every ground delivery.
  crew: foot(1.8, 1.8, { z0: 0.2, zh: 3.4 }),
  // Starts above the ground, so reaching a scaffold means getting closer than
  // you would for a crew standing in the mud.
  scaffoldCrew: foot(2.0, 2.0, { z0: 1.6, zh: 2.4 }),
  foreman: foot(1.6, 1.6, { z0: 0.2, zh: 3.4 }),
  breakCrew: foot(3.0, 2.8, { z0: 0.2, zh: 3.2 }),

  // --- power ups --------------------------------------------------------
  puSpeed: foot(1.4, 1.4, { zh: 1.2 }),
  puPapers: foot(1.4, 1.4, { zh: 1.2 }),
  puVest: foot(1.4, 1.4, { zh: 1.2 }),
  puConfusion: foot(1.4, 1.4, { zh: 1.2 }),
  puBomba: foot(1.4, 1.4, { zh: 1.2 }),

  // --- inert scenery (never collides) -----------------------------------
  signStay: foot(0.6, 1.4, { zh: 2.4 }),
  signCaution: foot(0.6, 1.4, { zh: 2.4 }),
  floodlight: foot(0.9, 0.9, { zh: 4.5 }),
  portaloo: foot(1.6, 1.6, { zh: 2.6 }),
  fence: foot(0.4, 3.0, { zh: 1.6 }),
  cooler: foot(0.9, 1.2, { zh: 0.6 }),
  toolbox: foot(0.9, 1.2, { zh: 0.6 }),
  bomba: foot(1.2, 1.2, { zh: 2.0 }),
  // Landmarks. They sit far off the shoulder, so nothing ever tests these
  // against the cart — the footprint exists so the registry stays complete.
  gcsBuilding: foot(16.0, 18.0, { zh: 24.0 }),
  scaffoldTower: foot(5.0, 5.0, { zh: 16.0 }),
  super: foot(1.2, 1.2, { zh: 2.0 }),
};

// Sprite names, pinned so a typo fails loudly at boot instead of drawing
// nothing three levels in.
export const SPRITES = [
  'cart', 'cartLeft', 'cartRight', 'cartWreck',
  'worker', 'workerY', 'workerO', 'workerDark', 'workerOrangeVest',
  'workerCheer', 'workerCheerY', 'workerCheerO',
  'workerPhone', 'workerPhoneY', 'workerRadio', 'workerRadioO', 'workerMeasure',
  'workerKneel', 'workerSit', 'workerDuck', 'super',
  'bomba', 'bombaThumb',
  'pipePile', 'frameStack', 'plankBundle', 'jacks', 'couplers', 'steelBeams',
  'forklift', 'truck', 'flatbed', 'mixer', 'dumpster', 'craneHook', 'pipeLong',
  'cone', 'barrel', 'pothole', 'puddle', 'gravel', 'wetPatch', 'sandpile',
  'signStay', 'signCaution', 'fence', 'floodlight', 'portaloo', 'cooler', 'toolbox',
  'puSpeed', 'puPapers', 'puVest', 'puConfusion', 'puBomba',
  'sheet', 'puff', 'spark', 'star', 'arrow', 'splash',
  'gcsBuilding', 'scaffoldTower',
];

export function footprintOf(name) {
  const f = FOOTPRINTS[name];
  if (!f) throw new Error(`no footprint pinned for "${name}" (see src/art/names.js)`);
  return f;
}
