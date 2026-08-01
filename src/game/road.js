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

export const VIEW_W = 288;
export const VIEW_H = 216;

const ANGLE = 0.36;            // radians the route leans off vertical
const PPM = 4.2;               // pixels per metre along the route
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
  ox: 92,
  oy: 178,
};

// Pixels along a screen row per metre of lateral offset.
export const LATERAL_PX = PPM / ROAD.cos;

export const THEMES = {
  day: {
    ground: '#6b5a3e', groundAlt: '#5b4c33', tuft: '#8a9c3a',
    asphalt: '#3f3c47', asphaltAlt: '#484552', shoulder: '#7a6647',
    kerbA: '#ffd24a', kerbB: '#2a2630', line: '#efe4c4',
    haze: null,
  },
  dust: {
    ground: '#7a6642', groundAlt: '#6a5836', tuft: '#96a03c',
    asphalt: '#474049', asphaltAlt: '#514a55', shoulder: '#8a7250',
    kerbA: '#ffd24a', kerbB: '#3a3028', line: '#efe4c4',
    haze: 'rgba(200,160,90,0.13)',
  },
  wet: {
    ground: '#4c4a3c', groundAlt: '#403f33', tuft: '#6d7f33',
    asphalt: '#33323d', asphaltAlt: '#3b3a47', shoulder: '#585240',
    kerbA: '#e7c04a', kerbB: '#26242c', line: '#d7cfb4',
    haze: 'rgba(70,90,120,0.16)',
  },
  dusk: {
    ground: '#4a3c33', groundAlt: '#3d3129', tuft: '#7a7c34',
    asphalt: '#332f3a', asphaltAlt: '#3a3644', shoulder: '#5c4a38',
    kerbA: '#ffb84a', kerbB: '#221f28', line: '#e8d8b0',
    haze: 'rgba(140,70,40,0.16)',
  },
  night: {
    ground: '#2c2a30', groundAlt: '#242229', tuft: '#4c5a26',
    asphalt: '#26242c', asphaltAlt: '#2c2a34', shoulder: '#3a3440',
    kerbA: '#ffd24a', kerbB: '#1b1a1f', line: '#b9b19a',
    haze: 'rgba(20,25,50,0.30)',
  },
};

export class Road {
  constructor(theme = 'day') {
    this.camS = 0;
    this.theme = THEMES[theme] ? theme : 'day';
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

  drawGround(ctx) {
    const p = this.palette;
    ctx.fillStyle = p.ground;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Deterministic speckle lattice in world space, so the dirt scrolls with
    // the route instead of crawling with the camera.
    const s0 = Math.floor((this.camS - this.viewBehind) / 2) * 2;
    const s1 = this.camS + this.viewAhead;
    ctx.fillStyle = p.groundAlt;
    for (let s = s0; s < s1; s += 2) {
      for (let t = -30; t <= 30; t += 2.5) {
        const h = hash2(s * 0.5, t * 0.4);
        if (h < 0.42) continue;
        if (Math.abs(t) < ROAD.edge + 0.6) continue;
        const x = this.projectX(s + (h - 0.5) * 1.6, t);
        const y = this.projectY(s + (h - 0.5) * 1.6, t);
        if (x < -4 || x > VIEW_W + 4 || y < -4 || y > VIEW_H + 4) continue;
        const big = h > 0.86;
        ctx.fillRect(x | 0, y | 0, big ? 2 : 1, 1);
      }
    }
    // Weed tufts, sparser still.
    ctx.fillStyle = p.tuft;
    for (let s = s0; s < s1; s += 5) {
      for (let t = -28; t <= 28; t += 4) {
        const h = hash2(s * 0.31 + 7.7, t * 0.53 + 3.1);
        if (h < 0.88) continue;
        if (Math.abs(t) < ROAD.edge + 1.2) continue;
        const x = this.projectX(s, t) | 0;
        const y = this.projectY(s, t) | 0;
        if (x < 0 || x > VIEW_W || y < 0 || y > VIEW_H) continue;
        ctx.fillRect(x, y - 1, 1, 2);
        ctx.fillRect(x - 1, y, 1, 1);
        ctx.fillRect(x + 1, y, 1, 1);
      }
    }
  }

  /**
   * Per-row surface scan. One horizontal span per screen row for the shoulder,
   * one for the paved surface, plus the kerb and centre dashes.
   */
  drawSurface(ctx) {
    const p = this.palette;
    const kL = ROAD.edge * LATERAL_PX;
    const kR = ROAD.halfW * LATERAL_PX;

    for (let y = 0; y < VIEW_H; y++) {
      const xc = this.centreX(y);

      // Gravel shoulders (one span covering both sides plus the road, then the
      // road is painted over it — cheaper than three spans and pixel-identical).
      const sl = Math.round(xc - kL);
      const sr = Math.round(xc + kL);
      if (sr > 0 && sl < VIEW_W) {
        ctx.fillStyle = p.shoulder;
        ctx.fillRect(sl, y, sr - sl, 1);
      }

      const rl = Math.round(xc - kR);
      const rr = Math.round(xc + kR);
      if (rr <= 0 || rl >= VIEW_W) continue;

      const s = this.sAtRow(y);
      // Two asphalt tones banded along the route: patched-up jobsite tarmac.
      const band = Math.floor(s * 0.35) & 1;
      ctx.fillStyle = band ? p.asphaltAlt : p.asphalt;
      ctx.fillRect(rl, y, rr - rl, 1);

      // Kerb: hazard stripes cut in 1.5 m chunks.
      const stripe = Math.floor(s / 1.5) & 1;
      ctx.fillStyle = stripe ? p.kerbA : p.kerbB;
      ctx.fillRect(rl - 1, y, 2, 1);
      ctx.fillRect(rr - 1, y, 2, 1);

      // Centre line: 2 m of paint, 2 m of nothing.
      if ((s % 4 + 4) % 4 < 2) {
        ctx.fillStyle = p.line;
        ctx.fillRect(Math.round(xc) - 1, y, 2, 1);
      }
    }

    // Asphalt grit, again pinned to world space.
    ctx.fillStyle = p.asphaltAlt;
    const s0 = Math.floor(this.camS / 1.5) * 1.5;
    for (let s = s0 - this.viewBehind; s < this.camS + this.viewAhead; s += 1.5) {
      for (let t = -ROAD.halfW + 0.5; t < ROAD.halfW; t += 1.4) {
        const h = hash2(s * 0.77, t * 0.91);
        if (h < 0.7) continue;
        const x = this.projectX(s, t) | 0;
        const y = this.projectY(s, t) | 0;
        if (x < 0 || x > VIEW_W || y < 0 || y > VIEW_H) continue;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  drawHaze(ctx) {
    const p = this.palette;
    if (!p.haze) return;
    ctx.fillStyle = p.haze;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  /** Soft contact shadow under a billboard. */
  shadow(ctx, s, t, w = 6) {
    const x = this.projectX(s, t);
    const y = this.projectY(s, t);
    if (x < -8 || x > VIEW_W + 8 || y < -8 || y > VIEW_H + 8) return;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(Math.round(x - w / 2), Math.round(y - 1), w, 2);
    ctx.fillRect(Math.round(x - w / 2) + 1, Math.round(y - 2), w - 2, 1);
  }
}

// Cheap deterministic hash in [0,1).
function hash2(a, b) {
  let h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  h -= Math.floor(h);
  return h;
}

export { hash2 };
