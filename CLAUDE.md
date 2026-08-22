# CLAUDE.md — Rumor Run

Standing instructions for every session in this repo. Read this before writing
gameplay code. When a rule here conflicts with a general habit, this file wins.
When it conflicts with what the user says in chat, the user wins — then update
this file.

`CONTRACTS.md` holds the fixed numbers (screen size, road space, ownership).
This file holds the house style: how things should feel, and how to prove they do.

---

## 0. Project facts

| Field | Value |
|---|---|
| Game | Rumor Run — "Deliver the rumors. Dodge the drama. Pick up Bomba." |
| Core loop | Drive an angled jobsite route, throw gossip sheets at crews either side, clear a quota before the gate. Eight shifts, ~90 s each. |
| Stack | **Vanilla ES modules. No framework, no build step, no runtime dependencies.** |
| Dev dependency | `playwright` — harness only, never shipped |
| Platforms | Desktop web, mobile web (portrait and landscape) |
| Resolution | 384 × 288 internal, integer-scaled, letterboxed |
| Input | Keyboard, touch. **No gamepad yet** (§2.6) |
| Perf budget | 60 fps, measured — the capture harness reports it and CI fails on a drop |
| Run | `npm start` → <http://localhost:8123> · `npm test` · `npm run check` |
| Published | GitHub Pages from `main`, repo root. `index.html` and `src/` *are* the site. |

### The no-dependency rule

This is the strongest constraint in the project, and it is deliberate.

**Do not add a runtime dependency. Do not add a build step. Do not introduce
TypeScript, a bundler, or a game engine.** Serving the folder runs the game;
that property is worth more than any library on offer. If something seems to
need Phaser, Pixi, an ECS, or Vite, the answer is that this game does not need
it — say so rather than reaching for it.

Two exceptions already exist and are the pattern for any future one:
`playwright` is a dev dependency the harness needs, and `vendor/three.js` is
committed rather than installed so the `3d/` pages work offline. Both are
outside the game. **Ask before adding a third.**

---

## 1. The bar

What separates a game that feels good from one that doesn't is **response
latency and response density**. Every player action gets:

- a **visual** response on the *same frame* the input is read,
- an **audio** response within ~50 ms,
- a **state** change the player can name.

If a button press produces nothing for 100 ms the game feels broken even when it
is working perfectly. Treat "no feedback" as a bug of the same severity as a crash.

**Never gate feedback behind the simulation succeeding.** The throw sound and the
arm animation play on press. Whether a sheet actually leaves the buggy is a
separate question — and if it can't, that needs its own distinct feedback (a
refusal blip, not silence).

---

## 2. Input contract

### 2.1 One input layer

Gameplay never reads `KeyboardEvent`, touch events, or `navigator.getGamepads()`
directly. `src/engine/input.js` maps devices to a device-agnostic intent object;
gameplay reads that.

**Current exception, and it is a real one:** touch handling lives in
`src/main.js`, not in `src/engine/input.js`. It works, but it means there are two
places that know about devices. Move it when touch is next touched.

### 2.2 Buffering and grace

| Mechanism | Value | What it fixes |
|---|---|---|
| Input buffer, discrete actions | 100–150 ms | Press lands a few frames before the action is legal; it still fires |
| Throw cooldown | `THROW_COOLDOWN` in `play.js` | Rate limit — **not** a substitute for a buffer |

Buffers are **consumed**, not just read — clear on use so one press never fires twice.

**Open gap:** throwing has a cooldown but no buffer. A press a few frames before
the cooldown expires is dropped silently, which is exactly the case §1 calls a
bug. Fix this before adding any new discrete action.

### 2.3 Sampling rules

- Read all input **once at the top of the frame**, before simulation. Mid-frame
  reads produce order-dependent bugs.
- Keyboard: maintain a `Set` from `keydown`/`keyup`. Use `event.code`, never
  `event.key` — `key` is layout-dependent.
- Clear held state on `blur` **and** on `visibilitychange` → hidden, or the
  player returns holding phantom buttons. *`blur` is handled; `visibilitychange`
  is not — see §11.*

### 2.4 Touch

Touch is a first-class input here, not a port. The game was shipped once with
touch broken and it took a user to notice, because the entire harness drove
synthetic key events at a desktop viewport. That blind spot is now closed by
`node tools/shoot.mjs --mobile`, which uses a real phone viewport with
`hasTouch` — **any input change must be checked with it.**

