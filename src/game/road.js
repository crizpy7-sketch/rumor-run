// Road space and its projection.
//
// The world is two numbers: `s`, metres along the route, and `t`, metres across
// it (0 is the centre line, positive is the driver's right). The camera slides
// along `s`; everything else is a billboard standing on that plane.
//
// The projection is a fixed oblique: the route runs up and to the right at a
// constant angle, with no perspective scaling — Paperboy's trick, and the
// reason the whole game can be drawn with integer blits.
//
// Drawing the surface as one rectangle per metre made the diagonal edges
// staircase. Instead the projection is inverted per screen row: for a row `y`
// the road's centre is at
//
//     xc(y) = ox - tan(angle) * (y - oy)
//
// and one metre of `t` is `ppm / cos(angle)` pixels along that row, so the left
// and right edges land on exact sub-pixel positions and the edge comes out as a
// clean diagonal.

// 4:3, and large enough that a worker is 18px tall rather than 8 — detail has
// to have somewhere to live.
export const VIEW_W = 384;
export const VIEW_H = 288;

const ANGLE = 0.36;            // radians the route leans off vertical
const PPM = 5.6;               // pixels per metre along the route
const HALF_W = 5.5;            // half the paved width, metres
const SHOULDER = 3.0;          // gravel each side, metres

export const ROAD = {
  angle: ANGLE,
  ppm: PPM,
  halfW: HALF_W,
  shoulder: SHOULDER,
  edge: HALF_W + SHOULDER,
  sin: Math.sin(ANGLE),
  cos: Math.cos(ANGLE),
  tan: Math.tan(ANGLE),
  // Screen point the camera's own position projects to.
  ox: 122,
  oy: 236,
};

// Pixels along a screen row per metre of lateral offset.
export const LATERAL_PX = PPM / ROAD.cos;

// Each theme is a full grade, not just a tint: the dirt, the tarmac, the paint
// and the light all move together, so a night shift reads as a different place
// rather than the same place with a filter over it.
export const THEMES = {
  day: {
    ground: '#6b5a3e', groundAlt: '#5e4e34', groundLo: '#514229', tuft: '#8a9c3a',
    asphalt: '#3f3c47', asphaltAlt: '#484552', patch: '#35323c', crack: '#2a2830',
    shoulder: '#7a6647', shoulderAlt: '#6a5839', rut: '#5a4a30',
    kerbA: '#ffd24a', kerbB: '#2a2630', line: '#efe4c4', oil: '#332f38',
    haze: null, vignette: 0.22, rain: 0, lightPool: 0,
  },
  dust: {
    ground: '#7f6a44', groundAlt: '#705d38', groundLo: '#63512f', tuft: '#96a03c',
    asphalt: '#474049', asphaltAlt: '#514a55', patch: '#3d3740', crack: '#312c33',
    shoulder: '#8d7551', shoulderAlt: '#7c6543', rut: '#6b5636',
    kerbA: '#ffd24a', kerbB: '#3a3028', line: '#efe4c4', oil: '#3a343c',
    haze: 'rgba(206,166,96,0.15)', vignette: 0.24, rain: 0, lightPool: 0,
  },
  wet: {
    ground: '#4c4a3c', groundAlt: '#413f33', groundLo: '#37352b', tuft: '#6d7f33',
    asphalt: '#33323d', asphaltAlt: '#3b3a47', patch: '#2b2a34', crack: '#232229',
    shoulder: '#585240', shoulderAlt: '#4b4636', rut: '#3f3a2c',
    kerbA: '#e7c04a', kerbB: '#26242c', line: '#d7cfb4', oil: '#26252e',
    haze: 'rgba(78,102,132,0.18)', vignette: 0.3, rain: 1, lightPool: 0,
  },
  dusk: {
    ground: '#4f4034', groundAlt: '#453629', groundLo: '#392d22', tuft: '#7a7c34',
    asphalt: '#363039', asphaltAlt: '#3d3743', patch: '#2e2932', crack: '#262129',
    shoulder: '#604c38', shoulderAlt: '#52402d', rut: '#463525',
    kerbA: '#ffb84a', kerbB: '#221f28', line: '#e8d8b0', oil: '#2a252d',
    haze: 'rgba(168,84,44,0.18)', vignette: 0.34, rain: 0, lightPool: 0.2,
  },
  night: {
    ground: '#2c2a30', groundAlt: '#252329', groundLo: '#1e1c22', tuft: '#4c5a26',
    asphalt: '#26242c', asphaltAlt: '#2c2a34', patch: '#201f26', crack: '#1a191f',
    shoulder: '#3a3440', shoulderAlt: '#312c36', rut: '#282430',
    kerbA: '#ffd24a', kerbB: '#1b1a1f', line: '#b9b19a', oil: '#1d1c22',
    haze: 'rgba(22,28,54,0.32)', vignette: 0.46, rain: 0, lightPool: 0.75,
  },
  storm: {
    ground: '#3c3a33', groundAlt: '#33322b', groundLo: '#2b2a24', tuft: '#5d6b2c',
    asphalt: '#2c2b34', asphaltAlt: '#33323d', patch: '#25242c', crack: '#1e1d24',
    shoulder: '#4a4437', shoulderAlt: '#3e392e', rut: '#342f26',
    kerbA: '#e7c04a', kerbB: '#201f26', line: '#cfc7ad', oil: '#212028',
    haze: 'rgba(52,72,104,0.26)', vignette: 0.42, rain: 1.6, lightPool: 0.45,
  },
};

