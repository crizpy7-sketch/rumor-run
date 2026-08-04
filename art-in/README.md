# art-in/ — dropping outside artwork into the game

Put a PNG named after a sprite in this folder, run the importer, and it
replaces that sprite everywhere in the game:

```sh
node tools/importart.mjs --list     # every sprite name and the size it draws at
node tools/importart.mjs            # import every PNG in this folder
node tools/artsheet.mjs             # look at the result before trusting it
```

The importer trims the transparent margin, scales the image to the height the
game already uses for that name, box-filters it down with premultiplied alpha,
and snaps every pixel to the game's 35-colour palette. Output lands in
`src/art/imported.js`, which overrides both the hand-typed sprites and the
vector-drawn ones. Delete the PNG and re-run to go back.

Nothing else changes. Hitboxes, anchors and road-space footprints live in
`src/art/names.js` and are not touched by an import — a new sprite that is
visually twice the size of the old one will still *collide* at the old size.
If you want the footprint to change too, change it there.

Two consequences of the trim worth knowing. The bottom edge of the artwork
becomes the ground contact point, so anything that should look like it is
standing needs its feet at the bottom of the drawn shape, not floating. And
the width follows from the aspect ratio after trimming, so a sprite drawn
off-centre in its frame comes in off-centre too — the frame is ignored, only
the shape counts.

## Why the palette snap exists

The game looks coherent for boring reasons: one palette, one light direction,
one scale, hard edges, no baked shadows. Art generated somewhere else arrives
anti-aliased, at its own size, with its own colours and usually its own drop
shadow. Ten individually prettier sprites that disagree with each other look
worse than what is there now. The snap forces every source through the same
35 colours, which is most of what makes a jobsite look like one jobsite.

It cannot fix everything. It cannot remove a baked-in background, straighten a
wrong camera angle, or move a light source. Those have to be right in the
image.

## What the image has to look like

- **Transparent background.** Not white, not a checkerboard, not "a plain
  background" — a real alpha channel. The importer warns if it finds no
  transparent margin, because a baked background imports as a solid rectangle.
- **One object, centred, filling the frame.** No ground plane, no scene, no
  props beside it, no caption, no border.
- **No drop shadow.** The game draws its own contact shadow at runtime; a
  second one baked into the sprite reads as dirt.
- **Flat, hard-edged shading.** Two to four tones per material. No gradients,
  no airbrush, no glow, no bloom, no outline blur.
- **Light from the upper left**, consistently, on every sprite.
- **Square-on elevation, very slightly from above.** People face the viewer.
  Vehicles and machines are seen from the side with a slight downward tilt —
  enough to see a little of the top surface, not a top-down or isometric view.
- **512×512 or larger** is plenty. It gets scaled down hard; detail below about
  1/20th of the sprite's height will not survive.
- **Dark outline** around the silhouette, roughly `#14121a`.

## Palette

Anything outside this gets snapped to the nearest entry, so drawing close to
it up front avoids surprises:

```
ink/outline   #14121a #241f2c
metal         #3a3646 #5c5768 #8b8598 #a9a2b4
concrete      #d8d3dd #fdf6e0
cart cream    #8a7d63 #b3a488 #d9cdb0 #f0e6cc
hi-viz        #ffd24a #c99a1e #8a6410 #ff7a3d #c8511f #c8e04a #8fa62c
blue/denim    #4d86c6 #2f5f96 #2a4a6a #7fb0e0
timber        #a97c46 #7a5730 #55381d
skin          #e8b48a #b57a4f #a9714a #7d4f31
hair          #2b2028
accents       #8f3418 #b8342a #d46aa0 #6ec48a #7a4a2c
```

## A prompt you can paste

Replace the first line with the thing you actually want; leave the rest alone.

> A single orange site forklift, side view.
>
> Style: retro pixel-art game sprite, flat hard-edged cel shading with 2–4
> tones per material, a dark `#14121a` outline around the silhouette, light
> coming from the upper left. Square-on side elevation tilted very slightly
> downward so a little of the top surface shows — not isometric, not top-down,
> no perspective distortion.
>
> Composition: the object alone, centred, filling the frame. Fully transparent
> background — alpha channel, not a white or coloured fill. No ground, no
> shadow, no reflection, no scene, no text, no border, no extra objects.
>
> No gradients, no soft anti-aliasing, no glow, no bloom, no texture noise.
>
> Colours limited to: #14121a #241f2c #3a3646 #5c5768 #8b8598 #a9a2b4 #d8d3dd
> #fdf6e0 #8a7d63 #b3a488 #d9cdb0 #f0e6cc #ffd24a #c99a1e #8a6410 #ff7a3d
> #c8511f #c8e04a #8fa62c #4d86c6 #2f5f96 #2a4a6a #7fb0e0 #a97c46 #7a5730
> #55381d #e8b48a #b57a4f #a9714a #7d4f31 #2b2028 #8f3418 #b8342a #d46aa0
> #6ec48a #7a4a2c
>
> Output: PNG with transparency, at least 512×512.

Ask for one object per image. A sheet of several sprites in one picture has to
be cut up by hand before the importer can use it, and the pieces will not be
consistently scaled.

## Judge it on the sheet, not in the folder

An import that looks great at 512px can turn to mud at 24px — this is normal
and it is why `tools/artsheet.mjs` exists. Generate, import, look at the sheet
next to its neighbours, and keep the one that reads better *small*. Legibility
at the size it actually draws beats detail every time.
