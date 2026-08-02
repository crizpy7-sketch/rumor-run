// Hand-authored pixel art.
//
// Every sprite is a list of rows of palette keys; '.' is transparent. Rows are
// written through `mk(width, ...)`, which pads the right edge, so art can be
// authored by drawing the shape rather than by counting trailing dots — the
// single biggest source of ragged sprites when this was done by hand.
//
// Sprites are baked to offscreen canvases on first use, and the bake validates
// the rows, so a mistake fails at boot rather than a level in.

export const PAL = {
  k: '#14121a', // ink / outline
  d: '#241f2c', // dark cloth, caps
  g: '#3a3646', // metal, deep
  G: '#5c5768', // metal, mid
  H: '#8b8598', // metal, light
  c: '#a9a2b4', // pale metal
  C: '#d8d3dd', // concrete, white plastic
  W: '#fdf6e0', // highlight white
  m: '#d9cdb0', // cart cream, mid
  M: '#f0e6cc', // cart cream, light
  n: '#b3a488', // cart cream, shade
  N: '#8a7d63', // cart cream, deep
  y: '#ffd24a', // hi-viz yellow
  Y: '#c99a1e', // gold, mid
  Z: '#8a6410', // gold, deep
  o: '#ff7a3d', // hi-viz orange
  O: '#c8511f', // orange, deep
  r: '#8f3418', // rust red
  l: '#c8e04a', // hi-viz lime
  L: '#8fa62c', // lime, deep
  b: '#4d86c6', // blue
  B: '#2f5f96', // blue, deep
  v: '#2a4a6a', // denim
  u: '#7fb0e0', // glass
  s: '#a97c46', // timber
  S: '#7a5730', // timber, deep
  T: '#55381d', // timber, darkest
  f: '#e8b48a', // skin
  F: '#b57a4f', // skin, shade
  e: '#a9714a', // skin, deep
  E: '#7d4f31', // skin, deep shade
  h: '#2b2028', // hair, beard
  R: '#b8342a', // red
  p: '#d46aa0', // pink
  q: '#6ec48a', // green
  x: '#7a4a2c', // rust brown
};

/** Pad every row out to `w`, so only the drawn part needs writing. */
function mk(w, ...rows) {
  return rows.map((row) => {
    if (row.length > w) throw new Error(`row of ${row.length} exceeds width ${w}: "${row}"`);
    return row + '.'.repeat(w - row.length);
  });
}

/** Repeat a small tile into a bigger shape — pipes, planks, lattice. */
function tile(rows, times, dx = 0) {
  const out = rows.map(() => '');
  for (let i = 0; i < times; i++) {
    rows.forEach((r, y) => { out[y] += '.'.repeat(i === 0 ? 0 : dx) + r; });
  }
  return out;
}

function pad(rows, left) {
  return rows.map((r) => '.'.repeat(left) + r);
}

function stack(...blocks) {
  const w = Math.max(...blocks.flat().map((r) => r.length));
  return blocks.flat().map((r) => r + '.'.repeat(w - r.length));
}

export const ART = {};

// --- Federico and his cart -------------------------------------------------
// A cream site cart, seen from behind: roof on posts, Federico in the seat with
// his cap, a bed of gossip sheets, and yellow hubs.

ART.cart = mk(22,
  '.....MMMMMMMMMMMM',
  '.....nnnnnnnnnnnn',
  '.....kddddddddddk',
  '.....kdddkkkkdddk',
  '.....kddkkkkkkddk',
  '.....kdddffffdddk',
  '.....kdddfkkfdddk',
  '.....kdddhhhhdddk',
  '.....kdoooooooodk',
  '..knMMMMMMMMMMMMMMnk',
  '..kmWWWWWWWWWWWWWWmk',
  '..kmWCCCCCCCCCCCCWmk',
  '..kmmmmmmmmmmmmmmmmk',
  '..kNmmmmmmmmmmmmmmNk',
  '..kNoNmmmmmmmmmmNoNk',
  '..kNNNNNNNNNNNNNNNNk',
  '..kkkkkkkkkkkkkkkkkk',
  '.kkkk...........kkkk',
  '.kGGk...........kGGk',
  '.kyyk...........kyyk',
  '.kGGk...........kGGk',
  '.kkkk...........kkkk',
);

