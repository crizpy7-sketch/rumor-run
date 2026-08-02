// The run scene: driving, throwing, and everything that gets in the way.

import { Road, ROAD, VIEW_W, VIEW_H } from './road.js';
import { buildRoute } from './levels.js';
import { footprintOf } from '../art/names.js';
import { drawSprite, spriteSize, PAL } from '../art/sprites.js';
import { drawText, textWidth } from '../art/glyphs.js';
import { pickBark } from './rumor.js';
import { drawHud, drawBanner } from './hud.js';

const GRAVITY = 9.8;
const THROW_COOLDOWN = 0.15;
const CRASH_TIME = 0.7;
const INVULN_TIME = 1.1;

// Crews come in three looks so a row of them does not read as one clone.
const CREW_LOOKS = ['worker', 'workerDark', 'workerOrangeVest'];
const CREW_CHEERS = ['workerCheer', 'workerCheerO', 'workerCheer'];

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
    // Power up timers.
    shield: 0,
    confusion: 0,
    bombaTime: 0,
    caught: 0,
  };

  // The superintendent, on levels that have one, rolls up behind you whenever
  // you dawdle. He never quite catches a cart at full chat.
  const sup = level.chaos.superintendent
    ? { s: -40, active: true, shout: 0 }
    : null;

  const sheets = [];
  const fx = [];
  let shake = 0;
  let bannerT = 2.4;
  let banner = pickBark(rng, 'levelStart');
  let lowAmmoWarned = false;

  const renderList = [];

  // --- helpers ----------------------------------------------------------

  function speedCap() {
    let cap = level.speedCap + stats.speedBonus + (buggy.boost > 0 ? 5 : 0);
    if (buggy.offRoad) cap *= 0.72;
    if (buggy.drag > 0) cap *= 0.62;
    return cap;
  }

  function addFx(kind, s, t, opts = {}) {
    fx.push({ kind, s, t, life: opts.life ?? 0.5, age: 0, ...opts });
  }

  function floatText(text, s, t, color = '#fdf6e0', life = 1.1) {
    fx.push({ kind: 'text', text, s, t, color, life, age: 0, rise: 16 });
  }

  function breakCombo(hard = true) {
    if (run.bombaTime > 0) return; // Bomba time holds the chain together.
    if (run.combo > run.comboBest) run.comboBest = run.combo;
    run.combo = hard ? 0 : Math.floor(run.combo / 2);
    run.comboTimer = run.combo ? stats.comboHold : 0;
  }

  function comboMult() {
    return (1 + Math.min(run.combo, 12) * 0.12) * (run.bombaTime > 0 ? 2 : 1);
  }

  function crash(kind, source) {
    if (buggy.invuln > 0) return;
    if (run.shield > 0) {
      // The vest eats one hit and makes a show of it.
      run.shield = 0;
      buggy.invuln = INVULN_TIME;
      buggy.speed *= 0.86;
      shake = Math.max(shake, 4);
      game.audio.scrape();
      floatText('VEST HELD!', buggy.s + 3, buggy.t, '#c8e04a', 1.1);
      addFx('spark', buggy.s, buggy.t, { life: 0.4 });
      return;
    }
    buggy.crashT = CRASH_TIME * (1 - Math.min(stats.guard, 0.6));
    buggy.invuln = INVULN_TIME;
    buggy.speed *= 0.34 + Math.min(stats.guard, 0.6) * 0.4;
    buggy.tvel *= -0.3;
    shake = Math.max(shake, 7);
    run.crashes++;
    breakCombo(true);
    game.audio.crash();
    floatText(source || pickBark(rng, 'crash'), buggy.s + 3, buggy.t, '#ff7a3d', 1.5);
    for (let i = 0; i < 5; i++) {
      addFx('puff', buggy.s + rng.range(-1, 1), buggy.t + rng.range(-1, 1),
        { life: 0.5 + rng.next() * 0.3, big: true });
    }
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
      floatText(pickBark(rng, 'lowAmmo'), buggy.s + 4, buggy.t, '#ff7a3d', 1.6);
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
    let spread = Math.hypot(ms, mt);
    // A confused site listens harder than it should.
    if (run.confusion > 0) spread *= 0.6;
    const quality = spread < 0.5 ? 'bullseye' : spread < 1 ? 'solid' : 'whisper';

    tg.hit = true;
    tg.quality = quality;
    tg.react = 1.8;
    tg.bark = pickBark(rng, quality === 'bullseye' ? 'bullseye' : quality === 'whisper' ? 'whisper' : 'hit');
    tg.barkAt = 1.8;

    run.delivered++;
    run[quality]++;
    run.combo++;
    run.comboTimer = stats.comboHold;
    if (run.combo > run.comboBest) run.comboBest = run.combo;

    const qMult = quality === 'bullseye' ? 2.5 : quality === 'solid' ? 1.5 : 1;
    const points = Math.round(tg.def.points * qMult * comboMult());
    run.score += points;

    floatText(`+${points}`, tg.s, tg.t + Math.sign(tg.t) * -1.5,
      quality === 'bullseye' ? '#ffd24a' : '#fdf6e0', 0.9);
    addFx('spark', sheet.s, sheet.t, { life: 0.45, z: sheet.z });
    for (let i = 0; i < 3; i++) {
      addFx('paper', sheet.s, sheet.t, { life: 0.6, z: sheet.z, vt: rng.range(-2, 2), vz: rng.range(1, 3) });
    }
    game.audio.hit(quality);
    if (run.combo > 1 && run.combo % 3 === 0) game.audio.combo(run.combo);
    if (tg.def.bonus) floatText('FOREMAN!', tg.s, tg.t, '#ff7a3d', 1.2);
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
        if (Math.abs(tg.s - sh.s) > 5) continue;
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
      if (ds < -16 || ds > warnAt + 44) continue;

      // Everything with a voice says its piece as you come up on it.
      if (!h.said && ds < 16 && ds > 0 && h.def.say && rng.chance(0.5)) {
        h.said = true;
        h.sayAt = 1.3;
      }
      if (h.sayAt > 0) h.sayAt -= dt;

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
        switch (h.def.mobile) {
          case 'cross':
          case 'walk':
            h.t += h.dir * h.speed * dt;
            if (Math.abs(h.t) > ROAD.halfW + 4) h.state = 'gone';
            break;
          case 'wander':
            // Head down, no idea where he is going.
            h.t = h.t0 + Math.sin(run.time * 0.9 + h.phase) * 2.6;
            break;
          case 'swing':
            h.t = h.t0 + Math.sin(run.time * 1.7 + h.phase) * 3.4;
            break;
          case 'roll':
            h.t += Math.sin(run.time * 0.7 + h.phase) * h.speed * dt;
            h.s -= h.speed * 0.35 * dt;
            break;
          default:
            break;
        }
      }

      if (h.state === 'gone') continue;

      // Collision against the cart footprint.
      const bf = footprintOf('cart');
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
      } else if (!h.nearCounted && !h.hitBy && Math.abs(h.s - buggy.s) < 1.6 && h.def.harm !== 'drag') {
        const gap = Math.abs(h.t - buggy.t) - (bf.lt + hf.lt) / 2;
        if (gap > 0 && gap < 0.8) {
          h.nearCounted = true;
          run.nearMisses++;
          run.score += 25;
          run.comboTimer = Math.min(stats.comboHold, run.comboTimer + 0.3);
          game.audio.nearMiss();
          if (rng.chance(0.4)) floatText(pickBark(rng, 'nearMiss'), h.s, h.t, '#c8e04a', 0.7);
        }
      }
    }
  }

  function applyHarm(h) {
    const shout = h.def.say;
    switch (h.def.harm) {
      case 'hard':
        crash('hard', shout);
        break;
      case 'soft':
        crash('soft', shout);
        break;
      case 'clip':
        buggy.speed *= 0.74;
        buggy.tvel *= 0.4;
        shake = Math.max(shake, 4);
        breakCombo(false);
        game.audio.scrape();
        addFx('puff', h.s, h.t, { life: 0.35 });
        floatText(shout || 'OI!', h.s, h.t, '#ffd24a', 0.8);
        break;
      case 'jolt':
        buggy.speed *= 0.9;
        buggy.scatter = 1;
        shake = Math.max(shake, 5);
        game.audio.scrape();
        floatText('JOLT!', h.s, h.t, '#ffd24a', 0.6);
        break;
      case 'slip':
        buggy.slip = 0.85;
        buggy.tvel += (rng.chance(0.5) ? 1 : -1) * 3.4;
        game.audio.scrape();
        addFx('splash', h.s, h.t, { life: 0.5 });
        floatText(shout || 'SLIP!', h.s, h.t, '#7fb0e0', 0.8);
        break;
      default:
        break;
    }
  }

  function updatePickups() {
    for (const p of route.pickups) {
      if (p.taken) continue;
      if (Math.abs(p.s - buggy.s) > 1.8 || Math.abs(p.t - buggy.t) > 2.0) continue;
      p.taken = true;
      p.def.apply(run, buggy, stats);
      if (p.kind === 'papers') lowAmmoWarned = false;
      run.score += 60;
      floatText(p.def.name, p.s, p.t, p.def.colour, 1.2);
      game.audio.pickup();
      addFx('spark', p.s, p.t, { life: 0.4 });
    }
  }

  function updateSuper(dt) {
    if (!sup || !sup.active) return;
    // He closes at a steady walk-plus; only a stalled cart lets him arrive.
    const target = buggy.s - 16;
    sup.s += Math.max(6, buggy.speed * 0.82) * dt;
    if (sup.s < target - 26) sup.s = target - 26;
    if (sup.shout > 0) sup.shout -= dt;

    if (sup.s > buggy.s - 3.5) {
      sup.s = buggy.s - 22;
      sup.shout = 2;
      run.caught++;
      run.score = Math.max(0, run.score - 250);
      breakCombo(true);
      shake = Math.max(shake, 5);
      game.audio.sad();
      floatText('WHERE IS MY COFFEE?!', buggy.s + 3, buggy.t, '#ff7a3d', 1.8);
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

    // Dust off the back wheels: more of it off-road, more of it at speed.
    const dustChance = (buggy.offRoad ? 0.5 : 0.12) * clamp(buggy.speed / 12, 0, 1);
    if (rng.chance(dustChance)) {
      addFx('dust', buggy.s - 1.4, buggy.t + rng.range(-0.9, 0.9),
        { life: 0.4 + rng.next() * 0.3, drift: rng.range(-0.6, 0.6) });
    }

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

    for (const key of ['shield', 'confusion', 'bombaTime']) {
      if (run[key] > 0) run[key] = Math.max(0, run[key] - dt);
    }

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
      updateSuper(dt);

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
      const f = fx[i];
      f.age += dt;
      if (f.kind === 'dust') f.t += (f.drift || 0) * dt;
      if (f.kind === 'paper') { f.t += (f.vt || 0) * dt; f.z = (f.z || 0) + (f.vz || 0) * dt - 4 * dt * dt; }
      if (f.age >= f.life) fx.splice(i, 1);
    }
    for (const tg of route.targets) {
      if (tg.react > 0) tg.react -= dt;
      if (tg.barkAt > 0) tg.barkAt -= dt;
    }
    if (shake > 0) shake = Math.max(0, shake - dt * 22);

    game.audio.engine(clamp(buggy.speed / (level.speedCap + stats.speedBonus), 0, 1), input.held('gas'));
    game.audio.setTrack({
      bpm: level.bpm,
      scale: level.scale,
      root: level.root,
      energy: clamp(0.35 + run.combo * 0.06 + (run.bombaTime > 0 ? 0.3 : 0), 0, 1),
    });
  }

  // --- rendering --------------------------------------------------------

  function push(s, fn) { renderList.push({ s, fn }); }

  /** A scaffold tower, drawn rather than stamped so it can be any height. */
  function drawScaffold(ctx, x, y, bays = 3) {
    const w = 26;
    const bayH = 14;
    const left = Math.round(x - w / 2);
    const base = Math.round(y);
    for (let i = 0; i < bays; i++) {
      const top = base - (i + 1) * bayH;
      ctx.fillStyle = PAL.G;
      ctx.fillRect(left, top, 2, bayH);
      ctx.fillRect(left + w - 2, top, 2, bayH);
      ctx.fillStyle = PAL.H;
      ctx.fillRect(left, top, w, 1);
      // Diagonal brace.
      for (let d = 0; d < w - 3; d += 2) {
        ctx.fillRect(left + 2 + d, top + bayH - 2 - Math.round(d * (bayH - 4) / (w - 3)), 2, 2);
      }
      // Plank deck.
      ctx.fillStyle = PAL.s;
      ctx.fillRect(left - 1, top - 2, w + 2, 3);
      ctx.fillStyle = PAL.S;
      ctx.fillRect(left - 1, top + 1, w + 2, 1);
    }
    ctx.fillStyle = PAL.k;
    ctx.fillRect(left, base - 1, 3, 2);
    ctx.fillRect(left + w - 3, base - 1, 3, 2);
  }

  function drawTarget(tg) {
    const x = road.projectX(tg.s, tg.t);
    const y = road.projectY(tg.s, tg.t);
    if (x < -50 || x > VIEW_W + 50 || y < -60 || y > VIEW_H + 40) return null;

    const look = tg.def.rig || tg.def.bonus || tg.def.wide
      ? tg.def.sprite
      : CREW_LOOKS[tg.variant % CREW_LOOKS.length];
    const cheer = tg.def.rig || tg.def.bonus || tg.def.wide
      ? tg.def.cheer
      : CREW_CHEERS[tg.variant % CREW_CHEERS.length];

    return () => {
      const ctx = game.ctx;
      if (tg.def.rig === 'scaffold') {
        drawScaffold(ctx, x, y, 3);
        const bob = tg.react > 0 ? Math.round(Math.sin(tg.react * 22)) : 0;
        drawSprite(ctx, tg.react > 0 ? cheer : look, x, y - 42 + bob, { ax: 0.5, ay: 1 });
      } else if (tg.def.wide) {
        road.shadow(ctx, tg.s, tg.t, 22);
        drawSprite(ctx, 'cooler', x + 14, y, { ax: 0.5, ay: 1 });
        drawSprite(ctx, 'workerSit', x - 8, y, { ax: 0.5, ay: 1 });
        drawSprite(ctx, tg.react > 0 ? cheer : 'workerSit', x + 4, y - 1, { ax: 0.5, ay: 1, flip: true });
      } else {
        road.shadow(ctx, tg.s, tg.t, 11);
        const bob = tg.react > 0 ? Math.round(Math.sin(tg.react * 24)) : 0;
        drawSprite(ctx, tg.react > 0 ? cheer : look, x, y + bob, { ax: 0.5, ay: 1 });
      }

      if (!tg.hit) {
        // A small ear-marker so a target reads as a target at speed.
        const pulse = (Math.sin(run.time * 5 + tg.s) + 1) / 2;
        ctx.fillStyle = pulse > 0.5 ? '#ffd24a' : '#8a6410';
        const my = y - (tg.def.rig === 'scaffold' ? 66 : tg.def.wide ? 26 : 26);
        ctx.fillRect(Math.round(x) - 2, Math.round(my), 4, 4);
        ctx.fillRect(Math.round(x) - 1, Math.round(my) - 3, 2, 3);
      }
      if (tg.barkAt > 0) drawBubble(ctx, tg.bark, x, y - (tg.def.rig === 'scaffold' ? 82 : 36), Math.min(1, tg.barkAt));
    };
  }

  function drawHazard(h) {
    const swinging = h.def.mobile === 'swing';
    const x = road.projectX(h.s, h.t);
    const y = road.projectY(h.s, h.t);
    if (x < -60 || x > VIEW_W + 60 || y < -70 || y > VIEW_H + 50) return null;

    return () => {
      const ctx = game.ctx;
      if (!h.def.decal) {
        road.shadow(ctx, h.s, h.t, h.def.harm === 'hard' ? 18 : 10, swinging ? 0.5 : 1);
      }
      const flip = (h.def.mobile === 'cross' || h.def.mobile === 'walk') && h.dir < 0;

      if (swinging) {
        // Hook hangs from above; draw the line up out of frame.
        ctx.fillStyle = PAL.g;
        ctx.fillRect(Math.round(x), 0, 1, Math.max(0, Math.round(y) - 44));
      }
      drawSprite(ctx, h.def.sprite, x, y, { ax: 0.5, ay: h.def.decal ? 0.5 : 1, flip });

      // Crew obstacles that come as a pair or a huddle.
      if (h.def.crowd) {
        drawSprite(ctx, 'workerSit', x - 14, y, { ax: 0.5, ay: 1 });
        drawSprite(ctx, 'cooler', x + 13, y, { ax: 0.5, ay: 1 });
      }
      if (h.def.carry) {
        drawSprite(ctx, 'workerY', x - 16, y + 2, { ax: 0.5, ay: 1 });
        drawSprite(ctx, 'worker', x + 16, y + 2, { ax: 0.5, ay: 1, flip: true });
      }
      if (h.def.spill) {
        drawSprite(ctx, 'toolbox', x + 12, y, { ax: 0.5, ay: 1 });
      }
      if (h.def.tape) {
        drawSprite(ctx, 'workerY', x + 22, y, { ax: 0.5, ay: 1, flip: true });
        ctx.fillStyle = PAL.y;
        ctx.fillRect(Math.round(x) + 6, Math.round(y) - 14, 16, 1);
      }

      if (h.state === 'warn' && Math.floor(run.time * 12) % 2 === 0) {
        drawSprite(ctx, 'arrow', x, road.projectY(h.s, h.t) - 30, { ax: 0.5, ay: 1 });
      }
      if (h.sayAt > 0 && h.def.say && h.def.family === 'crew') {
        drawBubble(ctx, h.def.say, x, y - 34, Math.min(1, h.sayAt));
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
      if (!h.def.decal || !road.isVisible(h.s)) continue;
      drawSprite(ctx, h.def.sprite, road.projectX(h.s, h.t), road.projectY(h.s, h.t), { ax: 0.5, ay: 0.5 });
    }

    renderList.length = 0;

    // A wet pour did not appear on its own: park the truck that made it on the
    // shoulder, so the hazard has a cause you can see coming.
    for (const h of route.hazards) {
      if (h.kind !== 'concretePour' || !road.isVisible(h.s, 20)) continue;
      const side = h.t >= 0 ? 1 : -1;
      const mt = side * (ROAD.edge + 3.4);
      push(h.s + 2, () => {
        road.shadow(ctx, h.s + 2, mt, 26);
        drawSprite(ctx, 'mixer', road.projectX(h.s + 2, mt), road.projectY(h.s + 2, mt),
          { ax: 0.5, ay: 1, flip: side < 0 });
      });
    }

    // Landmarks first in the list — they are far off the shoulder and tall, so
    // they need a generous cull margin or they pop in at the edge of frame.
    for (const lm of route.landmarks) {
      if (!road.isVisible(lm.s, 70)) continue;
      const x = road.projectX(lm.s, lm.t);
      const y = road.projectY(lm.s, lm.t);
      if (x < -120 || x > VIEW_W + 120) continue;
      push(lm.s, () => drawSprite(ctx, lm.kind, x, y, { ax: 0.5, ay: 1 }));
    }

    for (const sc of route.scenery) {
      if (!road.isVisible(sc.s, 24)) continue;
      const x = road.projectX(sc.s, sc.t);
      const y = road.projectY(sc.s, sc.t);
      if (x < -40 || x > VIEW_W + 40) continue;
      push(sc.s, () => {
        road.shadow(ctx, sc.s, sc.t, 9);
        drawSprite(ctx, sc.kind, x, y, { ax: 0.5, ay: 1, flip: sc.t < 0 });
      });
    }

    for (const p of route.pickups) {
      if (p.taken || !road.isVisible(p.s)) continue;
      const x = road.projectX(p.s, p.t);
      const y = road.projectY(p.s, p.t);
      const bob = Math.round(Math.sin(run.time * 4 + p.s) * 2);
      push(p.s, () => {
        road.shadow(ctx, p.s, p.t, 9);
        // A little halo so fuel reads as fuel at speed.
        ctx.fillStyle = 'rgba(255,210,74,0.18)';
        ctx.fillRect(Math.round(x) - 9, Math.round(y) - 20, 18, 18);
        drawSprite(ctx, p.def.sprite, x, y + bob, { ax: 0.5, ay: 1 });
      });
    }

    for (const h of route.hazards) {
      if (h.def.decal || h.state === 'gone' || !road.isVisible(h.s, 20)) continue;
      const fn = drawHazard(h);
      if (fn) push(h.s, fn);
    }

    for (const tg of route.targets) {
      if (!road.isVisible(tg.s, 28)) continue;
      const fn = drawTarget(tg);
      if (fn) push(tg.s, fn);
    }

    if (sup && sup.active && road.isVisible(sup.s, 10)) {
      push(sup.s, () => {
        const x = road.projectX(sup.s, 0);
        const y = road.projectY(sup.s, 0);
        road.shadow(ctx, sup.s, 0, 11);
        drawSprite(ctx, 'super', x, y, { ax: 0.5, ay: 1 });
        if (sup.shout > 0) drawBubble(ctx, 'FEDERICO!', x, y - 36, Math.min(1, sup.shout));
      });
    }

    // The cart.
    push(buggy.s, () => {
      const x = road.projectX(buggy.s, buggy.t);
      const y = road.projectY(buggy.s, buggy.t);
      road.shadow(ctx, buggy.s, buggy.t, 18);
      const blink = buggy.invuln > 0 && Math.floor(run.time * 20) % 2 === 0;
      if (!blink) {
        const name = buggy.crashT > 0
          ? 'cartWreck'
          : buggy.lean < -0.35 ? 'cartLeft' : buggy.lean > 0.35 ? 'cartRight' : 'cart';
        const jitter = buggy.crashT > 0 ? Math.round(Math.sin(run.time * 40) * 2) : 0;
        drawSprite(ctx, name, x + jitter, y, { ax: 0.5, ay: 1 });
      }
      if (run.shield > 0) {
        ctx.fillStyle = `rgba(200,224,74,${0.25 + 0.15 * Math.sin(run.time * 9)})`;
        ctx.fillRect(Math.round(x) - 14, Math.round(y) - 26, 28, 28);
      }
    });

    for (const sh of sheets) {
      if (!sh.alive) continue;
      const x = road.projectX(sh.s, sh.t);
      const y = road.projectY(sh.s, sh.t) - sh.z * 9;
      push(sh.s + 0.1, () => {
        road.shadow(ctx, sh.s, sh.t, 5, 0.6);
        drawSprite(ctx, 'sheet', x, y, { ax: 0.5, ay: 0.5, flip: Math.floor(sh.spin) % 2 === 0 });
      });
    }

    renderList.sort((a, b) => b.s - a.s);
    for (const item of renderList) item.fn();

    // FX above the world but under the HUD.
    for (const f of fx) {
      const k = f.age / f.life;
      const x = road.projectX(f.s, f.t);
      const y = road.projectY(f.s, f.t) - (f.z ? f.z * 9 : 0);
      if (f.kind === 'text') {
        drawText(ctx, f.text, x, y - 14 - k * f.rise, {
          color: f.color, align: 'center', shadow: '#14121a',
        });
      } else if (f.kind === 'puff') {
        drawSprite(ctx, 'puff', x, y, { ax: 0.5, ay: 0.5, alpha: 1 - k, scale: f.big ? 1.6 : 1 });
      } else if (f.kind === 'dust') {
        ctx.fillStyle = `rgba(196,172,128,${0.4 * (1 - k)})`;
        const r = 1 + k * 4;
        ctx.fillRect(Math.round(x - r), Math.round(y - r * 0.5 - k * 6), Math.round(r * 2), Math.round(r));
      } else if (f.kind === 'paper') {
        ctx.fillStyle = `rgba(253,246,224,${1 - k})`;
        ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
      } else if (f.kind === 'spark') {
        drawSprite(ctx, 'spark', x, y, { ax: 0.5, ay: 0.5, alpha: 1 - k });
      } else if (f.kind === 'splash') {
        drawSprite(ctx, 'splash', x, y, { ax: 0.5, ay: 0.5, alpha: 1 - k });
      }
    }

    road.drawWeather(ctx, 1 / 60);
    road.drawGrade(ctx);
    ctx.restore();

    drawHud(ctx, { game, level, run, buggy, route, stats, sup });
    if (bannerT > 0) drawBanner(ctx, banner, Math.min(1, bannerT));
  }

  return { update, render, run, road, buggy, route, name: 'run' };
}

function drawBubble(ctx, text, x, y, alpha = 1) {
  const w = textWidth(text);
  const bx = Math.round(clamp(x - w / 2 - 4, 3, VIEW_W - w - 11));
  const by = Math.round(y);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#14121a';
  ctx.fillRect(bx - 1, by - 1, w + 10, 13);
  ctx.fillStyle = '#fdf6e0';
  ctx.fillRect(bx, by, w + 8, 11);
  drawText(ctx, text, bx + 4, by + 2, { color: '#14121a' });
  ctx.fillStyle = '#fdf6e0';
  ctx.fillRect(Math.round(clamp(x, bx + 4, bx + w)), by + 11, 3, 3);
  ctx.fillStyle = '#14121a';
  ctx.fillRect(Math.round(clamp(x, bx + 4, bx + w)), by + 14, 3, 1);
  ctx.restore();
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

export { clamp };
