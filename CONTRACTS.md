# Rumor Run — contracts

Fixed decisions. Anything below is safe to build on; changing one means changing
every file that depends on it, on purpose, in one go.

## The game

Federico drives a site buggy along an angled jobsite route and throws rolled-up
gossip sheets at the crews on either side. The rumour mutates as it travels. At
the far gate of the eighth shift, Bomba is waiting.

Humour rules: the jobsite is affectionate, never cruel. Nobody gets hurt, nobody
is the butt of it, and the worst thing that happens to anyone is a spilled
coffee. The rumour is about a boat. Possibly a goat.

## Screen and time

| Thing | Value | Why |
| --- | --- | --- |
| Canvas | 288 × 216, integer-scaled | 4:3 gives an angled route the vertical room it needs to telegraph hazards |
| Update | fixed 1/60 s | every tuning number means the same thing on every machine |
| Render | once per animation frame | |
| Colour | palette in `src/art/sprites.js` (`PAL`) | sprites may only use declared keys |

## Road space

The world is `(s, t)`: metres along the route, metres across it. `t = 0` is the
centre line, positive is the driver's right.

| Constant | Value |
| --- | --- |
| Route angle | 0.36 rad off vertical |
| Pixels per metre | 4.2 |
| Paved half-width | 5.5 m |
| Shoulder | 3.0 m each side |
| Buggy lateral limit | ±7.9 m |
| Crews stand at | 9.3 – 10.9 m from the centre |
| Base throw range | 10 m |

The projection is a fixed oblique with no perspective scaling. It is inverted
**per screen row** (`Road.centreX`), never rasterised as one rectangle per
metre — that is what keeps the diagonal edges clean instead of stepped.

## Ownership

| Area | Files |
| --- | --- |
| Engine | `src/engine/*` — loop, input, audio, rng |
| Art | `src/art/*` — sprites, font, and the sprite/footprint registry |
| Vector art | `src/art/shapes.js` drawn with curves, compiled to `generated.js` |
| Imported art | `art-in/*.png` quantised onto `PAL`, compiled to `imported.js` |
| Projection | `src/game/road.js` |
| Route data | `src/game/levels.js` |
| Driving, throwing, collisions, scoring | `src/game/play.js` |
| Chrome | `src/game/hud.js`, `src/game/screens.js` |
| Story | `src/game/rumor.js` |
| Harness | `tools/*` |

`src/art/names.js` pins every sprite name **and** its road-space hitbox.
Gameplay reads the footprint, art reads the sprite name, and neither invents
one. That is what stops a barrel from looking twice the size it hits at.

The three art sources apply in a fixed order — hand-authored, then compiled
vector, then imported — so the last one to define a name wins, and a sprite can
be replaced without deleting what it replaced. **No source may introduce a
colour outside `PAL`**: the vector compiler and the PNG importer both snap to
it. That single constraint is what makes art from different origins sit in the
same scene.

## Feel targets

These are the numbers a critic should measure, and the capture harness reports:

- 60 fps with no dropped frames on the standard tour.
- Throw latency: sheet leaves the buggy on the same frame the key is read.
- Hazards that move telegraph for 30 frames before they commit.
- At cruise speed a hazard is on screen for ~3 s before it is reachable; at top
  speed, ~1.9 s.
- Every shift is clearable by the autopilot in `tools/bot.js`. A level the bot
  cannot clear is a bug, not a difficulty setting.
- Playable on a phone, in both orientations, with no keyboard: the picture uses
  the full width it is given, and every control is a thumb-sized on-screen
  target. `node tools/shoot.mjs --mobile` asserts all of it.

## Scoring

| Event | Value |
| --- | --- |
| Delivery | crew 100, scaffold crew 180, foreman 260, tea hut 70 |
| Quality multiplier | bullseye ×2.5, solid ×1.5, whisper ×1 |
| Combo multiplier | 1 + 0.12 per link, capped at 12 links |
| Near miss | 25 |
| Tea | 60 and a speed burst |

Delivery quality decides the rumour's fidelity tier for the shift
(`fidelityTier` in `src/game/rumor.js`), which decides which of three versions
the next crew passes on. The ending text is earned, not scripted.