- Targets ≥ 44 px with real spacing. Current deck is 56–112 px. Do not shrink it.
- The throttle holds itself. No thumb is spare to keep a button pressed.
- Tapping the picture is "confirm", so menus need no button of their own.
- **Size the canvas from the layout viewport** (`document.documentElement.clientWidth`),
  never from `visualViewport`. The layout is entirely `position: fixed`, so it is
  laid out against the layout viewport, while `visualViewport` shrinks under
  pinch-zoom and jitters as the iOS URL bar animates.
- **The page must never zoom.** `user-scalable=no` has been ignored by iOS
  Safari since iOS 10 and `touch-action: none` only stops double-tap, so
  `gesturestart` is preventDefault-ed in `guardViewport()`. A zoom cannot be
  undone from script, and with a fixed layout there is nothing to scroll back —
  a player who zooms is stranded until they reload. Both properties are asserted
  by `--mobile`.

### 2.5 Rebinding

Half done, and the hard half is the done half. `BINDINGS` in
`src/engine/input.js` is already a named action → key-code map, so the rest of
the game never mentions a physical key. What's missing is only the UI to edit it
and somewhere to persist it (§7.5).

Keep it that way: a new action goes in `BINDINGS` with a name, never as a raw
key check at the call site.

### 2.6 Gamepad

Not supported. If added: poll `navigator.getGamepads()` every frame (the array is
a snapshot, not live), use a **radial** deadzone, not per-axis — per-axis gives a
square dead region and makes diagonals feel wrong.

---

## 3. Frame loop

`src/engine/loop.js` is settled and correct. Do not restructure it.

- **Fixed 1/60 s simulation step.** Gameplay physics never sees a variable `dt`,
  so every tuning number means the same thing on every machine.
- `dt` clamped to 0.25 s, `MAX_CATCHUP` of 5 steps, accumulator dropped on
  overrun — no spiral of death.
- `timeScale` (1–8) is **harness-only**. The step stays 1/60, so a 4× playtest
  runs the identical simulation, just sooner. Never drive it from gameplay.

Because the step is fixed, per-step multipliers like `buggy.speed *= 0.86` are
framerate-independent by construction. The usual warning against
`lerp(current, target, 0.1)` does **not** apply inside `update(STEP)`. It does
apply to anything cosmetic driven by real elapsed time — there, use
`value += (target - value) * (1 - Math.exp(-k * dt))`.

**Open gaps:** the loop computes an interpolation alpha and passes it to
`render()`, which ignores it — invisible at 60 Hz, but on a 144 Hz display the
same simulated frame is drawn repeatedly. And nothing pauses on
`visibilitychange`. See §11.

---

## 4. Camera

There is no free camera. The route scrolls past a fixed viewpoint, and the
projection in `src/game/road.js` is the camera.

- The projection is a **fixed oblique with no perspective scaling**, inverted
  **per screen row** (`Road.centreX`), never rasterised as one rectangle per
  metre. That per-row inversion is the only reason the diagonal road edges are
  clean instead of stepped. **Do not replace it with a transform.**
- **Screenshake is a render-only offset.** It is applied in `render()` and never
  feeds back into gameplay coordinates, hit tests, or culling. Keep it that way.
- Round the shake offset to whole internal pixels or the whole scene shimmers.

---

## 5. Feedback and juice

### 5.1 The feedback table

Every gameplay event gets a row. An empty cell is a bug ticket.

| Event | Visual | Audio | Duration |
|---|---|---|---|
| Throw | sheet leaves on the same frame the key is read | throw whoosh | — |
| Throw refused (cooldown) | **nothing — gap, see §11** | **nothing — gap** | — |
| Bullseye | pop + spark burst, combo counter kicks | rising pitch per combo link | 200 ms |
| Solid / whisper | smaller pop, quality word floats up | flatter tone | 200 ms |
| Crash | screenshake, buggy wreck pose, speed cut | impact + engine drop | ~400 ms |
| Near miss | score chip | soft tick | 120 ms |
| Power-up | scale pop, timer appears on HUD | rising blip | 200 ms |
| Bark | speech bubble over the crew | — | until read |
| Gate / shift end | results panel | stinger | — |

### 5.2 Screenshake — use the trauma model

Accumulate **trauma** (0..1), decay it linearly, drive the offset by `trauma²`
so small hits barely register and big ones land:

```js
trauma = Math.min(1, trauma + amount);
trauma = Math.max(0, trauma - TRAUMA_DECAY * dt);   // ~1.0–1.5 / sec
const shake = trauma * trauma;
```

Drive the offset with **smooth noise, not `Math.random()`**. Random per frame is
a buzz; noise is a shake. `road.js` already has a `hash2(a, b)` for exactly this
shape of thing — promote it to `src/engine/rng.js` rather than writing a second one.

