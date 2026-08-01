// Hand-authored pixel art. Every sprite is a list of equal-length rows of
// palette keys; '.' is transparent. Sprites are baked to offscreen canvases the
// first time they are drawn, and the bake validates the rows, so a ragged
// sprite fails at boot rather than a level in.

export const PAL = {
  k: '#171418', // ink
  d: '#2a2630', // shadow
  g: '#4a4550', // dark metal
  G: '#7b7684', // metal
  c: '#9aa0a8', // concrete
  C: '#d2d7dd', // concrete light
  w: '#efe4c4', // paper
  W: '#fdf6e0', // paper highlight
  y: '#ffd24a', // hi-viz yellow
  Y: '#a8760f', // deep gold
  l: '#c4e022', // lime
  o: '#ff6a3d', // ember
  r: '#a8331f', // rust red
  b: '#4d86c6', // blue
  n: '#2a4a6a', // deep blue
  s: '#8a6038', // wood
  S: '#55381f', // dark wood
  f: '#e8b48a', // skin
  F: '#b57a4f', // skin shade
  t: '#6b4a2a', // tea
  p: '#d46aa0', // pink
};

export const ART = {
  buggy: [
    '..k........k..',
    '..k..kkkk..k..',
    '..k.kffffk.k..',
    '..kkkfkfkkkk..',
    '..kyyyyyyyyk..',
    '.kkyywwwwyykk.',
    '.kykywwwwykyk.',
    '.kyyyyyyyyyyk.',
    '.kyyyoyyoyyyk.',
    'kkkkyyyyyykkkk',
    'kGGkkyyyykkGGk',
    'kGGkkyyyykkGGk',
    'kkkkkyyyykkkkk',
    '..kkk....kkk..',
  ],

  cone: [
    '...o...',
    '..ooo..',
    '..oWo..',
    '.ooooo.',
    '.oWWWo.',
    '.ooooo.',
    'ooooooo',
    'kkkkkkk',
  ],

  barrel: [
    '.ooooooo.',
    'oCCCCCCCo',
    'ooooooooo',
    'oWWWWWWWo',
    'oWWWWWWWo',
    'ooooooooo',
    'ooooooooo',
    'oWWWWWWWo',
    'oWWWWWWWo',
    'ooooooooo',
    'koooooook',
    '.kkkkkkk.',
  ],

  pothole: [
    '...kkkkk....',
    '.kkddddkkk..',
    'kkdddddddkk.',
    'kddddddddkk.',
    '.kkdddddkk..',
    '..kkkkkkk...',
  ],

  puddle: [
    '...nnnnnn.....',
    '.nnbbbbbbnn...',
    'nnbbbCbbbbnn..',
    'nbbbbbbbbbbnn.',
    '.nnbbbbbbbnn..',
    '..nnnnnnnnn...',
  ],

  gravel: [
    '..c..c...c..c.....',
    '.c.cc..c..c..cc...',
    'c..c..cc..c.c..c..',
    '.cc..c..c..cc..c..',
    '..c.c..cc..c..cc..',
    '.c..cc..c..c.c....',
  ],

  planks: [
    '..sssssssssss.',
    '.ssSSSSSSSSSs.',
    'ssssssssssssss',
    'sSSSSSSSSSSSSs',
    'ssssssssssssss',
    'sSSSSSSSSSSSSs',
    'ssssssssssssss',
    'kkkkkkkkkkkkkk',
  ],

  mixer: [
    '....kkkkkk......',
    '..kkCCCCCCkk....',
    '.kCCCCCCCCCCk...',
    'kCCCCggCCCCCCk..',
    'kCCCggggCCCCCk..',
    'kCCCCggCCCCCCk..',
    '.kCCCCCCCCCCk...',
    '..kkCCCCCCkk....',
    '....kkkkkk......',
    '.....gg.gg......',
    '....gg...gg.....',
    '...gg.....gg....',
    '..gg.......gg...',
    '.gg.........gg..',
    'kkkk.......kkkk.',
    '................',
  ],

  forklift: [
    '..kk............',
    '..ky............',
    '..ky...kkkkk....',
    '..ky..kyyyyyk...',
    '..ky..kybbbyk...',
    '..ky..kyyyyyk...',
    '..ky...kyyyk....',
    '..kyyyyyyyyyk...',
    '.kyyyyyyyyyyyk..',
    '.kyyyyyyyyyyyk..',
    'kkkkyyyyyyykkkk.',
    'kGGkkyyyyykkGGk.',
    'kGGk.......kGGk.',
    'kkkk.......kkkk.',
  ],

  barrow: [
    '..GGGGGGGG..',
    '.GCCCCCCCCG.',
    'GCCCCCCCCCCG',
    'GCCCCCCCCCCG',
    '.GCCCCCCCCG.',
    '..GGGGGGGG..',
    '...G....G...',
    '..kk....G...',
    '.kGGk...G...',
    '..kk........',
  ],

  pole: [
    '..GGGGGGGGGGGGGG..',
    '.GCCCCCCCCCCCCCCG.',
    'GCCCCCCCCCCCCCCCCG',
    '.GCCCCCCCCCCCCCCG.',
    '..GGGGGGGGGGGGGG..',
    '..kkkkkkkkkkkkkk..',
  ],

  sandpile: [
    '......yyyy......',
    '....yyYYYYyy....',
    '..yyYYYYYYYYyy..',
    '.yYYYYYYYYYYYYy.',
    'yYYYYYYYYYYYYYYy',
    'yYYYYYYYYYYYYYYy',
    'kYYYYYYYYYYYYYYk',
    '.kkkkkkkkkkkkkk.',
  ],

  worker: [
    '..kkkk..',
    '.kWWWWk.',
    '.kWWWWk.',
    '..kffk..',
    '..fffk..',
    '.kyyyyk.',
    'kyyyyyyk',
    'kyyllyyk',
    'kyyyyyyk',
    '.kyyyyk.',
    '.knnnnk.',
    '.kn..nk.',
    '.kn..nk.',
    '.kk..kk.',
  ],

  workerCheer: [
    'k.kkkk.k',
    'kkWWWWkk',
    '.kWWWWk.',
    'k.kffk.k',
    'k.fffk.k',
    'kkyyyykk',
    '.kyyyyk.',
    '.kyllyk.',
    '.kyyyyk.',
    '.kyyyyk.',
    '.knnnnk.',
    '.kn..nk.',
    '.kn..nk.',
    '.kk..kk.',
  ],

  workerDuck: [
    '........',
    '........',
    '..kkkk..',
    '.kWWWWk.',
    '..kffk..',
    '..fffk..',
    '.kyyyyk.',
    'kyyllyyk',
    'kyyyyyyk',
    '.kyyyyk.',
    '.knnnnk.',
    '.knn.nk.',
    '.kn..nk.',
    '.kk..kk.',
  ],

  foreman: [
    '..kkkk..',
    '.koooook',
    '.koooook',
    '..kffk..',
    '..fffk..',
    '.kbbbbk.',
    'kbbbbbbk',
    'kbbWWbbk',
    'kbbWWbbk',
    '.kbbbbk.',
    '.kdddgk.',
    '.kd..dk.',
    '.kd..dk.',
    '.kk..kk.',
  ],

  scaffold: [
    'g................g',
    'g................g',
    'gssssssssssssssssg',
    'g.G............G.g',
    'g..G..........G..g',
    'g...G........G...g',
    'gGGGGGGGGGGGGGGGGg',
    'g...G........G...g',
    'g..G..........G..g',
    'gssssssssssssssssg',
    'g.G............G.g',
    'g..G..........G..g',
    'gGGGGGGGGGGGGGGGGg',
    'g................g',
    'g................g',
    'gssssssssssssssssg',
    'g................g',
    'kk..............kk',
  ],

  teaHut: [
    '..rrrrrrrrrrrrrrrr..',
    '.rrrrrrrrrrrrrrrrrr.',
    'rrrrrrrrrrrrrrrrrrrr',
    'ssssssssssssssssssss',
    'sSSssnnnnnnssssSSSSs',
    'sSSssnbbbbnssssSSSSs',
    'sssssnbbbbnsssssssss',
    'sSSssnbbbbnssssSSSSs',
    'sSSssnnnnnnssssSSSSs',
    'ssssssssssssssssssss',
    'sSSSSSSssssSSSSSSSSs',
    'ssssssssssssssssssss',
    'sSSSSSSssssSSSSSSSSs',
    'ssssssssssssssssssss',
    'kkkkkkkkkkkkkkkkkkkk',
    '....................',
  ],

  crate: [
    'ssssssssss',
    'sWWWWWWWWs',
    'sWwwwwwwWs',
    'sWwWWWWwWs',
    'sWwWyyWwWs',
    'sWwWyyWwWs',
    'sWwWWWWwWs',
    'sWwwwwwwWs',
    'sWWWWWWWWs',
    'kkkkkkkkkk',
  ],

  tea: [
    '..WWWW..',
    '.WwwwwW.',
    'WwttttwW',
    'WwttttwW',
    'WwttttwW',
    '.WwwwwWW',
    '..WWWW.W',
    '..kkkk..',
  ],

  sheet: [
    '.WWWW.',
    'WwwwwW',
    'WwWWwW',
    'WwwwwW',
    '.WWWW.',
  ],

  sign: [
    '..yyyyyy..',
    '.yykkkkyy.',
    'yykkyykkyy',
    'ykkyyyykky',
    'ykkyykkkky',
    'ykkkyykkky',
    'yykkkkkkyy',
    '.yykkkkyy.',
    '..yyyyyy..',
    '....GG....',
    '....GG....',
    '....GG....',
    '....GG....',
    '...kkkk...',
  ],

  floodlight: [
    '..WWWWWW..',
    '.WWyyyyWW.',
    'WWyyyyyyWW',
    'WWyyyyyyWW',
    '.WWyyyyWW.',
    '..GGGGGG..',
    '....GG....',
    '....GG....',
    '....GG....',
    '....GG....',
    '....GG....',
    '....GG....',
    '...GGGG...',
    '..GG..GG..',
    '.GG....GG.',
    'kkk....kkk',
  ],

  portaloo: [
    '.gggggggggg.',
    'gllllllllllg',
    'gllllllllllg',
    'gllWWWWWWllg',
    'gllWbbbbWllg',
    'gllWbbbbWllg',
    'gllWWWWWWllg',
    'gllllllllllg',
    'gllllllllllg',
    'glllllllkllg',
    'gllllllkkllg',
    'glllllllkllg',
    'gllllllllllg',
    'gllllllllllg',
    'gllllllllllg',
    'gllllllllllg',
    'gkkkkkkkkkkg',
    '.kkkkkkkkkk.',
  ],

  fence: [
    'yykkyykkyykkyy',
    'kkyykkyykkyykk',
    'yykkyykkyykkyy',
    'kkyykkyykkyykk',
    'G............G',
    'G............G',
    'G............G',
    'G............G',
    'G............G',
    'k............k',
  ],

  bomba: [
    '..ss..........ss..',
    '.sSSs........sSSs.',
    '.ssssss....ssssss.',
    '..ssssssssssssss..',
    '.ssssssssssssssss.',
    '.ssWksssssssskWss.',
    '.ssssssssssssssss.',
    '..sssskkkkkkssss..',
    '..ssssskppkssss...',
    '.ssssssppssssssss.',
    '.ssssssssssssssss.',
    '..ssssssssssssss..',
    '..ss..ssss..ss....',
    '..kk..kkkk..kk....',
  ],

  puff: [
    '..cc..cc..',
    '.cCCccCCc.',
    'cCCCCCCCCc',
    'cCCCCCCCCc',
    '.cCCccCCc.',
    '..cc..cc..',
  ],

  spark: [
    '...y...',
    '.y.y.y.',
    '..yWy..',
    'yyWWWyy',
    '..yWy..',
    '.y.y.y.',
    '...y...',
  ],

  star: [
    '...y...',
    '...y...',
    '.yyyyy.',
    'yyyWyyy',
    '.yyyyy.',
    '..y.y..',
    '.y...y.',
  ],

  arrow: [
    '....o....',
    '...ooo...',
    '..ooWoo..',
    '.ooWWWoo.',
    'ooooWoooo',
    '....W....',
    '....o....',
  ],
};

