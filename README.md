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

Clear a shift by delivering to the quota of crews before the gate. Hit quality
matters: a sheet on the chest is a bullseye and scores 2.5×, one that lands at
their feet is a whisper and garbles the story. Combos build across consecutive
deliveries and die on a crash. Between shifts you take one thing from the site
stores.

## Layout

```
index.html          boot + canvas
src/engine/         loop (fixed 60Hz), input, procedural audio, seeded rng
src/art/            pixel sprites, 5x7 font, the sprite/footprint registry
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
node tools/rr-progress.mjs     # build progress/rumor-run.html from the results
npm run check                  # all four, in order
```

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