// --- the crew --------------------------------------------------------------
// One base body, then poses. Hard-hat and vest colour are palette swaps, which
// is what lets a jobsite have thirty people on it without thirty sprites.
// Everything carries a dark outline, the way the concept sheet does — without
// it a hi-viz vest dissolves into a sunlit dirt road.

ART.worker = mk(14,
  '.....kkkk',
  '....kCCCCk',
  '...kCCCCCCk',
  '..kkkkkkkkkk',
  '....kffffk',
  '....kfFFfk',
  '.....kffk',
  '...kllllllk',
  '..kllllllllk',
  '..klWWllWWlk',
  '..kllllllllk',
  '..kllllllllk',
  '...kllllllk',
  '...kvvvvvvk',
  '...kvvvvvvk',
  '...kvvkkvvk',
  '...kvvkkvvk',
  '...kvvkkvvk',
  '...kkkkkkkk',
  '..kkkkkkkkkk',
);

ART.workerCheer = mk(14,
  'k....kkkk....k',
  'kfk.kCCCCk.kfk',
  '.kkkCCCCCCkkk',
  '..kkkkkkkkkk',
  '.k..kffffk..k',
  '.k..kfFFfk..k',
  '.k...kffk...k',
  '.kkkllllllkkk',
  '..kllllllllk',
  '..klWWllWWlk',
  '..kllllllllk',
  '..kllllllllk',
  '...kllllllk',
  '...kvvvvvvk',
  '...kvvvvvvk',
  '...kvvkkvvk',
  '...kvvkkvvk',
  '...kvvkkvvk',
  '...kkkkkkkk',
  '..kkkkkkkkkk',
);

ART.workerPhone = mk(14,
  '.....kkkk',
  '....kCCCCk',
  '...kCCCCCCk',
  '..kkkkkkkkkk',
  '....kffffk',
  '....kfFFfk.kk',
  '.....kffkkuk',
  '...kllllllkk',
  '..kllllllllk',
  '..klWWllWWlk',
  '..kllllllllk',
  '..kllllllllk',
  '...kllllllk',
  '...kvvvvvvk',
  '...kvvvvvvk',
  '...kvvkkvvk',
  '...kvvkkvvk',
  '...kvvkkvvk',
  '...kkkkkkkk',
  '..kkkkkkkkkk',
);

ART.workerRadio = mk(14,
  '.....kkkk',
  '....kCCCCk',
  '...kCCCCCCk',
  '..kkkkkkkkkk',
  '....kffffk.k',
  '....kfFFfkgk',
  '.....kffkfgk',
  '...kllllllfk',
  '..kllllllllk',
  '..klWWllWWlk',
  '..kllllllllk',
  '..kllllllllk',
  '...kllllllk',
  '...kvvvvvvk',
  '...kvvvvvvk',
  '...kvvkkvvk',
  '...kvvkkvvk',
  '...kvvkkvvk',
  '...kkkkkkkk',
  '..kkkkkkkkkk',
);

ART.workerKneel = mk(14,
  '',
  '',
  '',
  '.....kkkk',
  '....kCCCCk',
  '...kCCCCCCk',
  '..kkkkkkkkkk',
  '....kffffk',
  '....kfFFfk',
  '...koooooook',
  '..kooooooook',
  '..koWWooWWok',
  '..kooooooookf',
  '...koooooookf',
  '...kvvvvvvvk',
  '..kvvvvvvvvk',
  '..kvvvvvvvvk',
  '..kvvvvvvk',
  '..kkkkkkkk',
  '..kkkkkkkkk',
);

ART.workerSit = mk(14,
  '',
  '',
  '.....kkkk',
  '....kCCCCk',
  '...kCCCCCCk',
  '..kkkkkkkkkk',
  '....kffffk',
  '....kfFFfk',
  '.....kffk',
  '...koooooook',
  '..kooooooook',
  '..koWWooWWok',
  '..kooooooook',
  '...kooooooook',
  '...kvvvvvvvvk',
  '...kvvvvvvvvk',
  '...kvvk',
  '...kvvk',
  '...kkk',
  '..kkkk',
);

