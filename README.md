# Rumor Run

Deliver the rumors. Dodge the drama. Pick up Bomba.

An original arcade game. Federico drives a site buggy along an angled jobsite
route, throwing rolled-up gossip sheets at the crews working either side. The
story mutates as it travels — throw clean and the detail survives, throw from
the far shoulder and by the eighth shift nobody is sure whether it was a boat
or a goat. Bomba is waiting at the far gate either way.

No build step, no framework. Serve the folder and it runs.

## Play

```sh
node tools/serve.mjs        # http://localhost:8123
```

| Key | |
| --- | --- |
| Arrows / WASD | drive — up is the throttle, down is the brake |
| Q or Z | throw left |
| E or X | throw right |
| Space | throw at the nearest crew |
| P | pause · M mute |

On a phone or tablet the game switches to on-screen controls by itself: two
steer pads, a slow button, and a throw button per side. The throttle holds
itself there — no thumb is spare for it — and tapping the picture is "confirm",
so the menus need no button of their own. Portrait stacks the picture over a
control deck like a handheld; landscape floats the buttons onto the letterbox
bars either side of the 4:3 picture, clear of the road.

Clear a shift by delivering to the quota of crews before the gate. Hit quality
matters: a sheet on the chest is a bullseye and scores 2.5×, one that lands at
their feet is a whisper and garbles the story. Combos build across consecutive
deliveries and die on a crash. Between shifts you take one thing from the site
stores.

## Layout

```
index.html          boot + canvas
src/engine/         loop (fixed 60Hz), input, procedural audio, seeded rng
src/art/shapes.js   vector sources — curves, arcs, gradients
src/art/generated.js compiled pixel rows (generated, do not hand-edit)
src/art/            hand-authored sprites, 5x7 font, sprite/footprint registry
src/game/road.js    road-space projection and the per-row surface scan
src/game/play.js    driving, throwing, collisions, scoring
src/game/levels.js  the eight shifts, the catalogue, route generation
src/game/rumor.js   the rumour chain and every bark on site
src/game/screens.js title, brief, results, stores, ending
tools/              static server, capture harness, autopilot, progress page
```

`CONTRACTS.md` holds the fixed decisions — screen size, road-space units,
ownership, and the feel targets the harness measures.

## Harness

```sh
npm test                       # data checks, no browser, under a second
node tools/playtest.mjs        # autopilot plays all eight shifts -> shots/playtest.json
node tools/shoot.mjs           # screenshot tour of every screen -> shots/rr-tour/
node tools/shoot.mjs --level 6 # start the tour on a given shift
node tools/shoot.mjs --mobile  # phone viewport + real touch -> shots/rr-mobile/
node tools/genart.mjs          # compile src/art/shapes.js -> src/art/generated.js
node tools/importart.mjs       # quantise art-in/*.png -> src/art/imported.js
node tools/artsheet.mjs        # every sprite at 4x -> shots/art-sheet.png
node tools/rr-progress.mjs     # build progress/rumor-run.html from the results
npm run check                  # all four, in order
```

Art comes from two places. Small props are hand-authored grids; anything that
needs a curve — a wheel, a hard hat dome, a tapering cone — is drawn with real
geometry in `src/art/shapes.js` and compiled down onto the palette by
`tools/genart.mjs`. The compiled rows are committed, so the node verifier can
check them and there is no cost at runtime. `tools/artsheet.mjs` is how the art
gets looked at: a 22px sprite cannot be judged from a gameplay screenshot.

Artwork made outside the repo comes in through a third door: drop a PNG named
after a sprite into `art-in/` and `tools/importart.mjs` trims it, scales it to
the size the game already draws that sprite at, and snaps every pixel onto the
same palette. The point is consistency — a jobsite built from sources that each
brought their own colours, light direction and anti-aliasing looks like a
collage no matter how good the individual pieces are. `art-in/README.md` has
the image spec and a prompt to hand an image model.

`tools/verify.mjs` asserts properties of the shipped data: the font and sprites
are well formed, every sprite gameplay can draw is pinned with a footprint, no
line of text is too long for the panel it appears in, and 64 generated routes
all leave a drivable line and an open delivery lane.

`tools/playtest.mjs` exits non-zero if the game throws or if any shift cannot be
cleared by the autopilot in `tools/bot.js`. A level nobody can clear is a bug,
not a difficulty setting. It runs at 4× by default (same fixed 1/60 step, more
steps per frame); pass `--realtime` to watch it honestly, `--seed <name>` for a
different jobsite, `--levels <n>` to stop early.

Both browser tools use `CHROME_PATH` if set, the preinstalled Chromium at
`/opt/pw-browsers/chromium` if it exists, and otherwise whatever Playwright
downloaded. CI in `.github/workflows/checks.yml` runs all of it on every push.

## Publishing

GitHub Pages serves this repository's root from `main`, so merging publishes
the game at <https://crizpy7-sketch.github.io/rumor-run/>. There is nothing to
build — `index.html` and `src/` are the site.
