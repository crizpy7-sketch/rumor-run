// A 5x7 pixel font, authored by hand. Shared by the game (canvas) and the
// progress page generator (which runs in node and emits HTML), so this module
// must never touch the DOM at import time.

export const GLYPH_W = 5;
export const GLYPH_H = 7;
export const ADVANCE = 6;

const G = {
  ' ': '..... ..... ..... ..... ..... ..... .....',
  A: '.###. #...# #...# ##### #...# #...# #...#',
  B: '####. #...# #...# ####. #...# #...# ####.',
  C: '.###. #...# #.... #.... #.... #...# .###.',
  D: '####. #...# #...# #...# #...# #...# ####.',
  E: '##### #.... #.... ####. #.... #.... #####',
  F: '##### #.... #.... ####. #.... #.... #....',
  G: '.###. #...# #.... #..## #...# #...# .###.',
  H: '#...# #...# #...# ##### #...# #...# #...#',
  I: '.###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.',
  J: '..### ...#. ...#. ...#. ...#. #..#. .##..',
  K: '#...# #..#. #.#.. ##... #.#.. #..#. #...#',
  L: '#.... #.... #.... #.... #.... #.... #####',
  M: '#...# ##.## #.#.# #.#.# #...# #...# #...#',
  N: '#...# ##..# #.#.# #.#.# #..## #...# #...#',
  O: '.###. #...# #...# #...# #...# #...# .###.',
  P: '####. #...# #...# ####. #.... #.... #....',
  Q: '.###. #...# #...# #...# #.#.# #..#. .##.#',
  R: '####. #...# #...# ####. #.#.. #..#. #...#',
  S: '.#### #.... #.... .###. ....# ....# ####.',
  T: '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..',
  U: '#...# #...# #...# #...# #...# #...# .###.',
  V: '#...# #...# #...# #...# #...# .#.#. ..#..',
  W: '#...# #...# #...# #.#.# #.#.# ##.## #...#',
  X: '#...# #...# .#.#. ..#.. .#.#. #...# #...#',
  Y: '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..',
  Z: '##### ....# ...#. ..#.. .#... #.... #####',
  0: '.###. #...# #..## #.#.# ##..# #...# .###.',
  1: '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.',
  2: '.###. #...# ....# ...#. ..#.. .#... #####',
  3: '####. ....# ....# .###. ....# ....# ####.',
  4: '...#. ..##. .#.#. #..#. ##### ...#. ...#.',
  5: '##### #.... ####. ....# ....# #...# .###.',
  6: '..##. .#... #.... ####. #...# #...# .###.',
  7: '##### ....# ...#. ..#.. .#... .#... .#...',
  8: '.###. #...# #...# .###. #...# #...# .###.',
  9: '.###. #...# #...# .#### ....# ...#. .##..',
  '.': '..... ..... ..... ..... ..... .##.. .##..',
  ',': '..... ..... ..... ..... .##.. .##.. .#...',
  '!': '..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..',
  '?': '.###. #...# ....# ...#. ..#.. ..... ..#..',
  ':': '..... ..#.. ..#.. ..... ..#.. ..#.. .....',
  ';': '..... ..#.. ..#.. ..... ..#.. ..#.. .#...',
  "'": '..#.. ..#.. ..... ..... ..... ..... .....',
  '"': '.#.#. .#.#. ..... ..... ..... ..... .....',
  '-': '..... ..... ..... ##### ..... ..... .....',
  '_': '..... ..... ..... ..... ..... ..... #####',
  '+': '..... ..#.. ..#.. ##### ..#.. ..#.. .....',
  '=': '..... ..... ##### ..... ##### ..... .....',
  '/': '....# ....# ...#. ..#.. .#... #.... #....',
  '\\': '#.... #.... .#... ..#.. ...#. ....# ....#',
  '(': '...#. ..#.. .#... .#... .#... ..#.. ...#.',
  ')': '.#... ..#.. ...#. ...#. ...#. ..#.. .#...',
  '[': '..##. ..#.. ..#.. ..#.. ..#.. ..#.. ..##.',
  ']': '.##.. ..#.. ..#.. ..#.. ..#.. ..#.. .##..',
  '<': '...#. ..#.. .#... #.... .#... ..#.. ...#.',
  '>': '.#... ..#.. ...#. ....# ...#. ..#.. .#...',
  '%': '##..# ##.#. ..#.. ..#.. .#... #.##. #..##',
  '*': '..... #.#.# .###. ##### .###. #.#.# .....',
  '#': '.#.#. ##### .#.#. ##### .#.#. ..... .....',
  '@': '.###. #...# #.### #.#.# #.### #.... .###.',
  '&': '.##.. #..#. .##.. .##.# #..#. #..#. .##.#',
  '^': '..#.. .#.#. #...# ..... ..... ..... .....',
  '~': '..... .##.# #..#. ..... ..... ..... .....',
};