ART.workerDuck = mk(14,
  '',
  '',
  '.....kkkk',
  '....kCCCCk',
  '...kCCCCCCk',
  '..kkkkkkkkkk',
  '....kffffk',
  '....kfFFfk',
  '...kllllllk',
  '..kllllllllk',
  '..klWWllWWlk',
  '..kllllllllk',
  '...kllllllk',
  '...kvvvvvvk',
  '...kvvvvvvk',
  '...kvvkkvvk',
  '...kvvkkvvk',
  '...kvvkkvvk',
  '...kkkkkkkk',
  '..kkkkkkkkkk',
);

// The superintendent: orange hat, clipboard, no patience.
ART.super = mk(14,
  '.....kkkk',
  '....koooook',
  '...koooooook',
  '..kkkkkkkkkk',
  '....kffffk',
  '....kfhhfk',
  '.....kffk',
  '...koooooook',
  '..kooooooook',
  '..koWWooWWok',
  '..kooooooookk',
  '..kooooooookWk',
  '...koooooookk',
  '...kdddddddk',
  '...kdddddddk',
  '...kddkkddk',
  '...kddkkddk',
  '...kddkkddk',
  '...kkkkkkkk',
  '..kkkkkkkkkk',
);

// --- Bomba -----------------------------------------------------------------
// Scaffold designer, legend. White hard hat, shades, beard, hi-viz.

ART.bomba = mk(16,
  '......kkkk',
  '....kkCCCCkk',
  '...kCCCCCCCCk',
  '..kkkkkkkkkkkk',
  '....keeeeeek',
  '....kkkkkkkk',
  '....keeeeeek',
  '....khhhhhhk',
  '.....khhhhk',
  '...kooooooook',
  '..kooooooooook',
  '..koWWooooWWok',
  '..kooooooooook',
  '..kooooooooook',
  '...kooooooook',
  '...kvvvvvvvvk',
  '...kvvvvvvvvk',
  '...kvvvkkvvvk',
  '...kvvvkkvvvk',
  '...kvvvkkvvvk',
  '...kkkkkkkkkk',
  '..kkkkkkkkkkkk',
);

ART.bombaThumb = mk(18,
  '......kkkk',
  '....kkCCCCkk',
  '...kCCCCCCCCk',
  '..kkkkkkkkkkkk',
  '....keeeeeek',
  '....kkkkkkkk',
  '....keeeeeek',
  '....khhhhhhk',
  '.....khhhhk...kk',
  '...kooooooook.kek',
  '..koooooooooookek',
  '..koWWooooWWokeek',
  '..kooooooooookeek',
  '..kooooooooookkek',
  '...kooooooook.kkk',
  '...kvvvvvvvvk',
  '...kvvvvvvvvk',
  '...kvvvkkvvvk',
  '...kvvvkkvvvk',
  '...kvvvkkvvvk',
  '...kkkkkkkkkk',
  '..kkkkkkkkkkkk',
);

// --- scaffold material -----------------------------------------------------

const PIPE_END = ['.HHH.', 'HGcGH', 'HcccH', 'HGcGH', '.HHH.'];

ART.pipePile = stack(
  pad(tile(PIPE_END, 3, 0), 6),
  pad(tile(PIPE_END, 4, 0), 3),
  pad(tile(PIPE_END, 5, 0), 0),
  mk(25, 'kkkkkkkkkkkkkkkkkkkkkkkkk'),
);

const FRAME_ROW = ['BBBBBBBB', 'B.B..B.B', 'B..BB..B', 'B.B..B.B'];

ART.frameStack = stack(
  mk(24, '.bbbbbbbbbbbbbbbbbbbbbb'),
  tile(FRAME_ROW, 3, 0),
  tile(FRAME_ROW, 3, 0),
  tile(FRAME_ROW, 3, 0),
  mk(24, 'BBBBBBBBBBBBBBBBBBBBBBBB', 'kkkkkkkkkkkkkkkkkkkkkkkk'),
);

