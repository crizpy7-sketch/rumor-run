// Autopilot. Injected into the page by tools/playtest.mjs.
//
// It is not meant to be good — it is meant to be *competent*: pick the next
// crew, get to that side of the road, throw at a sensible distance, and swerve
// around anything solid. If a level cannot be cleared by this, the level is
// mistuned, and that is exactly what the playtest reports.

window.__runBot = function runBot({ maxSeconds = 240 } = {}) {
  const R = window.RUMOR_RUN;
  const game = R.game;
  const input = R.input;

  const held = new Set();
  const fired = new Set();
  const missed = { range: 0, timing: 0 };
  const log = [];
  let thrown = 0;
  let refused = 0;
  let sheetsBefore = -1;
  let pendingCheck = null;
  let throwFrames = 0;
  let throwAction = null;
  const startedAt = performance.now();

  function setKey(action, want) {
    if (want && !held.has(action)) { input.press(action); held.add(action); }
    else if (!want && held.has(action)) { input.release(action); held.delete(action); }
    else if (want) { input.press(action); } // re-assert: the game clears each step
  }

  function releaseAll() {
    for (const a of Array.from(held)) input.release(a);
    held.clear();
  }

  return new Promise((resolve) => {
    function step() {
      const scene = game.scene;
      if (!scene || scene.name !== 'run') {
        releaseAll();
        resolve({ ended: scene ? scene.name : 'none', run: null });
        return;
      }
      if (performance.now() - startedAt > maxSeconds * 1000) {
        releaseAll();
        resolve({ ended: 'timeout', run: snapshot(scene) });
        return;
      }

      const { buggy, route, run } = scene;
      const stats = game.stats;

      // Next crew that still has not heard it.
      let target = null;
      for (const tg of route.targets) {
        if (!tg.hit && tg.s > buggy.s + 2) { target = tg; break; }
      }

      // Aim for the side the crew is on, staying on the paved surface.
      let want = 0;
      if (target) want = target.t > 0 ? 4.4 : -4.4;

      // Anything solid in the next few metres outranks the delivery — but dodge
      // to whichever side keeps the delivery line, or the bot spends the whole
      // shift swerving and never throws.
      let panic = false;
      for (const h of route.hazards) {
        if (h.state === 'gone' || h.def.harm === 'drag') continue;
        if (h.def.mobile === 'drop' && h.state !== 'down') continue;
        const ds = h.s - buggy.s;
        if (ds < 1.2 || ds > 14) continue;
        const threat = Math.abs(h.t - want) < 2.6 || Math.abs(h.t - buggy.t) < 2.0;
        if (!threat) continue;
        const left = h.t - 3.2;
        const right = h.t + 3.2;
        const pick = Math.abs(left - want) <= Math.abs(right - want) ? left : right;
        want = Math.max(-5.2, Math.min(5.2, pick));
        if (ds < 7 && Math.abs(h.t - buggy.t) < 2.0) panic = true;
      }
      // Paper first: divert for a crate when running low.
      if (run.sheets <= 3) {
        for (const p of route.pickups) {
          if (p.taken || p.kind !== 'papers') continue;
          const ds = p.s - buggy.s;
          if (ds > 2 && ds < 40) { want = p.t; break; }
        }
      }
      want = Math.max(-5.2, Math.min(5.2, want));

      const err = want - buggy.t;
      setKey('left', err < -0.35);
      setKey('right', err > 0.35);
      // Lift off when a dodge is still in progress: slower means more metres of
      // road to move sideways in.
      setKey('gas', !panic);
      setKey('brake', panic && Math.abs(err) > 1.5);

      // Throwing. The sheet keeps half the buggy's speed for the whole arc, so
      // the release point is solved rather than guessed: work out where a sheet
      // thrown *now* would cross the crew's line, and let go when that lands on
      // them.
      if (pendingCheck && sheetsBefore >= 0 && run.sheets === sheetsBefore) {
        refused++;
        sheetsBefore = -1;
        pendingCheck = null;
      } else if (pendingCheck) {
        sheetsBefore = -1;
        pendingCheck = null;
      }

      if (throwFrames > 0) {
        throwFrames--;
        if (throwFrames === 0 && throwAction) { input.release(throwAction); throwAction = null; }
      } else if (target && run.sheets > 0 && !fired.has(target)) {
        const lat = Math.abs(target.t - buggy.t);
        const flight = (2 * 4.4 * stats.loft) / 9.8;
        const crossAt = (lat * flight) / stats.throwRange;      // seconds to reach their line
        const landing = buggy.s + 0.8 + buggy.speed * 0.5 * crossAt;
        if (lat > stats.throwRange - 0.4) {
          if (target.s - buggy.s < 1) { missed.range++; fired.add(target); }
        } else if (landing >= target.s - 0.4) {
          if (landing <= target.s + 1.2) {
            fired.add(target);
            throwAction = target.t > buggy.t ? 'throwRight' : 'throwLeft';
            input.press(throwAction);
            throwFrames = 2;
            thrown++;
            if (log.length < 6) {
              log.push({
                tgS: +target.s.toFixed(2), tgT: +target.t.toFixed(2), kind: target.kind,
                buggyS: +buggy.s.toFixed(2), buggyT: +buggy.t.toFixed(2),
                speed: +buggy.speed.toFixed(2), lat: +lat.toFixed(2),
                crossAt: +crossAt.toFixed(3), landing: +landing.toFixed(2),
                range: stats.throwRange, loft: stats.loft, side: throwAction,
              });
            }
            // A throw the game refuses (mid-crash, or out of paper) is not the
            // same as one that missed; count them apart.
            sheetsBefore = run.sheets;
            pendingCheck = target;
          } else if (target.s - buggy.s < 1) {
            missed.timing++;
            fired.add(target);
          }
        }
      }

      requestAnimationFrame(step);
    }

    function snapshot(scene) {
      const r = scene.run;
      return {
        delivered: r.delivered, bullseye: r.bullseye, solid: r.solid, whisper: r.whisper,
        misses: r.misses, crashes: r.crashes, nearMisses: r.nearMisses,
        score: r.score, comboBest: Math.max(r.comboBest, r.combo), sheets: r.sheets,
        time: Math.round(r.time * 10) / 10,
      };
    }

    // Snapshot the run before the scene flips, so the caller still sees it.
    const origFinish = game.finishLevel;
    game.finishLevel = function patched(levelIndex, run) {
      window.__lastRun = {
        levelIndex,
        delivered: run.delivered, bullseye: run.bullseye, solid: run.solid,
        whisper: run.whisper, misses: run.misses, crashes: run.crashes,
        nearMisses: run.nearMisses, score: run.score,
        comboBest: Math.max(run.comboBest, run.combo), sheets: run.sheets,
        time: Math.round(run.time * 10) / 10,
        // Why crews went unserved: out of throwing range, or the release point
        // slid past before the bot could take it.
        thrown, refused, outOfRange: missed.range, badTiming: missed.timing, log,
      };
      game.finishLevel = origFinish;
      return origFinish.call(this, levelIndex, run);
    };

    requestAnimationFrame(step);
  });
};
