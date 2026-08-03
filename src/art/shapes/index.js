// All vector sprite sources, merged.
//
// Each module owns a disjoint set of sprites so several people (or agents) can
// draw at once without touching the same file.

import { HERO } from './hero.js';
import { CREW } from './crew.js';
import { VEHICLES } from './vehicles.js';
import { MATERIAL } from './material.js';
import { PROPS } from './props.js';
import { PICKUPS } from './pickups.js';
import { STRUCTURES } from './structures.js';
import { DECALS } from './decals.js';

export const SHAPES = {
  ...HERO,
  ...CREW,
  ...VEHICLES,
  ...MATERIAL,
  ...PROPS,
  ...PICKUPS,
  ...STRUCTURES,
  ...DECALS,
};