ART.plankBundle = mk(30,
  '..ssssssssssssssssssssssss',
  '.sSSSSSSSSSSSSSSSSSSSSSSSSs',
  'ssssssssssssssssssssssssssss',
  'sTTTTTTTTTTTTTTTTTTTTTTTTTTs',
  'ssssssssssssssssssssssssssss',
  'sSSSSSSSSSSSSSSSSSSSSSSSSSSs',
  'ssssssssssssssssssssssssssss',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  '..kk..................kk',
);

ART.jacks = mk(26,
  '..y.......y.......y',
  '..y.......y.......y',
  '.HyH.....HyH.....HyH',
  '.HyH.....HyH.....HyH',
  '..y.......y.......y',
  '..y..yyyyyyyyyy...y',
  '..y..y....y....y..y',
  '.GyG.y...GyG...y.GyG',
  '.G.G.....G.G.....G.G',
  'GG.GG...GG.GG...GG.GG',
  'kk.kk...kk.kk...kk.kk',
);

ART.couplers = mk(28,
  '..sssssssssssssssssssssss',
  '.sSGHGHGGHGHGGHGHGGHGHGSs',
  'ssGHGGHGHGGHGHGGHGHGGHGHss',
  'sSHGGHGHGGHGHGGHGHGGHGHGSs',
  'ssGGHGHGGHGHGGHGHGGHGHGGss',
  'sSSSSSSSSSSSSSSSSSSSSSSSSs',
  'ssssssssssssssssssssssssss',
  'sTTTTTTTTTTTTTTTTTTTTTTTTs',
  'kkkkkkkkkkkkkkkkkkkkkkkkkk',
);

ART.steelBeams = mk(30,
  '..HHHHHHHHHHHHHHHHHHHHHHHHHH',
  '.HGGGGGGGGGGGGGGGGGGGGGGGGGGH',
  'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
  'gGGGGGGGGGGGGGGGGGGGGGGGGGGGGg',
  'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
  '.HGGGGGGGGGGGGGGGGGGGGGGGGGGH',
  '.HHHHHHHHHHHHHHHHHHHHHHHHHHHH',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
);

// --- heavy equipment -------------------------------------------------------

ART.forklift = mk(28,
  '..kk',
  '..ky.................kkkkkk',
  '..ky...............kkyyyyyyk',
  '..ky..............kyyuuuuyyk',
  '..ky..............kyyuuuuyyk',
  '..ky..............kyyyyyyyyk',
  '..ky...............kyyyyyyk',
  '..ky..kkkkkk........kyyyyyk',
  '..ky.kyyyyyyk.......kyyyyyk',
  '..kyykyyyyyyykkkkkkkkyyyyyk',
  '..kyykyyyyyyyyyyyyyyyyyyyyk',
  '.kyyyyyyyyyyyyyyyyyyyyyyyyk',
  '.kyyyyyyyyyyyyyyyyyyyyyyyyk',
  '.kyyyyyyyyyyyyyyyyyyyyyyyyk',
  'kkkkkyyyyyyyyyyyyyyyyyykkkk',
  'kGGGkkyyyyyyyyyyyyyykkGGGk',
  'kGGGk.kkkkkkkkkkkkk..kGGGk',
  'kkGkk...............kkGkk',
  '.kkk.................kkk',
);

ART.truck = mk(34,
  '.........kkkkkkkkkk',
  '........kCCCCCCCCCCk',
  '.......kCuuuuuuuuuuCk',
  '......kCCuuuuuuuuuuCCk',
  'kkkkkkCCCCCCCCCCCCCCCCkkkkkkkkk',
  'kCCCCCCCCCCCCCCCCCCCCCCCCCCCCCk',
  'kCCCCCCCCCCCCCCCCCCCCCCCCCCCCCk',
  'kCCCCbbbbCCCCCCCCCCCCCCCCCCCCCk',
  'kCCCCbWWbCCCCCCCCCCCCCCCCCCCCCk',
  'kCCCCbbbbCCCCCCCCCCCCCCCCCCCCCk',
  'kCCCCCCCCCCCCCCCCCCCCCCCCCCCCCk',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  '..kkkk...............kkkk',
  '.kGGGGk.............kGGGGk',
  '.kGkkGk.............kGkkGk',
  '.kGGGGk.............kGGGGk',
  '..kkkk...............kkkk',
);