export class Road {
  constructor(theme = 'day') {
    this.camS = 0;
    this.theme = THEMES[theme] ? theme : 'day';
    this.time = 0;
    // Reused scratch object so projecting thousands of points per frame does
    // not churn the allocator.
    this._p = { x: 0, y: 0 };
  }

  get palette() { return THEMES[this.theme]; }

  /** Screen x of the centre line on screen row y. */
  centreX(y) {
    return ROAD.ox - ROAD.tan * (y - ROAD.oy);
  }

  /** Road-space -> screen. Returns a shared object; copy it if you keep it. */
  project(s, t, out = this._p) {
    const ds = (s - this.camS) * PPM;
    const dt = t * PPM;
    out.x = ROAD.ox + ds * ROAD.sin + dt * ROAD.cos;
    out.y = ROAD.oy - ds * ROAD.cos + dt * ROAD.sin;
    return out;
  }

  projectX(s, t) { return ROAD.ox + (s - this.camS) * PPM * ROAD.sin + t * PPM * ROAD.cos; }
  projectY(s, t) { return ROAD.oy - (s - this.camS) * PPM * ROAD.cos + t * PPM * ROAD.sin; }

  /** Screen -> road space. */
  unproject(x, y, out = { s: 0, t: 0 }) {
    const dx = x - ROAD.ox;
    const dy = y - ROAD.oy;
    out.s = this.camS + (dx * ROAD.sin - dy * ROAD.cos) / PPM;
    out.t = (dx * ROAD.cos + dy * ROAD.sin) / PPM;
    return out;
  }

  /** Distance along the route at the centre line of screen row y. */
  sAtRow(y) {
    return this.camS - (y - ROAD.oy) / (PPM * ROAD.cos);
  }

  /** How far ahead the top of the screen is, in metres. */
  get viewAhead() { return ROAD.oy / (PPM * ROAD.cos) + 14; }
  get viewBehind() { return (VIEW_H - ROAD.oy) / (PPM * ROAD.cos) + 8; }

  isVisible(s, margin = 10) {
    const d = s - this.camS;
    return d > -this.viewBehind - margin && d < this.viewAhead + margin;
  }

  // --- drawing -----------------------------------------------------------

  /**
   * Dirt either side of the route. Built in three passes — broad patchwork,
   * then grit, then weeds — because one uniform fill reads as a colour, and a
   * jobsite should read as churned ground.
   */
  drawGround(ctx) {
    const p = this.palette;
    ctx.fillStyle = p.ground;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    const s0 = Math.floor((this.camS - this.viewBehind) / 4) * 4;
    const s1 = this.camS + this.viewAhead;

    // Broad patchwork: soft cells of slightly different dirt, so the ground has
    // shape at a distance instead of only texture up close. Kept small and
    // jittered off the lattice — big aligned rectangles read as tiling, which
    // is worse than no variation at all.
    for (let s = s0; s < s1; s += 2.5) {
      for (let t = -34; t <= 34; t += 3) {
        if (Math.abs(t) < ROAD.edge - 1) continue;
        const h = hash2(s * 0.13, t * 0.17);
        if (h < 0.62) continue;
        ctx.fillStyle = h > 0.87 ? p.groundLo : p.groundAlt;
        const jx = (hash2(s, t) - 0.5) * 3;
        const jy = (hash2(t, s) - 0.5) * 2.4;
        const x = this.projectX(s, t) + jx;
        const y = this.projectY(s, t) + jy;
        if (x < -30 || x > VIEW_W + 30 || y < -30 || y > VIEW_H + 30) continue;
        const w = 5 + ((h * 9) | 0);
        ctx.fillRect((x - w / 2) | 0, y | 0, w, 3 + ((h * 3) | 0));
      }
    }

    // Vehicle ruts running parallel to the route just off the shoulder: the
    // strongest single cue that things drive here all day.
    ctx.fillStyle = p.rut;
    for (const side of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const t = side * (ROAD.edge + 1.1 + k * 1.5);
        for (let s = s0; s < s1; s += 0.7) {
          if (hash2(s * 0.9, t) < 0.25) continue;
          const x = this.projectX(s, t) | 0;
          const y = this.projectY(s, t) | 0;
          if (x < 0 || x > VIEW_W || y < 0 || y > VIEW_H) continue;
          ctx.fillRect(x, y, 2, 1);
        }
      }
    }

