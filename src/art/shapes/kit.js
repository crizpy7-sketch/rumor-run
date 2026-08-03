// Shared drawing kit for the vector sprite sources.
//
// Sprites here are drawn with real geometry — arcs, beziers, gradients — in
// target-pixel coordinates with sub-pixel precision, then supersampled and
// quantised onto the palette by tools/genart.mjs. Hand-placing characters in an
// ASCII grid cannot make a round wheel or a domed hard hat; this can, and the
// output is still palette-locked pixel art with hard edges.
//
// Coordinates are in final pixels. Fractions are not only allowed, they are the
// point: a brim edge at y=3.4 lands differently from one at y=3.0 once the
// supersampler averages it down.

export const TAU = Math.PI * 2;

/** Rounded rectangle path. */
export function rr(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.lineTo(x + w - k, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + k);
  ctx.lineTo(x + w, y + h - k);
  ctx.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  ctx.lineTo(x + k, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - k);
  ctx.lineTo(x, y + k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.closePath();
}

export function fillRR(ctx, c, x, y, w, h, r) {
  ctx.fillStyle = c;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
}

export function ellipse(ctx, c, cx, cy, rx, ry) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.fill();
}

/** A wheel: tyre, rim, hub — actually round, which an ASCII grid cannot do. */
export function wheel(ctx, P, cx, cy, r, hub = P.y) {
  ellipse(ctx, P.k, cx, cy, r, r);
  ellipse(ctx, P.g, cx, cy, r * 0.72, r * 0.72);
  ellipse(ctx, hub, cx, cy, r * 0.38, r * 0.38);
  ellipse(ctx, P.k, cx, cy, r * 0.16, r * 0.16);
}

/** A hard hat: dome plus brim, with a highlight along the crown. */
export function hardHat(ctx, P, cx, cy, w, shell) {
  const r = w / 2;
  // Brim, an ellipse wider than the dome.
  ellipse(ctx, P.k, cx, cy, r * 1.18, r * 0.42);
  ellipse(ctx, shell, cx, cy - 0.3, r * 1.1, r * 0.34);
  // Dome.
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 1.05, 0, Math.PI, TAU);
  ctx.fill();
  // Crown highlight and a shadow under the near edge.
  ctx.fillStyle = P.W;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.28, cy - r * 0.5, r * 0.3, r * 0.34, -0.5, Math.PI, TAU);
  ctx.fill();
  ctx.strokeStyle = P.k;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 1.05, 0, Math.PI, TAU);
  ctx.stroke();
}

/** A body in a hi-viz vest: shoulders, taper, two reflective bands. */
export function vestBody(ctx, P, cx, top, w, h, vest) {
  const half = w / 2;
  ctx.fillStyle = P.k;
  ctx.beginPath();
  ctx.moveTo(cx - half, top + h);
  ctx.lineTo(cx - half * 0.92, top + h * 0.28);
  ctx.quadraticCurveTo(cx - half * 0.85, top - 0.4, cx - half * 0.42, top);
  ctx.lineTo(cx + half * 0.42, top);
  ctx.quadraticCurveTo(cx + half * 0.85, top - 0.4, cx + half * 0.92, top + h * 0.28);
  ctx.lineTo(cx + half, top + h);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = vest;
  ctx.fillRect(cx - half, top - 1, w, h + 2);
  // Reflective bands.
  ctx.fillStyle = P.W;
  ctx.fillRect(cx - half, top + h * 0.34, w, h * 0.16);
  ctx.fillRect(cx - half * 0.55, top, w * 0.16, h);
  ctx.fillRect(cx + half * 0.39, top, w * 0.16, h);
  // Shade down the right side so the torso has volume.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(cx + half * 0.35, top - 1, half * 0.7, h + 2);
  ctx.restore();
}

export function head(ctx, P, cx, cy, r, skin, shade) {
  ellipse(ctx, P.k, cx, cy, r + 0.55, r + 0.55);
  ellipse(ctx, skin, cx, cy, r, r);
  ellipse(ctx, shade, cx + r * 0.42, cy + r * 0.12, r * 0.55, r * 0.8);
}

export function legs(ctx, P, cx, top, w, h, cloth) {
  const half = w / 2;
  fillRR(ctx, P.k, cx - half, top, w, h, 0.8);
  ctx.fillStyle = cloth;
  ctx.fillRect(cx - half + 0.7, top + 0.6, half - 1.1, h - 1.8);
  ctx.fillRect(cx + 0.4, top + 0.6, half - 1.1, h - 1.8);
  // Boots.
  ctx.fillStyle = P.k;
  ctx.fillRect(cx - half - 0.4, top + h - 2.2, w + 0.8, 2.2);
}