ART.flatbed = mk(40,
  '..........................kkkkkkkkkkkk',
  '.........................kCCCCCCCCCCCk',
  '.........................kCuuuuuuuuuCk',
  '..ssssssssssssssssssss...kCCuuuuuuuCCk',
  '.sSSSSSSSSSSSSSSSSSSSSs..kCCCCCCCCCCCk',
  'ssssssssssssssssssssssss.kCCCCCCCCCCCk',
  'sTTTTTTTTTTTTTTTTTTTTTTs.kCCCCCCCCCCCk',
  'ssssssssssssssssssssssss.kCCCCCCCCCCCk',
  'oooooooooooooooooooooooo.kCCCCCCCCCCCk',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  'kGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGk',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  '..kkkk......kkkk........kkkk....kkkk',
  '.kGGGGk....kGGGGk......kGGGGk..kGGGGk',
  '.kGkkGk....kGkkGk......kGkkGk..kGkkGk',
  '.kGGGGk....kGGGGk......kGGGGk..kGGGGk',
  '..kkkk......kkkk........kkkk....kkkk',
);

ART.mixer = mk(40,
  '.......kkkkkkkkkkkk',
  '.....kkCCCCCCCCCCCCkk',
  '....kCCCCCCCCCCCCCCCCk',
  '...kCCCGCCCGCCCGCCCCCk.....kkkkkkkkkk',
  '..kCCCCGCCCGCCCGCCCCCCk...kCCCCCCCCCCk',
  '..kCCCGCCCGCCCGCCCCCCCk..kCuuuuuuuuuCk',
  '..kCCGCCCGCCCGCCCCCCCCk..kCCuuuuuuuCCk',
  '..kCGCCCGCCCGCCCCCCCCCk..kCCCCCCCCCCCk',
  '...kCCCGCCCGCCCGCCCCCk..kCCCCCCCCCCCCk',
  '....kCCCCCCCCCCCCCCCCk.kCCCCCCCCCCCCCk',
  '.....kkCCCCCCCCCCCCkk..kCCCCCCCCCCCCCk',
  '.......kkkkkkkkkkkk...kCCCCCCCCCCCCCCk',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  'kGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGk',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  '..kkkk.....kkkk......kkkk....kkkk',
  '.kGGGGk...kGGGGk....kGGGGk..kGGGGk',
  '.kGkkGk...kGkkGk....kGkkGk..kGkkGk',
  '.kGGGGk...kGGGGk....kGGGGk..kGGGGk',
  '..kkkk.....kkkk......kkkk....kkkk',
);

ART.dumpster = mk(34,
  '..bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  '.bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb',
  'bBsssBBsssBBBsssBBsssBBBsssBBsssBb',
  'bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb',
  'bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb',
  'bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb',
  'bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb',
  'bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb',
  'bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb',
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  '.kk............................kk',
);

// A crane hook, dangling a bundle of pipe over the route.
ART.craneHook = mk(20,
  '.........k',
  '.........k',
  '.........k',
  '.........k',
  '........kkk',
  '.......kHHHk',
  '.......kHGHk',
  '.......kHHHk',
  '........kkk',
  '.........k',
  '........kkk',
  '.......kH.Hk',
  '.......kH.Hk',
  '.......kHHHk',
  '..kkkkkkkkkkkkkk',
  '.kHHHHHHHHHHHHHHk',
  'kHcGcGcGcGcGcGcHk',
  'kHGcGcGcGcGcGcGHk',
  '.kHHHHHHHHHHHHHHk',
  '..kkkkkkkkkkkkkk',
);

// --- signage and small props -----------------------------------------------

