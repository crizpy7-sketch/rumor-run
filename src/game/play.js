// The run scene: driving, throwing, and everything that gets in the way.

import { Road, ROAD, VIEW_W, VIEW_H } from './road.js';
import { buildRoute } from './levels.js';
import { footprintOf } from '../art/names.js';
import { drawSprite, spriteSize } from '../art/sprites.js';
import { drawText } from '../art/glyphs.js';
import { pickBark } from './rumor.js';
import { drawHud, drawBanner } from './hud.js';

const GRAVITY = 9.8;
const THROW_COOLDOWN = 0.15;
const CRASH_TIME = 0.7;
const INVULN_TIME = 1.1;

export function createRunScene(game, levelIndex) {
  const level = game.levels[levelIndex];
  const stats = game.stats;
  const rng = game.rng;
  const road = new Road(level.theme);
  const route = buildRoute(level, game.runSalt);

  const buggy = {
    s: 0, t: 0,
    speed: 6,
    tvel: 0,
    lean: 0,
    cooldown: 0,
    crashT: 0,
    invuln: 0,
    slip: 0,
    scatter: 0,
    drag: 0,
    boost: 0,
    offRoad: false,
  };

  const run = {
    sheets: stats.sheetMax,
    delivered: 0,
    bullseye: 0,
    solid: 0,
    whisper: 0,
    misses: 0,
    crashes: 0,
    nearMisses: 0,
    score: 0,
    combo: 0,
    comboBest: 0,
    comboTimer: 0,
    time: 0,
    finished: false,
    endTimer: 0,
  };

  const sheets = [];
  const fx = [];
  let shake = 0;
  let bannerT = 2.4;
  let banner = pickBark(rng, 'levelStart');
  let lowAmmoWarned = false;

  const renderList = [];

  // --- helpers ----------------------------------------------------------

  function speedCap() {
    let cap = level.speedCap + stats.speedBonus + (buggy.boost > 0 ? 4 : 0);
    if (buggy.offRoad) cap *= 0.72;
    if (buggy.drag > 0) cap *= 0.62;
    return cap;
  }

  function addFx(kind, s, t, opts = {}) {
    fx.push({ kind, s, t, life: opts.life ?? 0.5, age: 0, ...opts });
  }

  function floatText(text, s, t, color = '#fdf6e0', life = 1.1) {
    fx.push({ kind: 'text', text, s, t, color, life, age: 0, rise: 14 });
  }

  function breakCombo(hard = true) {
    if (run.combo > run.comboBest) run.comboBest = run.combo;
    run.combo = hard ? 0 : Math.floor(run.combo / 2);
    run.comboTimer = run.combo ? stats.comboHold : 0;
  }

  function comboMult() {
    return 1 + Math.min(run.combo, 12) * 0.12;
  }

  function crash(kind) {
    if (buggy.invuln > 0) return;
    buggy.crashT = CRASH_TIME * (1 - Math.min(stats.guard, 0.6));
    buggy.invuln = INVULN_TIME;
    buggy.speed *= 0.34 + Math.min(stats.guard, 0.6) * 0.4;
    buggy.tvel *= -0.3;
    shake = Math.max(shake, 6);
    run.crashes++;
    breakCombo(true);
    game.audio.crash();
    floatText(pickBark(rng, 'crash'), buggy.s + 3, buggy.t, '#ff6a3d', 1.5);
    addFx('puff', buggy.s, buggy.t, { life: 0.6, big: true });
    if (kind === 'soft') game.audio.miss();
  }

  // --- throwing ---------------------------------------------------------

  function throwSheet(side) {
    if (run.sheets <= 0 || buggy.crashT > 0) {
      if (run.sheets <= 0) game.audio.miss();
      return;
    }
    run.sheets--;
    // The arc is fixed and the lateral speed is solved from it, so `throwRange`
    // always means the distance the sheet actually covers.
    const vz = 4.4 * stats.loft;
    const flight = (2 * vz) / GRAVITY;
    const scatter = buggy.scatter > 0 ? rng.range(-1.6, 1.6) : 0;
    sheets.push({
      s: buggy.s + 0.8,
      t: buggy.t,
      z: 1.1,
      vs: buggy.speed * 0.5 + rng.range(-0.6, 0.6),
      vt: side * (stats.throwRange / flight) + scatter,
      vz,
      side,
      spin: 0,
      alive: true,
    });
    buggy.scatter = 0;
    buggy.cooldown = THROW_COOLDOWN;
    game.audio.throwSheet();
    if (run.sheets <= 2 && !lowAmmoWarned) {
      lowAmmoWarned = true;
      floatText(pickBark(rng, 'lowAmmo'), buggy.s + 4, buggy.t, '#ff6a3d', 1.6);
    }
  }

  function autoThrow() {
    let best = null;
    let bestD = Infinity;
    for (const tg of route.targets) {
      if (tg.hit) continue;
      const ds = tg.s - buggy.s;
      if (ds < -2 || ds > 26) continue;
      const d = Math.abs(ds) + Math.abs(Math.abs(tg.t - buggy.t) - stats.throwRange) * 0.6;
      if (d < bestD) { bestD = d; best = tg; }
    }
    throwSheet(best ? Math.sign(best.t - buggy.t) || 1 : 1);
  }

  function registerHit(tg, sheet) {
    const foot = footprintOf(tg.def.foot);
    // Quality is how close the throw *would have* passed to the crew, not where
    // it happened to be on the frame contact was detected — otherwise every hit
    // is judged at the edge of the hitbox and nothing is ever a bullseye.
    const ds = sheet.s - tg.s;
    const dt = sheet.t - tg.t;
    const vv = sheet.vs * sheet.vs + sheet.vt * sheet.vt;
    const tau = vv > 0 ? clamp(-(ds * sheet.vs + dt * sheet.vt) / vv, -1, 1) : 0;
    const ms = (ds + sheet.vs * tau) / (foot.ls / 2);
    const mt = (dt + sheet.vt * tau) / (foot.lt / 2);
    const spread = Math.hypot(ms, mt);
    const quality = spread < 0.5 ? 'bullseye' : spread < 1 ? 'solid' : 'whisper';

    tg.hit = true;
    tg.quality = quality;
    tg.react = 1.6;
    tg.bark = pickBark(rng, quality === 'bullseye' ? 'bullseye' : quality === 'whisper' ? 'whisper' : 'hit');
    tg.barkAt = 1.6;

    run.delivered++;
    run[quality]++;
    run.combo++;
    run.comboTimer = stats.comboHold;
    if (run.combo > run.comboBest) run.comboBest = run.combo;

    const qMult = quality === 'bullseye' ? 2.5 : quality === 'solid' ? 1.5 : 1;
    const points = Math.round(tg.def.points * qMult * comboMult());
    run.score += points;

    floatText(`+${points}`, tg.s, tg.t + Math.sign(tg.t) * -1.5, quality === 'bullseye' ? '#ffd24a' : '#fdf6e0', 0.9);
    addFx('spark', sheet.s, sheet.t, { life: 0.4, z: sheet.z });
    game.audio.hit(quality);
    if (run.combo > 1 && run.combo % 3 === 0) game.audio.combo(run.combo);
    if (tg.def.bonus) floatText('FOREMAN!', tg.s, tg.t, '#ff6a3d', 1.2);
  }

  function updateSheets(dt) {
    for (const sh of sheets) {
      if (!sh.alive) continue;
      sh.s += sh.vs * dt;
      sh.t += sh.vt * dt;
      sh.vz -= GRAVITY * dt;
      sh.z += sh.vz * dt;
      sh.spin += dt * 18;

      for (const tg of route.targets) {
        if (tg.hit) continue;
        if (Math.abs(tg.s - sh.s) > 4) continue;
        const foot = footprintOf(tg.def.foot);
        if (Math.abs(sh.s - tg.s) > foot.ls / 2 + 0.5) continue;
        if (Math.abs(sh.t - tg.t) > foot.lt / 2 + 0.6) continue;
        if (sh.z < foot.z0 - 0.3 || sh.z > foot.z0 + foot.zh) continue;
        registerHit(tg, sh);
        sh.alive = false;
        break;
      }

      if (sh.alive && sh.z <= 0) {
        sh.alive = false;
        addFx('puff', sh.s, sh.t, { life: 0.35 });
        run.misses++;
        run.comboTimer = Math.max(0, run.comboTimer - 0.8);
        // Only heckle if a crew actually watched it land short.
        let near = null;
        for (const tg of route.targets) {
          if (tg.hit) continue;
          if (Math.abs(tg.s - sh.s) < 9 && Math.abs(tg.t - sh.t) < 9) { near = tg; break; }
        }
        if (near) {
          near.bark = pickBark(rng, 'miss');
          near.barkAt = 1.2;
          game.audio.miss();
        }
      }
    }
    for (let i = sheets.length - 1; i >= 0; i--) {
      if (!sheets[i].alive || sheets[i].s < buggy.s - 20) sheets.splice(i, 1);
    }
  }

  // --- hazards ----------------------------------------------------------

  function updateHazards(dt) {
    const warnAt = 26 + stats.spotter;
    buggy.drag = 0;

    for (const h of route.hazards) {
      const ds = h.s - buggy.s;
      if (ds < -14 || ds > warnAt + 40) continue;

      if (h.def.mobile && h.state === 'idle' && ds < warnAt) {
        h.state = 'warn';
        h.timer = (h.def.telegraph || 30) / 60;
      } else if (h.state === 'warn') {
        h.timer -= dt;
        if (h.timer <= 0) {
          h.state = 'move';
          if (h.def.mobile === 'cross') game.audio.bark(1.6);
        }
      } else if (h.state === 'move') {
        if (h.def.mobile === 'cross') {
          h.t += h.dir * h.speed * dt;
          if (Math.abs(h.t) > ROAD.halfW + 3) h.state = 'gone';
        } else if (h.def.mobile === 'drop') {
          h.z = (h.z ?? 6) - 14 * dt;
          if (h.z <= 0) { h.z = 0; h.state = 'down'; shake = Math.max(shake, 3); }
        } else if (h.def.mobile === 'roll') {
          h.t += Math.sin(run.time * 1.4 + h.s) * 1.2 * dt;
        }
      }

      if (h.state === 'gone') continue;
      // A pole only exists as a hazard once it has actually landed.
      if (h.def.mobile === 'drop' && h.state !== 'down') continue;

      // Collision against the buggy footprint.
      const bf = footprintOf('buggy');
      const hf = footprintOf(h.kind);
      const overlapS = Math.abs(h.s - buggy.s) < (bf.ls + hf.ls) / 2;
      const overlapT = Math.abs(h.t - buggy.t) < (bf.lt + hf.lt) / 2;

      if (overlapS && overlapT) {
        if (h.def.harm === 'drag') {
          buggy.drag = 1;
        } else if (!h.hitBy) {
          h.hitBy = true;
          applyHarm(h);
        }
      } else if (!h.nearCounted && !h.hitBy && Math.abs(h.s - buggy.s) < 1.4 && h.def.harm !== 'drag') {
        const gap = Math.abs(h.t - buggy.t) - (bf.lt + hf.lt) / 2;
        if (gap > 0 && gap < 0.7) {
          h.nearCounted = true;
          run.nearMisses++;
          run.score += 25;
          run.comboTimer = Math.min(stats.comboHold, run.comboTimer + 0.3);
          game.audio.nearMiss();
          if (rng.chance(0.4)) floatText(pickBark(rng, 'nearMiss'), h.s, h.t, '#c4e022', 0.7);
        }
      }
    }
  }

  function applyHarm(h) {
    switch (h.def.harm) {
      case 'hard':
        crash('hard');
        break;
      case 'soft':
        crash('soft');
        break;
      case 'clip':
        buggy.speed *= 0.74;
        buggy.tvel *= 0.4;
        shake = Math.max(shake, 3);
        breakCombo(false);
        game.audio.scrape();
        addFx('puff', h.s, h.t, { life: 0.3 });
        break;
      case 'jolt':
        buggy.speed *= 0.9;
        buggy.scatter = 1;
        shake = Math.max(shake, 4);
        game.audio.scrape();
        floatText('JOLT!', h.s, h.t, '#ffd24a', 0.6);
        break;
      case 'slip':
        buggy.slip = 0.85;
        buggy.tvel += (rng.chance(0.5) ? 1 : -1) * 3.4;
        game.audio.scrape();
        floatText('SLIP!', h.s, h.t, '#4d86c6', 0.7);
        break;
      default:
        break;
    }
  }

  function updatePickups() {
    for (const p of route.pickups) {
      if (p.taken) continue;
      if (Math.abs(p.s - buggy.s) > 1.6 || Math.abs(p.t - buggy.t) > 1.8) continue;
      p.taken = true;
      if (p.kind === 'crate') {
        run.sheets = Math.min(stats.sheetMax, run.sheets + 6);
        lowAmmoWarned = false;
        floatText(pickBark(rng, 'pickup'), p.s, p.t, '#c4e022', 0.9);
      } else {
        buggy.boost = 2.2;
        run.score += 60;
        floatText('TEA! +60', p.s, p.t, '#ffd24a', 0.9);
      }
      game.audio.pickup();
      addFx('spark', p.s, p.t, { life: 0.35 });
    }
  }

  // --- driving ----------------------------------------------------------

  function updateBuggy(dt) {
    const input = game.input;
    const cap = speedCap();

    if (buggy.crashT > 0) {
      buggy.crashT -= dt;
      buggy.speed = Math.max(2, buggy.speed - 6 * dt);
    } else {
      const gas = input.held('gas') ? 1 : 0;
      const brake = input.held('brake') ? 1 : 0;
      // Roll forward on your own even without the throttle: this is a delivery
      // round, not a parking exercise.
      const idle = 5.5;
      let accel = gas ? 11 : buggy.speed > idle ? -3.2 : 2.2;
      if (brake) accel = -17;
      buggy.speed += accel * dt;
      if (buggy.speed > cap) buggy.speed += (cap - buggy.speed) * Math.min(1, dt * 3.4);
      buggy.speed = clamp(buggy.speed, 0.8, cap + 2);

      const speed01 = clamp(buggy.speed / cap, 0, 1);
      const steer = input.axis('left', 'right');
      const authority = (0.4 + 0.6 * speed01) * stats.grip;
      buggy.tvel += steer * 34 * authority * dt;
      buggy.tvel *= steer ? 0.93 : 0.80;
      if (buggy.slip > 0) {
        buggy.slip -= dt;
        buggy.tvel += Math.sin(run.time * 9) * 5 * dt;
        buggy.tvel *= 1.02;
      }
      buggy.tvel = clamp(buggy.tvel, -8.5, 8.5);
      buggy.lean += (steer - buggy.lean) * Math.min(1, dt * 9);
    }

    buggy.t += buggy.tvel * dt;
    const limit = ROAD.halfW + 2.4;
    if (buggy.t > limit) { buggy.t = limit; buggy.tvel *= -0.25; }
    if (buggy.t < -limit) { buggy.t = -limit; buggy.tvel *= -0.25; }

    const wasOff = buggy.offRoad;
    buggy.offRoad = Math.abs(buggy.t) > ROAD.halfW + 0.4;
    if (buggy.offRoad && !wasOff) game.audio.scrape();
    if (buggy.offRoad && rng.chance(0.25)) addFx('puff', buggy.s - 1, buggy.t, { life: 0.25, small: true });

    buggy.s += buggy.speed * dt;
    if (buggy.boost > 0) buggy.boost -= dt;
    if (buggy.invuln > 0) buggy.invuln -= dt;
    if (buggy.cooldown > 0) buggy.cooldown -= dt;

    // Camera leads with speed so a fast run sees further up the route.
    const lead = 2 + (buggy.speed / Math.max(cap, 1)) * 5;
    road.camS += (buggy.s + lead - road.camS) * Math.min(1, dt * 6);
  }

  // --- scene ------------------------------------------------------------

  function update(dt) {
    const input = game.input;
    run.time += dt;
    if (bannerT > 0) bannerT -= dt;

    if (!run.finished) {
      updateBuggy(dt);

      if (buggy.cooldown <= 0 && buggy.crashT <= 0) {
        if (input.hit('throwLeft')) throwSheet(-1);
        else if (input.hit('throwRight')) throwSheet(1);
        else if (input.hit('throwAuto')) autoThrow();
      }

      updateSheets(dt);
      updateHazards(dt);
      updatePickups();

      if (run.comboTimer > 0) {
        run.comboTimer -= dt;
        if (run.comboTimer <= 0 && run.combo > 0) breakCombo(true);
      }

      if (buggy.s >= route.length) {
        run.finished = true;
        run.endTimer = 1.4;
        banner = run.delivered >= level.quota
          ? pickBark(rng, 'levelPass')
          : pickBark(rng, 'levelFail');
        bannerT = 1.6;
        if (run.delivered >= level.quota) game.audio.fanfare(); else game.audio.sad();
      }
    } else {
      buggy.speed = Math.max(0, buggy.speed - 7 * dt);
      buggy.s += buggy.speed * dt;
      road.camS += (buggy.s + 2 - road.camS) * Math.min(1, dt * 4);
      run.endTimer -= dt;
      if (run.endTimer <= 0) {
        game.audio.engineOff();
        game.finishLevel(levelIndex, run);
        return;
      }
    }

    for (let i = fx.length - 1; i >= 0; i--) {
      fx[i].age += dt;
      if (fx[i].age >= fx[i].life) fx.splice(i, 1);
    }
    for (const tg of route.targets) {
      if (tg.react > 0) tg.react -= dt;
      if (tg.barkAt > 0) tg.barkAt -= dt;
    }
    if (shake > 0) shake = Math.max(0, shake - dt * 22);

    game.audio.engine(clamp(buggy.speed / (level.speedCap + stats.speedBonus), 0, 1), game.input.held('gas'));
    game.audio.setTrack({
      bpm: level.bpm,
      scale: level.scale,
      root: level.root,
      energy: clamp(0.35 + run.combo * 0.06, 0, 1),
    });
  }

  // --- rendering --------------------------------------------------------

  function push(s, fn) { renderList.push({ s, fn }); }

  function drawTarget(tg) {
    const foot = footprintOf(tg.def.foot);
    const x = road.projectX(tg.s, tg.t);
    const y = road.projectY(tg.s, tg.t);
    if (x < -30 || x > VIEW_W + 30 || y < -40 || y > VIEW_H + 30) return;

    return () => {
      const ctx = game.ctx;
      if (tg.def.rig === 'scaffold') {
        const sc = spriteSize('scaffold');
        drawSprite(ctx, 'scaffold', x, y, { ax: 0.5, ay: 1 });
        const bob = tg.react > 0 ? Math.round(Math.sin(tg.react * 22) * 1) : 0;
        drawSprite(ctx, tg.react > 0 ? 'workerCheer' : tg.def.sprite, x, y - sc.h + 4 + bob, { ax: 0.5, ay: 1 });
      } else if (tg.def.wide) {
        road.shadow(ctx, tg.s, tg.t, 18);
        drawSprite(ctx, tg.def.sprite, x, y, { ax: 0.5, ay: 1 });
        if (tg.react > 0) drawSprite(ctx, 'workerCheer', x + 10, y - 2, { ax: 0.5, ay: 1 });
      } else {
        road.shadow(ctx, tg.s, tg.t, 8);
        const bob = tg.react > 0 ? Math.round(Math.sin(tg.react * 24) * 1) : 0;
        drawSprite(ctx, tg.react > 0 ? 'workerCheer' : tg.def.sprite, x, y + bob, { ax: 0.5, ay: 1 });
      }

      if (!tg.hit) {
        // A small ear-marker so a target reads as a target at speed.
        const pulse = (Math.sin(run.time * 5 + tg.s) + 1) / 2;
        ctx.fillStyle = pulse > 0.5 ? '#ffd24a' : '#a8760f';
        const my = y - (tg.def.rig === 'scaffold' ? 40 : tg.def.wide ? 20 : 18);
        ctx.fillRect(Math.round(x) - 1, Math.round(my), 3, 3);
        ctx.fillRect(Math.round(x), Math.round(my) - 2, 1, 2);
      }
      if (tg.barkAt > 0) {
        const alpha = Math.min(1, tg.barkAt);
        const by = y - (tg.def.rig === 'scaffold' ? 52 : 26);
        drawBubble(ctx, tg.bark, x, by, alpha);
      }
    };
  }

  function drawHazard(h) {
    const x = road.projectX(h.s, h.t);
    const y = road.projectY(h.s, h.t) - (h.def.mobile === 'drop' && h.state !== 'down' ? (h.z || 0) * 6 : 0);
    if (x < -40 || x > VIEW_W + 40 || y < -50 || y > VIEW_H + 40) return null;

    return () => {
      const ctx = game.ctx;
      if (!h.def.decal) road.shadow(ctx, h.s, h.t, h.def.harm === 'hard' ? 12 : 7);
      const flip = h.def.mobile === 'cross' && h.dir < 0;
      drawSprite(ctx, h.def.sprite, x, y, { ax: 0.5, ay: h.def.decal ? 0.5 : 1, flip });

      if (h.state === 'warn') {
        const blink = Math.floor(run.time * 12) % 2 === 0;
        if (blink) {
          const wy = road.projectY(h.s, h.t) - 22;
          drawSprite(ctx, 'arrow', x, wy, { ax: 0.5, ay: 1 });
        }
      }
    };
  }

  function render() {
    const ctx = game.ctx;
    ctx.save();
    if (shake > 0.2) {
      ctx.translate(Math.round((Math.random() - 0.5) * shake), Math.round((Math.random() - 0.5) * shake));
    }

    road.drawGround(ctx);
    road.drawSurface(ctx);

    // Flat decals sit on the surface, under everything else.
    for (const h of route.hazards) {
      if (!h.def.decal) continue;
      if (!road.isVisible(h.s)) continue;
      const x = road.projectX(h.s, h.t);
      const y = road.projectY(h.s, h.t);
      drawSprite(ctx, h.def.sprite, x, y, { ax: 0.5, ay: 0.5 });
    }

    renderList.length = 0;

    for (const sc of route.scenery) {
      if (!road.isVisible(sc.s, 20)) continue;
      const x = road.projectX(sc.s, sc.t);
      const y = road.projectY(sc.s, sc.t);
      if (x < -30 || x > VIEW_W + 30) continue;
      push(sc.s, () => {
        road.shadow(ctx, sc.s, sc.t, 6);
        drawSprite(ctx, sc.kind, x, y, { ax: 0.5, ay: 1, flip: sc.t < 0 });
      });
    }

    for (const p of route.pickups) {
      if (p.taken || !road.isVisible(p.s)) continue;
      const x = road.projectX(p.s, p.t);
      const y = road.projectY(p.s, p.t);
      const bob = Math.round(Math.sin(run.time * 4 + p.s) * 1);
      push(p.s, () => {
        road.shadow(ctx, p.s, p.t, 7);
        drawSprite(ctx, p.kind, x, y + bob, { ax: 0.5, ay: 1 });
      });
    }

    for (const h of route.hazards) {
      if (h.def.decal || h.state === 'gone') continue;
      if (!road.isVisible(h.s, 16)) continue;
      const fn = drawHazard(h);
      if (fn) push(h.s, fn);
    }

    for (const tg of route.targets) {
      if (!road.isVisible(tg.s, 24)) continue;
      const fn = drawTarget(tg);
      if (fn) push(tg.s, fn);
    }

    // The buggy.
    push(buggy.s, () => {
      const x = road.projectX(buggy.s, buggy.t);
      const y = road.projectY(buggy.s, buggy.t);
      road.shadow(ctx, buggy.s, buggy.t, 12);
      const blink = buggy.invuln > 0 && Math.floor(run.time * 20) % 2 === 0;
      if (!blink) {
        const name = buggy.crashT > 0
          ? 'buggyWreck'
          : buggy.lean < -0.35 ? 'buggyLeft' : buggy.lean > 0.35 ? 'buggyRight' : 'buggy';
        const jitter = buggy.crashT > 0 ? Math.round(Math.sin(run.time * 40) * 2) : 0;
        drawSprite(ctx, name, x + jitter, y, { ax: 0.5, ay: 1 });
      }
    });

    for (const sh of sheets) {
      if (!sh.alive) continue;
      const x = road.projectX(sh.s, sh.t);
      const y = road.projectY(sh.s, sh.t) - sh.z * 7;
      push(sh.s + 0.1, () => {
        road.shadow(ctx, sh.s, sh.t, 4);
        drawSprite(ctx, 'sheet', x, y, { ax: 0.5, ay: 0.5, flip: Math.floor(sh.spin) % 2 === 0 });
      });
    }

    renderList.sort((a, b) => b.s - a.s);
    for (const item of renderList) item.fn();

    // FX above the world but under the HUD.
    for (const f of fx) {
      const k = f.age / f.life;
      const x = road.projectX(f.s, f.t);
      const y = road.projectY(f.s, f.t) - (f.z ? f.z * 7 : 0);
      if (f.kind === 'text') {
        drawText(ctx, f.text, x, y - 10 - k * f.rise, {
          color: f.color, align: 'center', shadow: '#171418',
        });
      } else if (f.kind === 'puff') {
        drawSprite(ctx, 'puff', x, y, {
          ax: 0.5, ay: 0.5, alpha: 1 - k, scale: f.big ? 2 : f.small ? 1 : 1,
        });
      } else if (f.kind === 'spark') {
        drawSprite(ctx, 'spark', x, y, { ax: 0.5, ay: 0.5, alpha: 1 - k });
      }
    }

    road.drawHaze(ctx);
    ctx.restore();

    drawHud(ctx, { game, level, run, buggy, route, stats });
    if (bannerT > 0) drawBanner(ctx, banner, Math.min(1, bannerT));
  }

  return { update, render, run, road, buggy, route, name: 'run' };
}

function drawBubble(ctx, text, x, y, alpha = 1) {
  const w = text.length * 6 - 1;
  const bx = Math.round(clamp(x - w / 2 - 3, 2, VIEW_W - w - 8));
  const by = Math.round(y);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#171418';
  ctx.fillRect(bx - 1, by - 1, w + 8, 11);
  ctx.fillStyle = '#fdf6e0';
  ctx.fillRect(bx, by, w + 6, 9);
  drawText(ctx, text, bx + 3, by + 1, { color: '#171418' });
  ctx.fillStyle = '#fdf6e0';
  ctx.fillRect(Math.round(clamp(x, bx + 3, bx + w)), by + 9, 2, 2);
  ctx.restore();
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

export { clamp };
