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
/**
 * Six full colour grades for the route.
 *
 * These are built to a value structure, not picked by eye. Two numbers decide
 * whether a scene reads as a place or as mud:
 *
 *   Spread. The terrain tones have to cover a real range. The first version of
 *   this table put every tone between luminance 51 and 104 — a 53-wide band out
 *   of 255, all midtones, no darks and no lights — and the result looked
 *   exactly as flat as that sounds. Each grade now spans roughly 30 to 150.
 *
 *   Material break. Dirt is warm and asphalt is cool, so the road separates
 *   from the ground by hue as well as by value and stops reading as more dirt.
 *
 * `depth` and `depthAmt` drive the atmospheric ramp in drawDepth(): the colour
 * distance drifts toward, and how much of it lands at the top of the screen.
 */
export const THEMES = {
  day: {
    groundHi: '#ab9059', groundMid: '#8e7245', ground: '#7a6039', groundAlt: '#66502f',
    groundLo: '#473827', groundDeep: '#2a2430', tuft: '#8a9c3a',
    asphalt: '#33313d', asphaltAlt: '#3b3946', patch: '#2a2833', crack: '#1e1c25',
    shoulder: '#9b8355', shoulderAlt: '#87703f', rut: '#453520',
    kerbA: '#ffd24a', kerbB: '#241f2c', line: '#efe4c4', oil: '#22202a',
    depth: '#d8bd88', depthAmt: 0.34,
    sun: '#ffe6a8', sunAmt: 0.13, shade: '#2a2438', shadeAmt: 0.20,
    haze: null, vignette: 0.26, rain: 0, lightPool: 0,
  },
  dust: {
    groundHi: '#c1a366', groundMid: '#a48453', ground: '#8d7143', groundAlt: '#775f36',
    groundLo: '#55432c', groundDeep: '#332b33', tuft: '#96a03c',
    asphalt: '#3a3742', asphaltAlt: '#43404c', patch: '#2f2d38', crack: '#232128',
    shoulder: '#b09260', shoulderAlt: '#9a7f4a', rut: '#523e23',
    kerbA: '#ffd24a', kerbB: '#2a2430', line: '#efe4c4', oil: '#272531',
    depth: '#e8c98c', depthAmt: 0.46,
    sun: '#ffeab4', sunAmt: 0.16, shade: '#33283a', shadeAmt: 0.18,
    haze: 'rgba(206,166,96,0.13)', vignette: 0.26, rain: 0, lightPool: 0,
  },
  wet: {
    groundHi: '#726b52', groundMid: '#5f5a44', ground: '#4f4a38', groundAlt: '#423e2f',
    groundLo: '#2e2c26', groundDeep: '#1b1a22', tuft: '#6d7f33',
    asphalt: '#2a2933', asphaltAlt: '#32313d', patch: '#211f29', crack: '#17161d',
    shoulder: '#635c45', shoulderAlt: '#544e3a', rut: '#2c2a1e',
    kerbA: '#e7c04a', kerbB: '#1e1c24', line: '#d7cfb4', oil: '#1a1922',
    depth: '#8fa4bd', depthAmt: 0.38,
    sun: '#cfe0f0', sunAmt: 0.09, shade: '#1c2434', shadeAmt: 0.26,
    haze: 'rgba(78,102,132,0.16)', vignette: 0.32, rain: 1, lightPool: 0,
  },
  dusk: {
    groundHi: '#8a6a4c', groundMid: '#6f563e', ground: '#5c4835', groundAlt: '#4c3b2a',
    groundLo: '#362a24', groundDeep: '#231b26', tuft: '#7a7c34',
    asphalt: '#2e2932', asphaltAlt: '#36303b', patch: '#251f28', crack: '#1c171f',
    shoulder: '#74593e', shoulderAlt: '#624a33', rut: '#3a2b1d',
    kerbA: '#ffb84a', kerbB: '#1d1a22', line: '#e8d8b0', oil: '#221d26',
    depth: '#e08a4a', depthAmt: 0.42,
    sun: '#ffb066', sunAmt: 0.17, shade: '#2a1c34', shadeAmt: 0.26,
    haze: 'rgba(168,84,44,0.15)', vignette: 0.36, rain: 0, lightPool: 0.2,
  },
  night: {
    groundHi: '#4a4653', groundMid: '#3b3845', ground: '#302d38', groundAlt: '#28262f',
    groundLo: '#1e1c26', groundDeep: '#13131c', tuft: '#4c5a26',
    asphalt: '#201f27', asphaltAlt: '#26252e', patch: '#1a1921', crack: '#131218',
    shoulder: '#3e3a4a', shoulderAlt: '#332f3d', rut: '#232029',
    kerbA: '#ffd24a', kerbB: '#161519', line: '#b9b19a', oil: '#17161c',
    depth: '#2c3a6a', depthAmt: 0.44,
    sun: '#8fa0d8', sunAmt: 0.07, shade: '#0e1020', shadeAmt: 0.34,
    haze: 'rgba(22,28,54,0.28)', vignette: 0.48, rain: 0, lightPool: 0.75,
  },
  storm: {
    groundHi: '#5e5a4c', groundMid: '#4d4a3f', ground: '#3f3d34', groundAlt: '#35342c',
    groundLo: '#272621', groundDeep: '#18181f', tuft: '#5d6b2c',
    asphalt: '#25242d', asphaltAlt: '#2c2b35', patch: '#1e1d25', crack: '#17161c',
    shoulder: '#524b3c', shoulderAlt: '#453f32', rut: '#2b2820',
    kerbA: '#e7c04a', kerbB: '#1a191f', line: '#cfc7ad', oil: '#1b1a21',
    depth: '#6a7f9c', depthAmt: 0.42,
    sun: '#a8bcd4', sunAmt: 0.08, shade: '#181e2c', shadeAmt: 0.30,
    haze: 'rgba(52,72,104,0.22)', vignette: 0.44, rain: 1.6, lightPool: 0.45,
  },
};