// Expand "row row row ..." into an array of 7 strings.
const GLYPHS = {};
for (const [ch, spec] of Object.entries(G)) GLYPHS[ch] = spec.split(' ');

export { GLYPHS };

export function glyphFor(ch) {
  return GLYPHS[ch] || GLYPHS[ch.toUpperCase()] || GLYPHS['?'];
}

export function textWidth(str, { scale = 1, tracking = 0 } = {}) {
  if (!str.length) return 0;
  return (str.length * (ADVANCE + tracking) - (1 + tracking)) * scale;
}

/**
 * Draw uppercase pixel text onto a 2d context, snapped to whole pixels.
 * `align` is 'left' | 'center' | 'right'.
 */
export function drawText(ctx, str, x, y, {
  color = '#fdf6e0',
  scale = 1,
  align = 'left',
  tracking = 0,
  shadow = null,
} = {}) {
  const s = String(str).toUpperCase();
  const w = textWidth(s, { scale, tracking });
  let px = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
  const py = Math.round(y);

  if (shadow) {
    drawText(ctx, s, px + scale, py + scale, { color: shadow, scale, align: 'left', tracking });
  }

  ctx.fillStyle = color;
  for (let i = 0; i < s.length; i++) {
    const rows = glyphFor(s[i]);
    for (let ry = 0; ry < GLYPH_H; ry++) {
      const row = rows[ry];
      let run = 0;
      for (let rx = 0; rx <= GLYPH_W; rx++) {
        const on = rx < GLYPH_W && row[rx] === '#';
        if (on) { run++; continue; }
        if (run) {
          ctx.fillRect(px + (rx - run) * scale, py + ry * scale, run * scale, scale);
          run = 0;
        }
      }
    }
    px += (ADVANCE + tracking) * scale;
  }
  return w;
}

/** Word-wrap to a pixel width, returning lines. */
export function wrapText(str, maxWidth, { scale = 1, tracking = 0 } = {}) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const cand = line ? `${line} ${word}` : word;
    if (textWidth(cand, { scale, tracking }) <= maxWidth || !line) line = cand;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Render a headline as standalone HTML (a grid of divs). Used by the progress
 * page so the page and the game share exactly one set of letterforms.
 */
export function pixelTitle(str, { px = 4, color = '#ffd24a', gap = 1 } = {}) {
  const s = String(str).toUpperCase();
  const cells = [];
  let x = 0;
  let maxX = 0;
  for (const ch of s) {
    const rows = glyphFor(ch);
    for (let ry = 0; ry < GLYPH_H; ry++) {
      for (let rx = 0; rx < GLYPH_W; rx++) {
        if (rows[ry][rx] === '#') {
          cells.push(`<i style="left:${(x + rx) * px}px;top:${ry * px}px"></i>`);
          maxX = Math.max(maxX, x + rx + 1);
        }
      }
    }
    x += ADVANCE;
  }
  const w = maxX * px;
  const h = GLYPH_H * px;
  return `<div class="pixtitle" style="width:${w}px;height:${h}px;--px:${px}px;--pc:${color};--gap:${gap}px">${cells.join('')}</div>`;
}

export const PIXTITLE_CSS = `
.pixtitle { position: relative; }
.pixtitle i {
  position: absolute;
  width: var(--px); height: var(--px);
  background: var(--pc);
}`;