ART.cone = mk(11,
  '....oo',
  '...oooo',
  '...oWWo',
  '..oooooo',
  '..oWWWWo',
  '.oooooooo',
  '.oWWWWWWo',
  'oooooooooo',
  'kkkkkkkkkk',
  '.kkkkkkkk',
);

ART.barrel = mk(14,
  '..ooooooooo',
  '.oCCCCCCCCCo',
  'ooooooooooooo',
  'oWWWWWWWWWWWo',
  'oWWWWWWWWWWWo',
  'ooooooooooooo',
  'ooooooooooooo',
  'oWWWWWWWWWWWo',
  'oWWWWWWWWWWWo',
  'ooooooooooooo',
  'kooooooooooook',
  '.kkkkkkkkkkk',
);

ART.signStay = mk(16,
  '...yyyyyyyyyy',
  '..yyyyyyyyyyyy',
  '.yykkkkkkkkkkyy',
  '.yykWkWkkWkWkyy',
  '.yykWkWkkWkWkyy',
  '.yykkkkkkkkkkyy',
  '.yykWWkkWWkWkyy',
  '..yyyyyyyyyyyy',
  '...yyyyyyyyyy',
  '......GG',
  '......GG',
  '......GG',
  '......GG',
  '.....kkkk',
);

ART.signCaution = mk(16,
  '...yyyyyyyyyy',
  '..yyyyyyyyyyyy',
  '.yykkkkkkkkkkyy',
  '.yykkWWkkWWkkyy',
  '.yykWkkWWkkWkyy',
  '.yykkkkkkkkkkyy',
  '.yykWkWkkWkWkyy',
  '..yyyyyyyyyyyy',
  '...yyyyyyyyyy',
  '......GG',
  '......GG',
  '......GG',
  '......GG',
  '.....kkkk',
);

ART.fence = mk(20,
  'yykkyykkyykkyykkyykk',
  'kkyykkyykkyykkyykkyy',
  'yykkyykkyykkyykkyykk',
  'kkyykkyykkyykkyykkyy',
  'G..................G',
  'G..................G',
  'G..................G',
  'G..................G',
  'G..................G',
  'G..................G',
  'k..................k',
);

ART.floodlight = mk(14,
  '..WWWWWWWWWW',
  '.WWyyyyyyyyWW',
  'WWyyyyyyyyyyWW',
  'WWyyyyyyyyyyWW',
  '.WWyyyyyyyyWW',
  '..GGGGGGGGGG',
  '......GG',
  '......GG',
  '......GG',
  '......GG',
  '......GG',
  '......GG',
  '......GG',
  '.....GGGG',
  '....GG..GG',
  '...GG....GG',
  '..kkk....kkk',
);

ART.portaloo = mk(16,
  '.llllllllllllll',
  'lLLLLLLLLLLLLLLl',
  'lLllllllllllllLl',
  'lLlCCCCCCCCCClLl',
  'lLlCuuuuuuuuClLl',
  'lLlCuuuuuuuuClLl',
  'lLlCCCCCCCCCClLl',
  'lLllllllllllllLl',
  'lLllllllllllllLl',
  'lLlllllllllkllLl',
  'lLllllllllkkllLl',
  'lLlllllllllkllLl',
  'lLllllllllllllLl',
  'lLllllllllllllLl',
  'lLllllllllllllLl',
  'lLLLLLLLLLLLLLLl',
  'kkkkkkkkkkkkkkkk',
  '.kkkkkkkkkkkkkk',
);

ART.sandpile = mk(22,
  '........yyyyyy',
  '......yyYYYYYYyy',
  '....yyYYYYYYYYYYyy',
  '..yyYYYYYYYYYYYYYYyy',
  '.yYYYYYYYYYYYYYYYYYYy',
  'yYYYYYYYYYYYYYYYYYYYYy',
  'yYYYYYYYYYYYYYYYYYYYYy',
  'kYYYYYYYYYYYYYYYYYYYYk',
  '.kkkkkkkkkkkkkkkkkkkk',
);

ART.cooler = mk(14,
  '..CCCCCCCCCC',
  '.CWWWWWWWWWWC',
  'CCCCCCCCCCCCCC',
  'CbbbbbbbbbbbbC',
  'CbbbbbbbbbbbbC',
  'CbbbbbbbbbbbbC',
  'CCCCCCCCCCCCCC',
  'kkkkkkkkkkkkkk',
);