**Open gap:** `play.js` currently uses `Math.random()` per frame for shake. It is
the one place gameplay rendering calls `Math.random()`, and it is both an
anti-pattern (§12) and the reason crashes read as a rattle rather than an impact.

Scale the whole thing by the player's screenshake setting, **including all the
way to zero** (§8).

### 5.3 Easing

| Situation | Curve |
|---|---|
| Arriving / settling | `easeOutQuad` / `easeOutCubic` |
| Pops, "notice me" | `easeOutBack` (overshoot) |
| Leaving | `easeInQuad` |
| Menu transitions | `easeInOutCubic` |
| Never | `linear` — reads as mechanical |

UI 120–200 ms · gameplay pops 80–150 ms · scene transitions 250–400 ms. Anything
over 400 ms had better be a deliberate dramatic beat.

### 5.4 Allocation

Don't allocate inside the frame loop. A GC pause at 60 fps is a visible stutter,
and a single 50 ms hitch is more noticeable than a uniformly lower framerate.
Pool particles and effects; never `new` per frame.

---

## 6. Audio

`src/engine/audio.js` is procedural Web Audio — no audio files ship. Keep it that
way; it is a large part of why the repo has no assets to load.

- **Buses exist**: master / music / sfx / engine. Use them; don't route to
  destination directly.
- **Autoplay gate**: browsers block audio until a gesture. `resume()` is called
  on first input — do not add a sound that plays before one.
- **Vary every SFX**: pitch ±5–8%, volume ±10% per play, or repeats turn into a
  machine gun and the ear stops hearing them.
- **Cap concurrent instances** of the same sound at 3–4, steal the oldest.
- **Duck the music** ~-6 dB for 300 ms on important events.
- `Math.random()` is **fine** in audio — it is cosmetic and outside the
  simulation. Keep it out of anything that affects state (§7.2).

**Open gap:** there is a global mute (`M`) but no per-bus volume sliders. The
buses already exist, so this is UI work, and §8 makes it a requirement rather
than a nicety.

---

## 7. Architecture

### 7.1 Layout

See `README.md` for the full tree. The boundary that matters:

- `src/engine/` — loop, input, audio, rng. Knows nothing about the game.
- `src/game/` — road, play, levels, rumor, screens, hud.
- `src/art/` — sprites, font, and the name/footprint registry.
- `tools/` — server, harness, autopilot, art compilers. Never shipped to players.

### 7.2 Determinism

**All gameplay randomness goes through the seeded PRNG in `src/engine/rng.js`.**
Routes replay identically from a seed, which is what makes the autopilot and the
64-route fairness check possible. `Math.random()` is permitted only in audio and
in the run salt. It is not permitted anywhere that affects state.

### 7.3 The art contract — do not violate this

`src/art/names.js` pins every sprite name **and** its road-space footprint.
Gameplay reads the footprint, art reads the name, and **neither invents one**.
That is what stops a barrel looking twice the size it hits at.

Art reaches the game three ways, applied in a fixed order — hand-authored grids,
then compiled vector art (`tools/genart.mjs`), then imported PNGs
(`tools/importart.mjs`). Last one to define a name wins.

**No source may introduce a colour outside `PAL`.** The vector compiler and the
PNG importer both snap to it. That single constraint is what makes art from
different origins sit in the same scene, and it is not negotiable.

### 7.4 Tuning values live in data

Numbers that affect feel belong in `src/game/levels.js` (`baseStats`, `UPGRADES`,
`HAZARDS`) or `CONTRACTS.md`, not scattered through class bodies. Feel is found
by iteration, not by reasoning about it — a value you can't change in one place
is a value nobody will tune.

### 7.5 Persistence

There is none. No high scores, no settings, nothing survives a reload. When this
is added: version the schema with an explicit `version` field and write
migration #1 before shipping save #1. Prefer IndexedDB over `localStorage` —
`localStorage` is synchronous and blocks the main thread.

---

## 8. Accessibility — required, not optional

Mapped to the **Basic** tier of the [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/basic/).
Each is under an hour, and most double as quality-of-life features every player uses.

**Done**

- [x] Touch targets ≥ 44 px with real spacing
- [x] Playable with no keyboard, both orientations
- [x] Pause available in play (`P` or `Escape`)
- [x] Game reachable from launch in ≤ 2 interactions

**Open**

- [ ] Full control remapping
- [ ] Separate persisted volume sliders — music / sfx / ui — all reaching zero
- [ ] **Reduced motion**: honour `prefers-reduced-motion` by default; scale
      screenshake, flashes, and weather. The screenshake slider must reach 0.
- [ ] Settings persist across sessions (blocked on §7.5)
- [ ] Verify no essential information is colour-only — hazard telegraphs
      currently lean on colour; pair with shape or motion