/** '#rrggbb' + alpha -> an rgba() string, for gradient stops. */
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

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
  /**
   * The ground either side of the route.
   *
   * Drawn as four layers at falling scale, and the order of importance is the
   * whole point. The first version carried nearly all of its variation in
   * scattered mid-contrast rectangles two metres across — which the eye reads
   * as speckle, not as terrain, and which left sixty percent of the screen an
   * undifferentiated brown field.
   *
   * Now the *value* lives in the broad layer and the *texture* is almost
   * contrast-free on top of it. That is the difference between ground with
   * shape and ground with noise.
   *
   * Everything here may paint straight across the route: drawSurface() runs
   * afterwards and covers it.
   */
  drawGround(ctx) {
    const p = this.palette;
    ctx.fillStyle = p.ground;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    const s0 = Math.floor((this.camS - this.viewBehind) / 2) * 2;
    const s1 = this.camS + this.viewAhead;

    // --- 1. broad terrain, ~12 m across -----------------------------------
    // Two octaves, so the regions have edges that wander instead of sitting on
    // a lattice. The tone steps are deliberately small and the extremes are
    // rare: this layer is meant to give the ground *shape*, and if its local
    // contrast rises much above this it stops reading as terrain and starts
    // reading as brickwork. The darkest tone is not used here at all — it is
    // reserved for the tracks, which are structure rather than texture.
    for (let s = s0; s < s1; s += 2) {
      for (let t = -36; t <= 36; t += 2) {
        const n = noise2(s * 0.055, t * 0.055) * 0.68
                + noise2(s * 0.17 + 5.5, t * 0.17 + 2.3) * 0.32;
        let tone = null;
        if (n < 0.30) tone = p.groundLo;
        else if (n < 0.44) tone = p.groundAlt;
        else if (n > 0.90) tone = p.groundHi;
        else if (n > 0.74) tone = p.groundMid;
        if (!tone) continue;
        const x = this.projectX(s, t);
        const y = this.projectY(s, t);
        if (x < -24 || x > VIEW_W + 24 || y < -16 || y > VIEW_H + 16) continue;
        ctx.fillStyle = tone;
        // Jittered and oversized so cell edges overlap rather than tile.
        const jx = (hash2(s, t) - 0.5) * 4;
        ctx.fillRect((x - 8 + jx) | 0, (y - 3) | 0, 17, 7);
      }
    }

    // --- 2. dried mud and spoil, ~3 m -------------------------------------
    for (let s = s0; s < s1; s += 1.5) {
      for (let t = -34; t <= 34; t += 2.5) {
        const n = noise2(s * 0.3 + 11.3, t * 0.3 + 4.1);
        if (n < 0.72) continue;
        const x = this.projectX(s, t);
        const y = this.projectY(s, t);
        if (x < -14 || x > VIEW_W + 14 || y < -8 || y > VIEW_H + 8) continue;
        ctx.fillStyle = n > 0.88 ? p.groundLo : p.groundAlt;
        const w = 4 + ((n * 7) | 0);
        ctx.fillRect((x - w / 2) | 0, y | 0, w, 2);
      }
    }

    // --- 3. vehicle tracks ------------------------------------------------
    // The strongest single cue that this is a working site rather than a
    // verge. High contrast on purpose: this is structure, not texture.
    for (const side of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const base = side * (ROAD.edge + 0.9 + k * 1.6);
        for (let s = s0; s < s1; s += 0.5) {
          // Wander, so the tracks curve the way a tyre actually does.
          const t = base + (noise2(s * 0.06, k * 3.7 + side) - 0.5) * 1.5;
          const x = this.projectX(s, t) | 0;
          const y = this.projectY(s, t) | 0;
          if (x < 0 || x > VIEW_W || y < 0 || y > VIEW_H) continue;
          ctx.fillStyle = hash2(s * 1.7, k) > 0.4 ? p.groundDeep : p.rut;
          ctx.fillRect(x, y, 2, 1);
        }
      }
    }

    // --- 4. grit, deliberately almost invisible ---------------------------
    ctx.fillStyle = p.groundLo;
    for (let s = s0; s < s1; s += 1.6) {
      for (let t = -32; t <= 32; t += 1.8) {
        if (Math.abs(t) < ROAD.edge + 0.4) continue;
        const h = hash2(s * 0.5, t * 0.4);
        if (h < 0.7) continue;
        const x = this.projectX(s + (h - 0.5) * 1.6, t) | 0;
        const y = this.projectY(s + (h - 0.5) * 1.6, t) | 0;
        if (x < 0 || x > VIEW_W || y < 0 || y > VIEW_H) continue;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // --- 5. weeds, only where nothing drives ------------------------------
    for (let s = s0; s < s1; s += 3) {
      for (let t = -30; t <= 30; t += 3) {
        const h = hash2(s * 0.31 + 7.7, t * 0.53 + 3.1);
        if (h < 0.87) continue;
        if (Math.abs(t) < ROAD.edge + 2.4) continue;
        const x = this.projectX(s, t) | 0;
        const y = this.projectY(s, t) | 0;
        if (x < 2 || x > VIEW_W - 2 || y < 2 || y > VIEW_H - 2) continue;
        ctx.fillStyle = p.groundDeep;
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

  /**
   * Atmospheric depth.
   *
   * The projection is a fixed oblique with no perspective scaling, so distance
   * cannot be carried by things getting smaller — it has to be carried by
   * colour instead. Ground sixty metres up the route was being painted at the
   * identical value to ground under the wheels, which is the main reason the
   * scene read as a flat sheet rather than a space you are driving into.
   *
   * One gradient fixes it: the far end drifts toward the light, loses contrast
   * and shifts temperature, exactly as it does outdoors. Drawn after the
   * terrain and before the objects, so the ground recedes while the crews you
   * are aiming at stay crisp.
   */
  drawDepth(ctx) {
    const p = this.palette;

    // Distance: the far end drifts toward the light and loses contrast.
    if (p.depth && p.depthAmt) {
      const g = ctx.createLinearGradient(0, 0, 0, VIEW_H * 0.8);
      g.addColorStop(0, hexA(p.depth, p.depthAmt));
      g.addColorStop(0.4, hexA(p.depth, p.depthAmt * 0.32));
      g.addColorStop(1, hexA(p.depth, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    // Direction: a key light across the scene, and the shade opposite it.
    //
    // Without this the whole route is filled rather than lit — every surface
    // sits at the value its own colour says, with nothing in the picture
    // agreeing about where the sun is. Two soft gradients are enough to make
    // the ground read as a lit plane, and the sprites were already drawn with
    // their light from the upper left, so this puts the scene and the art on
    // the same story.
    if (p.sun && p.sunAmt) {
      const g = ctx.createLinearGradient(0, 0, VIEW_W * 0.9, VIEW_H);
      g.addColorStop(0, hexA(p.sun, p.sunAmt));
      g.addColorStop(0.55, hexA(p.sun, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (p.shade && p.shadeAmt) {
      const g = ctx.createLinearGradient(VIEW_W, VIEW_H, VIEW_W * 0.25, 0);
      g.addColorStop(0, hexA(p.shade, p.shadeAmt));
      g.addColorStop(0.6, hexA(p.shade, 0));
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

/**
 * Smooth 2D value noise — the hash lattice, bilinearly blended with a smooth
 * step. Neighbouring samples correlate, so this produces *shape*: broad soft
 * regions of lighter and darker ground. Raw `hash2` is uncorrelated, which is
 * why using it directly for terrain produced speckle rather than landscape.
 */
function noise2(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

export { hash2, noise2 };