ART.toolbox = mk(14,
  '.....GG',
  '....GGGG',
  '..RRRRRRRRRR',
  '.RRRRRRRRRRRR',
  'RRRRRRRRRRRRRR',
  'RRRRkkkkkkRRRR',
  'RRRRRRRRRRRRRR',
  'kkkkkkkkkkkkkk',
);

ART.pipeLong = mk(34,
  '..HHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
  '.HGcccccccccccccccccccccccccccGH',
  'HGccccccccccccccccccccccccccccGH',
  '.HGGGGGGGGGGGGGGGGGGGGGGGGGGGGH',
  '..HHHHHHHHHHHHHHHHHHHHHHHHHHHH',
);

// --- ground decals ---------------------------------------------------------

ART.pothole = mk(18,
  '.....kkkkkkk',
  '..kkkddddddkkk',
  '.kkddddddddddkk',
  'kkddddddddddddkk',
  'kdddddddddddddkk',
  '.kkddddddddddkk',
  '..kkkddddddkkk',
  '....kkkkkkkk',
);

ART.puddle = mk(22,
  '.....vvvvvvvv',
  '..vvvbbbbbbbbvvv',
  '.vvbbbbuubbbbbbvv',
  'vvbbbbbbbbbbbbbbvv',
  'vbbbbbbbbbbbbbbbbv',
  '.vvbbbbbbbbbbbbvv',
  '..vvvbbbbbbbbvvv',
  '.....vvvvvvvv',
);

ART.gravel = mk(26,
  '..c..c...c..c....c..c',
  '.c.cc..c..c..cc.c..cc',
  'c..c..cc..c.c..c..c..c',
  '.cc..c..c..cc..c.c..c',
  '..c.c..cc..c..cc..c.c',
  '.c..cc..c..c.c....c..c',
);

ART.wetPatch = mk(26,
  '...vvvvvvvvvvvvvvvv',
  '.vvbbbbbbbbbbbbbbbbvv',
  'vbbbbbbbbbbbbbbbbbbbbv',
  'vbbbbbbbbbbbbbbbbbbbbv',
  '.vvbbbbbbbbbbbbbbbbvv',
  '...vvvvvvvvvvvvvvvv',
);

// --- power ups -------------------------------------------------------------

ART.puSpeed = mk(16,
  '.....bbbbbb',
  '...bbuuuuubb',
  '..buuuuuuuuub',
  '.buuuuuuuuuuub',
  'bWWbuuuuuuuuub',
  'oWWobbbbbbbbbb',
  'ooooooookkkkkk',
  '.oooooo',
  '..oooo',
  '...oo',
);

ART.puPapers = mk(16,
  '..WWWWWWWWWW',
  '.WCCCCCCCCCCW',
  'WCCCCCCCCCCCCW',
  'WCkkkkkkkkkCCW',
  'WCCCCCCCCCCCCW',
  'WCkkkkkkkkkCCW',
  'WCCCCCCCCCCCCW',
  'WCkkkkkkkkkCCW',
  'WCCCCCCCCCCCCW',
  '.WWWWWWWWWWWW',
  '..kkkkkkkkkk',
);

ART.puVest = mk(14,
  '..llllllllll',
  '.llllllllllll',
  'lll..llllll..l',
  'llll.llllll.ll',
  'llWWllllllWWll',
  'llWWllllllWWll',
  'llllllllllllll',
  'llWWWWWWWWWWll',
  'llllllllllllll',
  '.llllllllllll',
  '..kkkkkkkkkk',
);

ART.puConfusion = mk(16,
  '...y......y',
  '..y.y....y.y',
  '....y......y',
  '...y......y',
  '...y......y',
  '',
  '...y......y',
  '.....kkkk',
  '....kCCCCk',
  '...kCCCCCCk',
  '..kkkkkkkkkk',
  '....kffffk',
  '....kfFFfk',
  '..kllllllllk',
  '..kllllllllk',
  '..kkkkkkkkkk',
);