- [ ] Text contrast ≥ 4.5:1 against the actual background, including over art
- [ ] Check the palette against deuteranopia/protanopia/tritanopia simulation

**Always true**

- **No flashing above 3 Hz.** This is a seizure risk, not a preference. The
  storm and night themes are the risk area — check any change to them.

---

## 9. Definition of done

A gameplay feature is not done until all of these hold:

1. Input comes through the intent layer (§2.1) — no direct device access.
2. It has buffering or grace wherever a human could plausibly be a few frames
   early or late (§2.2).
3. It emits at least one visual **and** one audio response (§5.1), including on
   refusal.
4. Its tuning numbers live in data (§7.4).
5. It runs identically at 60, 120, and 144 Hz.
6. It doesn't allocate inside the frame loop.
7. It works on keyboard **and** touch — checked with `--mobile`, not assumed.
8. Any new sprite is pinned in `src/art/names.js` with a footprint (§7.3).
9. Its row in the feedback table (§5.1) is filled in.
10. `npm run check` is green, and you have **looked at** a screenshot of it.

---

## 10. How to verify — don't tell the user it works, show the run

```sh
npm test                       # data checks, no browser, under a second
node tools/playtest.mjs        # autopilot plays all eight shifts
node tools/shoot.mjs           # screenshot tour -> shots/rr-tour/
node tools/shoot.mjs --mobile  # phone viewport + real touch
node tools/artsheet.mjs        # every sprite at 4x -> shots/art-sheet.png
node tools/shoot3d.mjs --calibrate
npm run check                  # all of it, in order
```

**The harness is not ceremony. It has repeatedly caught defects that reasoning
alone missed** — throwing that was silently dead, crews placed outside throw
range, every delivery grading as "whisper", scaffold crews unreachable by any
arc, routes walled off by hazards, an upgrade that broke the game, a banner that
read "GCU", fog eating an entire scene, and a bounding box measured before its
matrices existed.

Three habits follow from that:

- **Look at the pixels.** `artsheet` exists because a 22 px sprite cannot be
  judged from a gameplay screenshot, and `shoot` exists because a scene that
  renders nothing throws no errors. Open the image.
- **Prefer a property over an example.** `tools/verify.mjs` asserts invariants
  over 64 generated routes rather than checking one. That is what caught the
  fairness blind spot.
- **Measure instead of eyeballing** where a number exists.
  `shoot3d --calibrate` turned "the lighting looks muddy" into "0.85×, and here
  is the exact scale to fix it". Reach for that shape of check.

Zero console warnings, zero errors, always.

---

## 11. Open gaps, in priority order

Found by auditing the repo against this handbook. Each is real and each is small.

1. **Screenshake uses `Math.random()` per frame** (`play.js`) — no trauma model,
   reads as a rattle. §5.2.
2. **No `visibilitychange` handling** — a backgrounded tab keeps held keys and
   doesn't pause. §2.3, §3.
3. **Throw has no input buffer** — presses land in the cooldown and vanish
   without feedback. §2.2, §5.1.
4. **Render interpolation alpha is computed and discarded** — the loop passes it,
   `render()` ignores it. §3.
5. **No volume sliders and no reduced-motion setting** — buses already exist, so
   this is UI. §8.
6. **Touch handling lives in `main.js`, not the input layer** — two places know
   about devices. §2.1.
7. **Nothing persists** — no scores, and no home for settings once they exist. §7.5.

Do not fix these opportunistically in unrelated work. Raise them, then fix the
one that's in the way.

---

## 12. Anti-patterns

- Adding a runtime dependency or a build step (§0).
- `Math.random()` anywhere that affects state.
- Variable `dt` in the simulation.
- Screenshake that moves gameplay coordinates.
- A sprite drawn without a footprint pinned in `names.js`.
- A colour outside `PAL`.
- Replacing the per-row projection inversion with a single transform.
- Allocating inside the frame loop.
- Tuning constants inline in function bodies.
- Feedback that only fires when an action *succeeds*.
- Building accessibility "later" — remapping and volume buses are architectural.
- Checking a UI change on desktop only.
- Reporting a feature done without running `npm run check` and looking at a
  screenshot.

---

## 13. Reference

- **[Celeste and TowerFall Physics](https://maddythorson.medium.com/celeste-and-towerfall-physics-d24bd2ae0fc5)** — Maddy Thorson, on integer movement and corner correction.
- **[Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/)** — Glenn Fiedler. The source of §3.
- **The Art of Screenshake** — Jan Willem Nijman, 2013. The canonical juice talk.
- **[Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/)** — the source of §8.
