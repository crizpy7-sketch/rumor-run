// Everything that is not the run: the title attract loop, the shift brief, the
// results board, the stores, and the payoff at the trailer office.

import { Road, ROAD, VIEW_W, VIEW_H } from './road.js';
import { drawSprite, PAL } from '../art/sprites.js';
import { drawText, wrapText } from '../art/glyphs.js';
import { drawScreenFrame, panel, tape, INK, PAPER, GOLD, LIME, EMBER, DIM } from './hud.js';
import { offerUpgrades } from './levels.js';
import { RUMOR_SEED } from './rumor.js';

/**
 * The site trailer: a box on blocks with a light over the door. Drawn rather
 * than stamped because it is the biggest thing in the game and wants to be
 * bigger than any sprite grid I would want to hand-author.
 */
export function drawTrailer(ctx, x, y, w = 96, h = 46) {
  const left = Math.round(x - w / 2);
  const top = Math.round(y - h);

  // Body.
  ctx.fillStyle = PAL.k;
  ctx.fillRect(left - 1, top - 1, w + 2, h + 2);
  ctx.fillStyle = PAL.M;
  ctx.fillRect(left, top, w, h);
  ctx.fillStyle = PAL.m;
  ctx.fillRect(left, top + h - 10, w, 10);
  // Corrugation.
  ctx.fillStyle = PAL.n;
  for (let i = 2; i < w; i += 4) ctx.fillRect(left + i, top + 6, 1, h - 16);
  // Roof lip and an air-con box.
  ctx.fillStyle = PAL.G;
  ctx.fillRect(left - 2, top - 3, w + 4, 4);
  ctx.fillStyle = PAL.H;
  ctx.fillRect(left - 2, top - 3, w + 4, 1);
  ctx.fillStyle = PAL.G;
  ctx.fillRect(left + w - 30, top - 11, 20, 9);
  ctx.fillStyle = PAL.H;
  ctx.fillRect(left + w - 28, top - 9, 16, 5);

  // Windows.
  for (const wx of [8, 30]) {
    ctx.fillStyle = PAL.k;
    ctx.fillRect(left + wx, top + 8, 18, 14);
    ctx.fillStyle = PAL.u;
    ctx.fillRect(left + wx + 1, top + 9, 16, 12);
    ctx.fillStyle = PAL.C;
    ctx.fillRect(left + wx + 1, top + 9, 16, 3);
    ctx.fillStyle = PAL.k;
    ctx.fillRect(left + wx + 8, top + 8, 1, 14);
  }
  // Door with a lit window and a step.
  const dx = left + w - 26;
  ctx.fillStyle = PAL.k;
  ctx.fillRect(dx, top + 6, 18, h - 6);
  ctx.fillStyle = PAL.C;
  ctx.fillRect(dx + 1, top + 7, 16, h - 8);
  ctx.fillStyle = PAL.y;
  ctx.fillRect(dx + 4, top + 10, 10, 8);
  ctx.fillStyle = PAL.k;
  ctx.fillRect(dx + 14, top + 24, 2, 3);
  ctx.fillStyle = PAL.G;
  ctx.fillRect(dx - 2, top + h, 22, 3);
  ctx.fillRect(dx + 1, top + h + 3, 16, 3);

  // Light over the door, and the pool it throws.
  ctx.fillStyle = PAL.k;
  ctx.fillRect(dx + 6, top + 1, 8, 4);
  ctx.fillStyle = PAL.W;
  ctx.fillRect(dx + 7, top + 2, 6, 2);
  const g = ctx.createRadialGradient(dx + 10, top + 6, 2, dx + 10, top + 6, 46);
  g.addColorStop(0, 'rgba(255,226,150,0.30)');
  g.addColorStop(1, 'rgba(255,226,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(dx - 40, top - 10, 100, h + 40);

  // Blocks it stands on.
  ctx.fillStyle = PAL.g;
  ctx.fillRect(left + 6, top + h, 8, 5);
  ctx.fillRect(left + w - 16, top + h, 8, 5);
  // A sign by the door.
  ctx.fillStyle = PAL.k;
  ctx.fillRect(left + 4, top + h - 13, 30, 11);
  ctx.fillStyle = PAL.y;
  ctx.fillRect(left + 5, top + h - 12, 28, 9);
  drawText(ctx, 'SITE', left + 7, top + h - 10, { color: INK });
}

// --- title -----------------------------------------------------------------

export function createTitleScene(game) {
  const road = new Road('dusk');
  let time = 0;
  let cartT = 0;
  const crews = [];
  for (let i = 0; i < 26; i++) {
    crews.push({
      s: i * 26 + 20,
      t: (i % 2 ? 1 : -1) * (ROAD.edge + 2 + (i % 3)),
      look: ['worker', 'workerY', 'workerDark', 'workerO'][i % 4],
    });
  }

  function update(dt) {
    time += dt;
    road.camS += 13 * dt;
    cartT = Math.sin(time * 0.9) * 3.4;
    game.audio.setTrack({ bpm: 96, scale: 'work', root: 0, energy: 0.4 });
    if (game.input.hit('confirm')) {
      game.audio.pickup();
      game.startRun();
    }
  }

  function render() {
    const ctx = game.ctx;
    road.drawGround(ctx);
    road.drawSurface(ctx);

    const items = [];
    for (const c of crews) {
      const cs = ((c.s - road.camS) % 676 + 676) % 676 + road.camS - 60;
      if (!road.isVisible(cs, 24)) continue;
      items.push({ s: cs, fn: () => {
        const x = road.projectX(cs, c.t);
        const y = road.projectY(cs, c.t);
        road.shadow(ctx, cs, c.t, 10);
        const waving = Math.floor(time * 3 + c.s) % 4 === 0;
        drawSprite(ctx, waving ? 'workerCheer' : c.look, x, y, { ax: 0.5, ay: 1 });
      } });
    }
    const bs = road.camS - 8;
    items.push({ s: bs, fn: () => {
      const x = road.projectX(bs, cartT);
      const y = road.projectY(bs, cartT);
      road.shadow(ctx, bs, cartT, 18);
      const lean = Math.cos(time * 0.9);
      drawSprite(ctx, lean < -0.4 ? 'cartLeft' : lean > 0.4 ? 'cartRight' : 'cart', x, y, { ax: 0.5, ay: 1 });
    } });
    items.sort((a, b) => b.s - a.s);
    for (const it of items) it.fn();
    road.drawGrade(ctx);

    // Title plate.
    panel(ctx, 0, 34, VIEW_W, 74, 0.74);
    tape(ctx, 0, 34, VIEW_W, 3);
    tape(ctx, 0, 105, VIEW_W, 3);
    drawText(ctx, 'RUMOR', VIEW_W / 2, 42, { color: GOLD, align: 'center', scale: 4, shadow: INK });
    drawText(ctx, 'RUN', VIEW_W / 2, 76, { color: PAPER, align: 'center', scale: 4, shadow: INK });

    panel(ctx, 60, 114, VIEW_W - 120, 42, 0.72);
    drawText(ctx, 'DELIVER THE RUMORS.', VIEW_W / 2, 118, { color: PAPER, align: 'center', shadow: INK });
    drawText(ctx, 'DODGE THE DRAMA.', VIEW_W / 2, 130, { color: EMBER, align: 'center', shadow: INK });
    drawText(ctx, 'PICK UP BOMBA.', VIEW_W / 2, 142, { color: LIME, align: 'center', shadow: INK });

    // A phone player has no Q key; tell them about the controls they have.
    const help = game.touch
      ? ['ARROW PADS  STEER', 'THROW BUTTONS  LEFT / RIGHT',
         'SLOW  EASE OFF THE GAS', 'THE THROTTLE HOLDS ITSELF']
      : ['ARROWS / WASD  DRIVE', 'Q OR Z  THROW LEFT',
         'E OR X  THROW RIGHT', 'SPACE  THROW NEAREST'];
    panel(ctx, 40, 172, VIEW_W - 80, 54, 0.68);
    help.forEach((line, i) => {
      drawText(ctx, line, VIEW_W / 2, 177 + i * 12, { color: DIM, align: 'center' });
    });

    if (Math.floor(time * 2) % 2 === 0) {
      drawText(ctx, game.touch ? 'TAP TO CLOCK IN' : 'PRESS ENTER TO CLOCK IN',
        VIEW_W / 2, 246, { color: GOLD, align: 'center', shadow: INK });
    }
  }

  return { update, render, name: 'title' };
}

// --- shift brief -----------------------------------------------------------

export function createBriefScene(game, levelIndex) {
  const level = game.levels[levelIndex];
  let time = 0;

  const chaosLabels = {
    rain: 'RAIN — THE SURFACE IS SLIPPERY',
    wind: 'WIND — LOOSE PIPES ROLL',
    night: 'NIGHT SHIFT — LOW VISIBILITY',
    collapse: 'SCAFFOLD COMING DOWN — RUN',
    superintendent: 'THE SUPER IS LOOKING FOR YOU',
  };

  function update(dt) {
    time += dt;
    game.audio.setTrack({ bpm: level.bpm, scale: level.scale, root: level.root, energy: 0.3 });
    if (time > 0.3 && game.input.hit('confirm')) {
      game.audio.pickup();
      game.enterRun(levelIndex);
    }
  }

  function render() {
    const ctx = game.ctx;
    drawScreenFrame(ctx, `SHIFT ${level.id}`, { subtitle: level.name });

    wrapText(level.blurb, VIEW_W - 60).forEach((l, i) =>
      drawText(ctx, l, VIEW_W / 2, 52 + i * 11, { color: PAPER, align: 'center' }));

    panel(ctx, 22, 84, VIEW_W - 44, 50, 0.9);
    drawText(ctx, 'THE STORY RIGHT NOW', VIEW_W / 2, 88, { color: DIM, align: 'center' });
    wrapText(game.state.rumor, VIEW_W - 60).forEach((l, i) =>
      drawText(ctx, l, VIEW_W / 2, 102 + i * 11, { color: GOLD, align: 'center' }));

    drawText(ctx, `DELIVER TO ${level.quota} CREWS TO CLEAR THE GATE`, VIEW_W / 2, 146,
      { color: LIME, align: 'center' });
    drawText(ctx, `PAPER ${game.stats.sheetMax}   THROW ${game.stats.throwRange}M   TOP ${level.speedCap + game.stats.speedBonus}M/S`,
      VIEW_W / 2, 160, { color: DIM, align: 'center' });

    const chaos = Object.keys(level.chaos).filter((k) => level.chaos[k]);
    chaos.forEach((k, i) => {
      drawText(ctx, chaosLabels[k] || k.toUpperCase(), VIEW_W / 2, 178 + i * 11,
        { color: EMBER, align: 'center' });
    });

    if (game.stats.owned.length) {
      const kit = game.stats.owned.map((id) => id.toUpperCase()).join(' ');
      wrapText(`KIT: ${kit}`, VIEW_W - 44).forEach((l, i) =>
        drawText(ctx, l, VIEW_W / 2, 232 + i * 10, { color: DIM, align: 'center' }));
    }

    if (Math.floor(time * 2) % 2 === 0) {
      drawText(ctx, game.touch ? 'TAP TO ROLL OUT' : 'ENTER TO ROLL OUT',
        VIEW_W / 2, 264, { color: GOLD, align: 'center' });
    }
  }

  return { update, render, name: 'brief' };
}

// --- results ---------------------------------------------------------------

export function createResultsScene(game, levelIndex, run, passed) {
  const level = game.levels[levelIndex];
  let time = 0;
  const rows = [
    ['DELIVERED', `${run.delivered}/${level.quota}`, passed ? LIME : EMBER],
    ['BULLSEYES', String(run.bullseye), GOLD],
    ['SOLID', String(run.solid), PAPER],
    ['WHISPERS', String(run.whisper), DIM],
    ['NEAR MISSES', String(run.nearMisses), LIME],
    ['CRASHES', String(run.crashes), run.crashes ? EMBER : DIM],
    ['CAUGHT BY THE SUPER', String(run.caught || 0), run.caught ? EMBER : DIM],
    ['BEST COMBO', `X${Math.max(run.comboBest, run.combo)}`, GOLD],
  ];

  function update(dt) {
    time += dt;
    game.audio.setTrack({ bpm: 92, scale: passed ? 'bright' : 'night', root: 0, energy: 0.25 });
    if (time > 0.4 && game.input.hit('confirm')) {
      game.audio.pickup();
      if (passed) game.afterResults(levelIndex, run);
      else game.enterBrief(levelIndex);
    }
  }

  function render() {
    const ctx = game.ctx;
    drawScreenFrame(ctx, passed ? 'GATE CLEARED' : 'SHIFT STALLED', {
      subtitle: level.name,
      accent: passed ? GOLD : EMBER,
    });

    rows.forEach(([label, value, color], i) => {
      const y = 48 + i * 13;
      drawText(ctx, label, 40, y, { color: DIM });
      drawText(ctx, value, VIEW_W - 40, y, { color, align: 'right' });
    });

    ctx.fillStyle = '#332f3a';
    ctx.fillRect(40, 158, VIEW_W - 80, 1);
    drawText(ctx, 'SHIFT SCORE', 40, 164, { color: PAPER });
    drawText(ctx, String(run.score), VIEW_W - 40, 164, { color: GOLD, align: 'right' });
    drawText(ctx, 'TOTAL', 40, 178, { color: PAPER });
    drawText(ctx, String(game.state.totalScore + (passed ? run.score : 0)), VIEW_W - 40, 178,
      { color: GOLD, align: 'right' });

    if (passed) {
      panel(ctx, 22, 196, VIEW_W - 44, 42, 0.9);
      drawText(ctx, 'THE STORY MOVES ON AS', VIEW_W / 2, 200, { color: DIM, align: 'center' });
      wrapText(game.state.nextRumor || game.state.rumor, VIEW_W - 60).forEach((l, i) =>
        drawText(ctx, l, VIEW_W / 2, 214 + i * 11, { color: LIME, align: 'center' }));
    } else {
      wrapText(`${level.quota - run.delivered} MORE EARS NEEDED. RUN IT AGAIN.`, VIEW_W - 60)
        .forEach((l, i) => drawText(ctx, l, VIEW_W / 2, 204 + i * 11, { color: EMBER, align: 'center' }));
    }

    if (Math.floor(time * 2) % 2 === 0) {
      drawText(ctx, passed ? (game.touch ? 'TAP' : 'ENTER') : (game.touch ? 'TAP TO RETRY' : 'ENTER TO RETRY'),
        VIEW_W / 2, 264, { color: GOLD, align: 'center' });
    }
  }

  return { update, render, name: 'results' };
}

// --- the stores ------------------------------------------------------------

export function createUpgradeScene(game, levelIndex) {
  const offers = offerUpgrades(game.rng, game.stats, 3);
  let index = 0;
  let time = 0;

  function update(dt) {
    time += dt;
    game.audio.setTrack({ bpm: 100, scale: 'bright', root: 0, energy: 0.3 });
    const dir = (game.input.hit('right') ? 1 : 0) - (game.input.hit('left') ? 1 : 0);
    if (dir) {
      index = (index + dir + offers.length) % offers.length;
      game.audio.bark(1.2);
    }
    if (time > 0.3 && game.input.hit('confirm')) {
      const pick = offers[index];
      pick.apply(game.stats);
      game.stats.owned.push(pick.id);
      game.audio.fanfare();
      game.enterBrief(levelIndex + 1);
    }
  }

  function render() {
    const ctx = game.ctx;
    drawScreenFrame(ctx, 'SITE STORES', { subtitle: 'TAKE ONE. THE SUPER IS NOT LOOKING.' });

    const cardW = 106;
    const gap = 10;
    const startX = (VIEW_W - (cardW * offers.length + gap * (offers.length - 1))) / 2;

    offers.forEach((u, i) => {
      const x = startX + i * (cardW + gap);
      const sel = i === index;
      const y = 68 + (sel ? -4 : 0);
      ctx.fillStyle = sel ? GOLD : '#332f3a';
      ctx.fillRect(x - 2, y - 2, cardW + 4, 100 + 4);
      ctx.fillStyle = '#26242c';
      ctx.fillRect(x, y, cardW, 100);
      if (sel) tape(ctx, x, y, cardW, 3);

      wrapText(u.name, cardW - 10).forEach((l, li) =>
        drawText(ctx, l, x + cardW / 2, y + 12 + li * 11, { color: sel ? GOLD : PAPER, align: 'center' }));
      wrapText(u.desc, cardW - 12).forEach((l, li) =>
        drawText(ctx, l, x + cardW / 2, y + 46 + li * 11, { color: DIM, align: 'center' }));

      const owned = game.stats.owned.filter((o) => o === u.id).length;
      for (let k = 0; k < (u.max ?? 3); k++) {
        ctx.fillStyle = k < owned ? LIME : '#332f3a';
        ctx.fillRect(x + cardW / 2 - 10 + k * 8, y + 84, 5, 5);
      }
    });

    drawText(ctx, game.touch ? 'ARROW PADS TO CHOOSE' : 'LEFT / RIGHT TO CHOOSE',
      VIEW_W / 2, 196, { color: DIM, align: 'center' });
    if (Math.floor(time * 2) % 2 === 0) {
      drawText(ctx, game.touch ? 'TAP TO TAKE IT' : 'ENTER TO TAKE IT',
        VIEW_W / 2, 212, { color: GOLD, align: 'center' });
    }
  }

  // `offers` and `select` are exposed so the harness can choose deliberately
  // instead of taking whatever happens to be under the cursor.
  return {
    update,
    render,
    name: 'upgrade',
    offers,
    get index() { return index; },
    select(i) { index = Math.max(0, Math.min(offers.length - 1, i)); },
  };
}

// --- the payoff ------------------------------------------------------------

export function createEndingScene(game) {
  let time = 0;
  let stage = 0;      // 0 pull up at the trailer, 1 the chain, 2 the punchline
  let reveal = 0;
  const road = new Road('dusk');
  road.camS = 0;
  const chain = [RUMOR_SEED, ...game.state.chain];

  function update(dt) {
    time += dt;
    game.audio.setTrack({ bpm: 108, scale: 'bright', root: 5, energy: 0.5 });

    if (stage === 0) {
      road.camS += 6 * dt;
      if (time > 4.2) { stage = 1; game.audio.fanfare(); }
      if (game.input.hit('confirm') && time > 1.2) { stage = 1; game.audio.fanfare(); }
    } else if (stage === 1) {
      reveal += dt * 1.6;
      if (reveal > chain.length + 1.2) stage = 2;
      if (game.input.hit('confirm')) { reveal = chain.length + 2; stage = 2; }
    } else if (game.input.hit('confirm')) {
      game.audio.fanfare();
      game.toTitle();
    }
  }

  function render() {
    const ctx = game.ctx;

    if (stage === 0) {
      road.drawGround(ctx);
      road.drawSurface(ctx);

      const gateS = 30;
      // The compound: fence line, floodlight, and the trailer itself.
      for (let t = -20; t <= 20; t += 3.6) {
        if (Math.abs(t) < ROAD.halfW + 1) continue;
        drawSprite(ctx, 'fence', road.projectX(gateS + 6, t), road.projectY(gateS + 6, t),
          { ax: 0.5, ay: 1 });
      }
      drawSprite(ctx, 'floodlight', road.projectX(gateS + 9, 15), road.projectY(gateS + 9, 15),
        { ax: 0.5, ay: 1 });
      drawTrailer(ctx, road.projectX(gateS, -11), road.projectY(gateS, -11));

      // Bomba, waiting by the step with his clipboard of new gossip.
      const bomT = -6.6;
      road.shadow(ctx, gateS - 5, bomT, 14);
      drawSprite(ctx, time > 2.2 ? 'bombaThumb' : 'bomba',
        road.projectX(gateS - 5, bomT), road.projectY(gateS - 5, bomT), { ax: 0.5, ay: 1 });

      const bs = Math.min(road.camS + 2, gateS - 8);
      road.shadow(ctx, bs, -2.6, 18);
      drawSprite(ctx, 'cart', road.projectX(bs, -2.6), road.projectY(bs, -2.6), { ax: 0.5, ay: 1 });
      road.drawGrade(ctx);

      panel(ctx, 0, 14, VIEW_W, 30, 0.74);
      drawText(ctx, 'THE TRAILER OFFICE', VIEW_W / 2, 20, { color: GOLD, align: 'center', scale: 2 });
      if (time > 1.6) {
        panel(ctx, 0, 236, VIEW_W, 34, 0.74);
        drawText(ctx, 'BOMBA HAS BEEN WAITING ALL SHIFT.', VIEW_W / 2, 242,
          { color: PAPER, align: 'center' });
        if (time > 2.6) {
          drawText(ctx, 'GOOD WORK, CHISME KING.', VIEW_W / 2, 256, { color: LIME, align: 'center' });
        }
      }
      return;
    }

    drawScreenFrame(ctx, 'THE STORY', { subtitle: 'GATE ONE TO GATE EIGHT' });

    const shown = Math.min(chain.length, Math.floor(reveal));
    let y = 48;
    for (let i = 0; i < shown; i++) {
      const last = i === chain.length - 1;
      for (const line of wrapText(chain[i], VIEW_W - 56)) {
        drawText(ctx, line, VIEW_W / 2, y, {
          color: last ? GOLD : i === 0 ? DIM : PAPER, align: 'center',
        });
        y += 11;
      }
      y += 2;
      if (y > 196) break;
    }

    drawText(ctx, `TOTAL ${game.state.totalScore}`, VIEW_W / 2, 200, { color: LIME, align: 'center' });

    if (stage === 2) {
      panel(ctx, 12, 214, VIEW_W - 24, 60, 0.94);
      tape(ctx, 12, 214, VIEW_W - 24, 3);
      drawSprite(ctx, 'bombaThumb', 44, 272, { ax: 0.5, ay: 1 });
      drawText(ctx, 'BOMBA HEARD EVERY VERSION.', 76, 222, { color: PAPER });
      drawText(ctx, 'AND HE HAS ONE FOR YOU:', 76, 234, { color: DIM });
      drawText(ctx, 'WAIT TILL YOU HEAR', 76, 248, { color: GOLD });
      drawText(ctx, 'ABOUT THE FOREMAN.', 76, 260, { color: GOLD });
      if (Math.floor(time * 2) % 2 === 0) {
        drawText(ctx, game.touch ? 'TAP' : 'ENTER', VIEW_W - 10, 262, { color: GOLD, align: 'right' });
      }
    }
  }

  return { update, render, name: 'ending' };
}