ART.puBomba = mk(16,
  '......kkkk',
  '....kkCCCCkk',
  '...kCCCCCCCCk',
  '..kkkkkkkkkkkk',
  '....eeeeeeee',
  '....ekkkkkke',
  '....eeeeeeee',
  '....hhhhhhhh',
  '...oooooooooo',
  '..oooooooooooo',
  '..oWWooooooWWo',
  '..oooooooooooo',
  '...oooooooooo',
  '....kkkkkkkk',
);

// --- effects ---------------------------------------------------------------

ART.sheet = mk(9,
  '.WWWWWW',
  'WCCCCCCW',
  'WCkkkkCW',
  'WCCCCCCW',
  'WCkkkkCW',
  '.WWWWWW',
);

ART.puff = mk(14,
  '...cc..cc',
  '..cCCccCCc',
  '.cCCCCCCCCc',
  'cCCCCCCCCCCc',
  'cCCCCCCCCCCc',
  '.cCCCCCCCCc',
  '..cCCccCCc',
  '...cc..cc',
);

ART.spark = mk(11,
  '.....y',
  '..y..y..y',
  '...yWyWy',
  '....yWy',
  'yyyWWWWWyy',
  '....yWy',
  '...yWyWy',
  '..y..y..y',
  '.....y',
);

ART.star = mk(11,
  '....y',
  '....y',
  '..yyyyy',
  '.yyyWyyy',
  'yyyWWWyyy',
  '.yyyWyyy',
  '..yyyyy',
  '...y.y',
  '..y...y',
);

ART.arrow = mk(13,
  '.....o',
  '....ooo',
  '...ooWoo',
  '..ooWWWoo',
  '.ooWWWWWoo',
  'ooooWWWoooo',
  '....WWW',
  '....WWW',
  '.....o',
);

ART.splash = mk(14,
  '.u..u....u',
  '..u..u..u',
  '.uubbbbuu',
  'uubbbbbbuu',
  '.uubbbbuu',
  '..uuuuuu',
);

// --- derived sprites -------------------------------------------------------

/** Shear the cab of the cart against its wheels to fake a steering pose. */
function steer(rows, dx) {
  return rows.map((row, i) => {
    if (i > 16) return row;
    const pad2 = '.'.repeat(Math.abs(dx));
    return dx < 0 ? row.slice(Math.abs(dx)) + pad2 : pad2 + row.slice(0, row.length - dx);
  });
}

function recolor(rows, map) {
  return rows.map((row) => row.replace(/./g, (ch) => map[ch] || ch));
}

ART.cartLeft = steer(ART.cart, -1);
ART.cartRight = steer(ART.cart, 1);
ART.cartWreck = recolor(steer(ART.cart, 1), { m: 'G', M: 'H', n: 'g', N: 'g', o: 'R' });

// Hard-hat and vest swaps give a site full of different people for free.
const hatYellow = { C: 'y' };
const hatOrange = { C: 'o' };
const vestOrange = { l: 'o', W: 'W' };
const skinDark = { f: 'e', F: 'E' };

ART.workerY = recolor(ART.worker, hatYellow);
ART.workerO = recolor(ART.worker, hatOrange);
ART.workerDark = recolor(recolor(ART.worker, skinDark), hatYellow);
ART.workerOrangeVest = recolor(ART.worker, vestOrange);
ART.workerCheerY = recolor(ART.workerCheer, hatYellow);
ART.workerCheerO = recolor(recolor(ART.workerCheer, hatOrange), skinDark);
ART.workerPhoneY = recolor(ART.workerPhone, hatYellow);
ART.workerRadioO = recolor(ART.workerRadio, hatOrange);
ART.workerMeasure = recolor(ART.workerRadio, { ...hatYellow, u: 'y' });

// --- baking ----------------------------------------------------------------

const cache = new Map();

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function bake(name, { flip = false, tint = null } = {}) {
  const key = `${name}|${flip ? 1 : 0}|${tint || ''}`;
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
  if (!rows) throw new Error(`unknown sprite "${name}"`);
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
