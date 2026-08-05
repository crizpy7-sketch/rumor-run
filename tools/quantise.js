// Turning an arbitrary image into palette rows.
//
// This is a browser module on purpose — it needs a real canvas to decode a PNG
// and resample it. Both `tools/importart.mjs` and `tools/img2threejs.mjs`
// import it inside a Playwright page rather than each rolling their own, so
// there is exactly one answer to "what colour is this pixel in game terms".
//
// Two ideas do all the work:
//
//   The palette snap uses luminance-weighted distance, not plain RGB distance.
//   Eyes read brightness first, so a wrong-but-equally-bright colour is far
//   less noticeable than a right-hue-but-wrong-brightness one. Weighting green
//   heaviest and blue lightest is what stops mid-tones collapsing into mud.
//
//   The downscale is a box filter over premultiplied alpha. Averaging straight
//   RGBA lets fully transparent pixels — which are usually black — drag the
//   edges of a sprite dark. Premultiplying means a transparent neighbour
//   contributes nothing instead of contributing black.

/** Build a `(r,g,b) -> palette key` function for a palette of hex strings. */
export function snapper(PAL) {
  const keys = Object.keys(PAL);
  const rgb = keys.map((k) => {
    const h = PAL[k];
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  });
  return (r, g, b) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < rgb.length; i++) {
      const dr = (r - rgb[i][0]) * 0.5;
      const dg = (g - rgb[i][1]) * 0.7;
      const db = (b - rgb[i][2]) * 0.3;
      const d = dr * dr + dg * dg + db * db;
      if (d < bestD) { bestD = d; best = i; }
    }
    return keys[best];
  };
}

/** Load an image by URL, rejecting rather than hanging on a bad path. */
export function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`could not load ${src}`));
    img.src = src;
  });
}

/**
 * The bounding box of everything that is not transparent. Generated images
 * almost always arrive with uneven padding, so the artwork has to declare its
 * own bounds rather than trusting the frame it came in.
 *
 * Returns `{ x0, y0, w, h, trimmed }`, where `trimmed` is false when the image
 * has no transparent margin at all — the usual sign of a baked-in background.
 */
export function opaqueBounds(img) {
  const probe = document.createElement('canvas');
  probe.width = img.naturalWidth;
  probe.height = img.naturalHeight;
  const ctx = probe.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, probe.width, probe.height).data;
  let x0 = probe.width; let y0 = probe.height; let x1 = -1; let y1 = -1;
  for (let y = 0; y < probe.height; y++) {
    for (let x = 0; x < probe.width; x++) {
      if (d[((y * probe.width) + x) * 4 + 3] > 12) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < x0 || y1 < y0) {
    return { x0: 0, y0: 0, w: probe.width, h: probe.height, trimmed: false };
  }
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  return { x0, y0, w, h, trimmed: w < probe.width || h < probe.height };
}

/**
 * Image -> rows of palette keys, `.` for transparent.
 *
 * `targetH` sets the height; the width follows from the trimmed aspect ratio,
 * so nothing is ever squashed. `alphaCut` is where a pixel stops existing, and
 * `ssMin` is the minimum supersample factor — small sprites get more, because
 * a 12px-tall result resampled 1:1 keeps every source artefact.
 */
export async function imageToRows(src, { targetH = 24, alphaCut = 0.45, ssMin = 2, snap }) {
  const img = await loadImage(src);
  const box = opaqueBounds(img);
  const targetW = Math.max(1, Math.round(box.w * (targetH / box.h)));

  // Draw big, then box-filter down. Letting the browser scale straight to the
  // target leaves soft edges that quantise into mud.
  const ss = Math.max(ssMin, Math.ceil(64 / targetH));
  const cv = document.createElement('canvas');
  cv.width = targetW * ss;
  cv.height = targetH * ss;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, box.x0, box.y0, box.w, box.h, 0, 0, cv.width, cv.height);

  const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const rows = [];
  for (let y = 0; y < targetH; y++) {
    let row = '';
    for (let x = 0; x < targetW; x++) {
      let r = 0; let g = 0; let b = 0; let a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const i = (((y * ss + sy) * cv.width) + (x * ss + sx)) * 4;
          const al = data[i + 3] / 255;
          r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al; a += al;
        }
      }
      if (a / (ss * ss) < alphaCut) { row += '.'; continue; }
      row += snap(r / a, g / a, b / a);
    }
    rows.push(row);
  }

  return {
    rows,
    source: `${img.naturalWidth}x${img.naturalHeight}`,
    cropped: `${box.w}x${box.h}`,
    result: `${targetW}x${targetH}`,
    trimmed: box.trimmed,
  };
}