    // Grit.
    ctx.fillStyle = p.groundAlt;
    for (let s = s0; s < s1; s += 2) {
      for (let t = -32; t <= 32; t += 2.2) {
        const h = hash2(s * 0.5, t * 0.4);
        if (h < 0.42) continue;
        if (Math.abs(t) < ROAD.edge + 0.6) continue;
        const x = this.projectX(s + (h - 0.5) * 1.6, t);
        const y = this.projectY(s + (h - 0.5) * 1.6, t);
        if (x < -4 || x > VIEW_W + 4 || y < -4 || y > VIEW_H + 4) continue;
        ctx.fillRect(x | 0, y | 0, h > 0.86 ? 2 : 1, 1);
      }
    }

    // Weeds, sparser still, with a little shadow so they sit on the ground.
    for (let s = s0; s < s1; s += 4) {
      for (let t = -30; t <= 30; t += 3.5) {
        const h = hash2(s * 0.31 + 7.7, t * 0.53 + 3.1);
        if (h < 0.86) continue;
        if (Math.abs(t) < ROAD.edge + 1.2) continue;
        const x = this.projectX(s, t) | 0;
        const y = this.projectY(s, t) | 0;
        if (x < 2 || x > VIEW_W - 2 || y < 2 || y > VIEW_H - 2) continue;
        ctx.fillStyle = p.groundLo;
        ctx.fillRect(x - 1, y + 1, 3, 1);
        ctx.fillStyle = p.tuft;
        ctx.fillRect(x, y - 2, 1, 3);
        ctx.fillRect(x - 1, y - 1, 1, 2);
        ctx.fillRect(x + 1, y - 1, 1, 2);
      }
    }
  }

  /**
   * Per-row surface scan. One horizontal span per screen row for the shoulder,
   * one for the paved surface, plus kerb, centre dashes and lane wear.
   */
  drawSurface(ctx) {
    const p = this.palette;
    const kEdge = ROAD.edge * LATERAL_PX;
    const kRoad = ROAD.halfW * LATERAL_PX;

    for (let y = 0; y < VIEW_H; y++) {
      const xc = this.centreX(y);
      const s = this.sAtRow(y);

      // Gravel shoulders, banded so the edge of the tarmac is not a hard line
      // between two flat colours.
      const sl = Math.round(xc - kEdge);
      const sr = Math.round(xc + kEdge);
      if (sr > 0 && sl < VIEW_W) {
        ctx.fillStyle = (Math.floor(s * 0.6) & 1) ? p.shoulderAlt : p.shoulder;
        ctx.fillRect(sl, y, sr - sl, 1);
      }

      const rl = Math.round(xc - kRoad);
      const rr = Math.round(xc + kRoad);
      if (rr <= 0 || rl >= VIEW_W) continue;

      // Two asphalt tones banded along the route: patched-up jobsite tarmac.
      ctx.fillStyle = (Math.floor(s * 0.35) & 1) ? p.asphaltAlt : p.asphalt;
      ctx.fillRect(rl, y, rr - rl, 1);

      // Where the wheels go, over and over.
      ctx.fillStyle = p.patch;
      const lane = 1.7 * LATERAL_PX;
      ctx.fillRect(Math.round(xc - lane) - 2, y, 5, 1);
      ctx.fillRect(Math.round(xc + lane) - 2, y, 5, 1);

      // Kerb: hazard stripes cut in 1.5 m chunks, with a dark lip below them.
      const stripe = Math.floor(s / 1.5) & 1;
      ctx.fillStyle = stripe ? p.kerbA : p.kerbB;
      ctx.fillRect(rl - 2, y, 3, 1);
      ctx.fillRect(rr - 1, y, 3, 1);
      ctx.fillStyle = p.crack;
      ctx.fillRect(rl + 1, y, 1, 1);
      ctx.fillRect(rr - 2, y, 1, 1);

      // Centre line: 2 m of paint, 2 m of nothing, worn through in places.
      if ((s % 4 + 4) % 4 < 2) {
        ctx.fillStyle = hash2(Math.floor(s * 2), 3) > 0.18 ? p.line : p.asphaltAlt;
        ctx.fillRect(Math.round(xc) - 1, y, 3, 1);
      }
    }

    // Surface detail in world space: patches, cracks, oil, grit.
    const s0 = Math.floor(this.camS / 2) * 2 - this.viewBehind;
    const s1 = this.camS + this.viewAhead;

    for (let s = s0; s < s1; s += 2) {
      const h = hash2(s * 0.21, 1.7);
      if (h > 0.86) {
        // A rectangular repair patch, sat square to the route.
        ctx.fillStyle = p.patch;
        const t0 = (h - 0.5) * 6;
        const len = 1.6 + h * 2;
        for (let d = 0; d < len; d += 0.35) {
          const x = this.projectX(s + d, t0) | 0;
          const y = this.projectY(s + d, t0) | 0;
          if (x < -20 || x > VIEW_W + 20 || y < 0 || y > VIEW_H) continue;
          ctx.fillRect(x - 9, y, 18, 2);
        }
      }
      if (h > 0.55 && h < 0.62) {
        // A crack wandering across a lane.
        ctx.fillStyle = p.crack;
        let t = (h - 0.58) * 60;
        for (let d = 0; d < 3; d += 0.3) {
          t += (hash2(s + d, 9.1) - 0.5) * 0.9;
          const x = this.projectX(s + d, t) | 0;
          const y = this.projectY(s + d, t) | 0;
          if (x < 0 || x > VIEW_W || y < 0 || y > VIEW_H) continue;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      if (h < 0.06) {
        // An oil stain where something stood and dripped.
        ctx.fillStyle = p.oil;
        const t0 = (h - 0.03) * 90;
        const x = this.projectX(s, t0) | 0;
        const y = this.projectY(s, t0) | 0;
        if (x > -12 && x < VIEW_W + 12 && y > 0 && y < VIEW_H) {
          ctx.fillRect(x - 4, y - 1, 9, 3);
          ctx.fillRect(x - 2, y - 2, 5, 5);
        }
      }
    }

    ctx.fillStyle = p.asphaltAlt;
    for (let s = s0; s < s1; s += 1.1) {
      for (let t = -ROAD.halfW + 0.4; t < ROAD.halfW; t += 1.1) {
        if (hash2(s * 0.77, t * 0.91) < 0.72) continue;
        const x = this.projectX(s, t) | 0;
        const y = this.projectY(s, t) | 0;
        if (x < 0 || x > VIEW_W || y < 0 || y > VIEW_H) continue;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  /** Rain, drawn as short streaks that scroll faster than the world. */
  drawWeather(ctx, dt = 0) {
    const p = this.palette;
    this.time += dt;
    if (!p.rain) return;
    const drops = Math.round(90 * p.rain);
    ctx.fillStyle = 'rgba(190,214,236,0.5)';
    for (let i = 0; i < drops; i++) {
      const seed = i * 12.9898;
      const x = (hash2(seed, 1) * VIEW_W + this.time * 40) % VIEW_W;
      const y = (hash2(seed, 2) * VIEW_H + this.time * 460 * p.rain) % VIEW_H;
      ctx.fillRect(x | 0, y | 0, 1, 4 + (p.rain > 1 ? 3 : 0));
    }
  }

  /**
   * Screen-space grade: the haze tint, a soft vignette, and at night a pool of
   * light down the road so the floodlights feel like they are doing something.
   */
  drawGrade(ctx) {
    const p = this.palette;
    if (p.lightPool) {
      const g = ctx.createRadialGradient(
        ROAD.ox + 30, ROAD.oy - 90, 10,
        ROAD.ox + 30, ROAD.oy - 90, VIEW_W * 0.75,
      );
      g.addColorStop(0, `rgba(255,226,150,${0.16 * p.lightPool})`);
      g.addColorStop(1, 'rgba(255,226,150,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (p.haze) {
      ctx.fillStyle = p.haze;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (p.vignette) {
      const g = ctx.createRadialGradient(
        VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.32,
        VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.82,
      );
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(8,6,10,${p.vignette})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  /** Kept for callers that still ask for the old single-call haze. */
  drawHaze(ctx) { this.drawGrade(ctx); }

  /**
   * Contact shadow under a billboard. Soft-edged and offset slightly with the
   * light, so things sit on the ground instead of hovering over it.
   */
  shadow(ctx, s, t, w = 6, strength = 1) {
    const x = this.projectX(s, t);
    const y = this.projectY(s, t);
    if (x < -20 || x > VIEW_W + 20 || y < -20 || y > VIEW_H + 20) return;
    const cx = Math.round(x) + 1;
    const cy = Math.round(y);
    ctx.fillStyle = `rgba(0,0,0,${0.3 * strength})`;
    ctx.fillRect(cx - (w >> 1), cy - 1, w, 3);
    ctx.fillStyle = `rgba(0,0,0,${0.18 * strength})`;
    ctx.fillRect(cx - (w >> 1) - 1, cy, w + 2, 1);
    ctx.fillRect(cx - (w >> 1) + 1, cy - 2, w - 2, 1);
  }
}

// Cheap deterministic hash in [0,1).
function hash2(a, b) {
  let h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  h -= Math.floor(h);
  return h;
}

export { hash2 };