// --- derived sprites ------------------------------------------------------

// Shear the cab of the buggy against its wheels to fake a steering pose.
function steer(rows, dx) {
  return rows.map((row, i) => {
    if (i > 8) return row;
    const pad = '.'.repeat(Math.abs(dx));
    return dx < 0 ? row.slice(Math.abs(dx)) + pad : pad + row.slice(0, row.length - dx);
  });
}

function recolor(rows, map) {
  return rows.map((row) => row.replace(/./g, (ch) => map[ch] || ch));
}

ART.buggyLeft = steer(ART.buggy, -1);
ART.buggyRight = steer(ART.buggy, 1);
ART.buggyWreck = recolor(steer(ART.buggy, 1), { y: 'g', o: 'r', w: 'c', W: 'C' });

// --- baking ---------------------------------------------------------------

const cache = new Map();

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function bake(name, { flip = false, tint = null, alpha = 1 } = {}) {
  const key = `${name}|${flip ? 1 : 0}|${tint || ''}|${alpha}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rows = ART[name];
  if (!rows) throw new Error(`unknown sprite "${name}"`);
  const w = rows[0].length;
  for (const row of rows) {
    if (row.length !== w) {
      throw new Error(`sprite "${name}" is ragged: expected ${w} columns, got ${row.length} in "${row}"`);
    }
  }
  const h = rows.length;

  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      const col = tint || PAL[ch];
      if (!col) throw new Error(`sprite "${name}" uses undeclared palette key "${ch}"`);
      ctx.fillStyle = col;
      ctx.fillRect(flip ? w - 1 - x : x, y, 1, 1);
    }
  }
  const baked = { canvas, w, h };
  cache.set(key, baked);
  return baked;
}

export function spriteSize(name) {
  const rows = ART[name];
  return { w: rows[0].length, h: rows.length };
}

/**
 * Draw a sprite with its anchor at (x, y). `ax`/`ay` are 0..1 within the
 * sprite; the default anchors the bottom centre, which is where a thing's feet
 * meet the ground.
 */
export function drawSprite(ctx, name, x, y, {
  ax = 0.5, ay = 1, flip = false, tint = null, alpha = 1, scale = 1,
} = {}) {
  const baked = bake(name, { flip, tint });
  const dx = Math.round(x - baked.w * scale * ax);
  const dy = Math.round(y - baked.h * scale * ay);
  if (alpha !== 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(baked.canvas, dx, dy, baked.w * scale, baked.h * scale);
    ctx.restore();
    return;
  }
  ctx.drawImage(baked.canvas, dx, dy, baked.w * scale, baked.h * scale);
}

/** Bake everything once so ragged rows or bad palette keys surface at boot. */
export function validateArt(names) {
  const problems = [];
  for (const name of names) {
    try { bake(name); } catch (err) { problems.push(err.message); }
  }
  if (problems.length) throw new Error(`art contract broken:\n  ${problems.join('\n  ')}`);
  return true;
}
