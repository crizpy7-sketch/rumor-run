// Everything that is not the run: the title attract loop, the shift brief, the
// results board, the upgrade pick and the payoff.

import { Road, ROAD, VIEW_W, VIEW_H } from './road.js';
import { drawSprite } from '../art/sprites.js';
import { drawText, wrapText } from '../art/glyphs.js';
import { drawScreenFrame, panel, INK, PAPER, GOLD, LIME, EMBER } from './hud.js';
import { offerUpgrades } from './levels.js';
import { RUMOR_SEED } from './rumor.js';

// --- title ---------------------------------------------------------------

export function createTitleScene(game) {
  const road = new Road('dusk');
  const t0 = performance.now();
  let time = 0;
  let buggyT = 0;
  const crews = [];
  for (let i = 0; i < 24; i++) {
    crews.push({ s: i * 26 + 20, t: (i % 2 ? 1 : -1) * (ROAD.edge + 2 + (i % 3)) });
  }

  function update(dt) {
    time += dt;
    road.camS += 13 * dt;
    buggyT = Math.sin(time * 0.9) * 3.4;
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
      const cs = ((c.s - road.camS) % 624 + 624) % 624 + road.camS - 40;
      if (!road.isVisible(cs, 20)) continue;
      items.push({ s: cs, fn: () => {
        const x = road.projectX(cs, c.t);
        const y = road.projectY(cs, c.t);
        road.shadow(ctx, cs, c.t, 7);
        drawSprite(ctx, Math.floor(time * 3 + c.s) % 4 === 0 ? 'workerCheer' : 'worker', x, y, { ax: 0.5, ay: 1 });
      } });
    }
    const bs = road.camS - 6;
    items.push({ s: bs, fn: () => {
      const x = road.projectX(bs, buggyT);
      const y = road.projectY(bs, buggyT);
      road.shadow(ctx, bs, buggyT, 12);
      const lean = Math.cos(time * 0.9);
      drawSprite(ctx, lean < -0.4 ? 'buggyLeft' : lean > 0.4 ? 'buggyRight' : 'buggy', x, y, { ax: 0.5, ay: 1 });
    } });
    items.sort((a, b) => b.s - a.s);
    for (const it of items) it.fn();
    road.drawHaze(ctx);

    // Title plate.
    panel(ctx, 0, 26, VIEW_W, 52, 0.72);
    drawText(ctx, 'RUMOR', VIEW_W / 2, 30, { color: GOLD, align: 'center', scale: 3, shadow: INK });
    drawText(ctx, 'RUN', VIEW_W / 2, 54, { color: PAPER, align: 'center', scale: 3, shadow: INK });

    panel(ctx, 0, 96, VIEW_W, 20, 0.6);
    drawText(ctx, 'DELIVER THE RUMORS. DODGE THE DRAMA.', VIEW_W / 2, 99, { color: PAPER, align: 'center' });
    drawText(ctx, 'PICK UP BOMBA.', VIEW_W / 2, 108, { color: LIME, align: 'center' });

    panel(ctx, 32, 140, VIEW_W - 64, 46, 0.68);
    drawText(ctx, 'ARROWS / WASD  DRIVE', VIEW_W / 2, 144, { color: '#b9b19a', align: 'center' });
    drawText(ctx, 'Q OR Z  THROW LEFT', VIEW_W / 2, 154, { color: '#b9b19a', align: 'center' });
    drawText(ctx, 'E OR X  THROW RIGHT', VIEW_W / 2, 164, { color: '#b9b19a', align: 'center' });
    drawText(ctx, 'SPACE  THROW NEAREST', VIEW_W / 2, 174, { color: '#b9b19a', align: 'center' });

    if (Math.floor(time * 2) % 2 === 0) {
      drawText(ctx, 'PRESS ENTER TO CLOCK IN', VIEW_W / 2, 196, { color: GOLD, align: 'center', shadow: INK });
    }
  }

  return { update, render, name: 'title' };
}

// --- shift brief ---------------------------------------------------------

export function createBriefScene(game, levelIndex) {
  const level = game.levels[levelIndex];
  let time = 0;

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

    const lines = wrapText(level.blurb, VIEW_W - 40);
    lines.forEach((l, i) => drawText(ctx, l, VIEW_W / 2, 46 + i * 10, { color: PAPER, align: 'center' }));

    panel(ctx, 16, 78, VIEW_W - 32, 46, 0.9);
    drawText(ctx, 'THE STORY RIGHT NOW', VIEW_W / 2, 82, { color: '#7b7684', align: 'center' });
    const story = wrapText(game.state.rumor, VIEW_W - 44);
    story.forEach((l, i) => drawText(ctx, l, VIEW_W / 2, 94 + i * 10, { color: GOLD, align: 'center' }));

    drawText(ctx, `DELIVER TO ${level.quota} CREWS TO CLEAR THE GATE`, VIEW_W / 2, 134, { color: LIME, align: 'center' });
    drawText(ctx, `PAPER ${game.stats.sheetMax}   THROW ${game.stats.throwRange}M   TOP ${level.speedCap + game.stats.speedBonus}M/S`,
      VIEW_W / 2, 148, { color: '#b9b19a', align: 'center' });

    if (game.stats.owned.length) {
      const kit = game.stats.owned.map((id) => id.toUpperCase()).join(' ');
      wrapText(`KIT: ${kit}`, VIEW_W - 32).forEach((l, i) =>
        drawText(ctx, l, VIEW_W / 2, 162 + i * 9, { color: '#7b7684', align: 'center' }));
    }

    if (Math.floor(time * 2) % 2 === 0) {
      drawText(ctx, 'ENTER TO ROLL OUT', VIEW_W / 2, 194, { color: GOLD, align: 'center' });
    }
  }

  return { update, render, name: 'brief' };
}

// --- results -------------------------------------------------------------

export function createResultsScene(game, levelIndex, run, passed) {
  const level = game.levels[levelIndex];
  let time = 0;
  const rows = [
    ['DELIVERED', `${run.delivered}/${level.quota}`, passed ? LIME : EMBER],
    ['BULLSEYES', String(run.bullseye), GOLD],
    ['SOLID', String(run.solid), PAPER],
    ['WHISPERS', String(run.whisper), '#b9b19a'],
    ['NEAR MISSES', String(run.nearMisses), LIME],
    ['CRASHES', String(run.crashes), run.crashes ? EMBER : '#7b7684'],
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
      const y = 42 + i * 11;
      drawText(ctx, label, 28, y, { color: '#7b7684' });
      drawText(ctx, value, VIEW_W - 28, y, { color, align: 'right' });
    });

    ctx.fillStyle = '#3a3640';
    ctx.fillRect(28, 122, VIEW_W - 56, 1);
    drawText(ctx, 'SHIFT SCORE', 28, 128, { color: PAPER });
    drawText(ctx, String(run.score), VIEW_W - 28, 128, { color: GOLD, align: 'right' });
    drawText(ctx, 'TOTAL', 28, 140, { color: PAPER });
    drawText(ctx, String(game.state.totalScore + (passed ? run.score : 0)), VIEW_W - 28, 140, { color: GOLD, align: 'right' });

    if (passed) {
      panel(ctx, 16, 154, VIEW_W - 32, 30, 0.9);
      drawText(ctx, 'THE STORY MOVES ON AS', VIEW_W / 2, 158, { color: '#7b7684', align: 'center' });
      wrapText(game.state.nextRumor || game.state.rumor, VIEW_W - 44).forEach((l, i) =>
        drawText(ctx, l, VIEW_W / 2, 168 + i * 9, { color: LIME, align: 'center' }));
    } else {
      wrapText(`${level.quota - run.delivered} MORE EARS NEEDED. RUN IT AGAIN.`, VIEW_W - 40)
        .forEach((l, i) => drawText(ctx, l, VIEW_W / 2, 160 + i * 10, { color: EMBER, align: 'center' }));
    }

    if (Math.floor(time * 2) % 2 === 0) {
      drawText(ctx, passed ? 'ENTER' : 'ENTER TO RETRY', VIEW_W / 2, 198, { color: GOLD, align: 'center' });
    }
  }

  return { update, render, name: 'results' };
}

// --- upgrades ------------------------------------------------------------

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
    drawScreenFrame(ctx, 'SITE STORES', { subtitle: 'TAKE ONE. THE FOREMAN IS NOT LOOKING.' });

    const cardW = 84;
    const gap = 6;
    const startX = (VIEW_W - (cardW * offers.length + gap * (offers.length - 1))) / 2;

    offers.forEach((u, i) => {
      const x = startX + i * (cardW + gap);
      const sel = i === index;
      const y = 56 + (sel ? -3 : 0);
      ctx.fillStyle = sel ? GOLD : '#3a3640';
      ctx.fillRect(x - 1, y - 1, cardW + 2, 76 + 2);
      ctx.fillStyle = '#26242c';
      ctx.fillRect(x, y, cardW, 76);

      wrapText(u.name, cardW - 8).forEach((l, li) =>
        drawText(ctx, l, x + cardW / 2, y + 8 + li * 9, { color: sel ? GOLD : PAPER, align: 'center' }));
      wrapText(u.desc, cardW - 10).forEach((l, li) =>
        drawText(ctx, l, x + cardW / 2, y + 34 + li * 9, { color: '#b9b19a', align: 'center' }));

      const owned = game.stats.owned.filter((o) => o === u.id).length;
      for (let k = 0; k < (u.max ?? 3); k++) {
        ctx.fillStyle = k < owned ? LIME : '#3a3640';
        ctx.fillRect(x + cardW / 2 - 8 + k * 6, y + 64, 4, 4);
      }
    });

    drawText(ctx, 'LEFT / RIGHT TO CHOOSE', VIEW_W / 2, 146, { color: '#7b7684', align: 'center' });
    if (Math.floor(time * 2) % 2 === 0) {
      drawText(ctx, 'ENTER TO TAKE IT', VIEW_W / 2, 160, { color: GOLD, align: 'center' });
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

// --- the payoff ----------------------------------------------------------

export function createEndingScene(game) {
  let time = 0;
  let stage = 0;      // 0 walk-up, 1 chain, 2 punchline
  let reveal = 0;
  const road = new Road('day');
  road.camS = 0;
  const chain = [RUMOR_SEED, ...game.state.chain];

  function update(dt) {
    time += dt;
    game.audio.setTrack({ bpm: 108, scale: 'bright', root: 5, energy: 0.5 });

    if (stage === 0) {
      road.camS += 6 * dt;
      if (time > 3.2) { stage = 1; game.audio.woof(); }
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

      // The gate itself: an unbroken run of fence closing off the route, with
      // the floodlights that have been on all night.
      const gateS = 26;
      for (let t = -17; t <= 17; t += 3.2) {
        drawSprite(ctx, 'fence', road.projectX(gateS + 3, t), road.projectY(gateS + 3, t), { ax: 0.5, ay: 1 });
      }
      for (const t of [-13.5, 13.5]) {
        drawSprite(ctx, 'floodlight', road.projectX(gateS + 6, t), road.projectY(gateS + 6, t), { ax: 0.5, ay: 1 });
      }

      // Bomba waits in front of it, on the shoulder. The buggy rolls up level.
      const bomT = -7.6;
      road.shadow(ctx, gateS - 3, bomT, 20);
      drawSprite(ctx, 'bomba', road.projectX(gateS - 3, bomT), road.projectY(gateS - 3, bomT), { ax: 0.5, ay: 1, scale: 2 });

      const bs = Math.min(road.camS + 2, gateS - 4);
      road.shadow(ctx, bs, -3.2, 12);
      drawSprite(ctx, 'buggy', road.projectX(bs, -3.2), road.projectY(bs, -3.2), { ax: 0.5, ay: 1 });

      panel(ctx, 0, 12, VIEW_W, 26, 0.72);
      drawText(ctx, 'THE FAR GATE', VIEW_W / 2, 17, { color: GOLD, align: 'center', scale: 2 });
      if (time > 1.4) {
        panel(ctx, 0, 178, VIEW_W, 22, 0.72);
        drawText(ctx, 'BOMBA HAS BEEN WAITING ALL SHIFT.', VIEW_W / 2, 183, { color: PAPER, align: 'center' });
        if (time > 2.4) drawText(ctx, 'BOMBA HEARD EVERY VERSION.', VIEW_W / 2, 192, { color: LIME, align: 'center' });
      }
      return;
    }

    drawScreenFrame(ctx, 'THE STORY', { subtitle: 'GATE ONE TO GATE EIGHT' });

    const shown = Math.min(chain.length, Math.floor(reveal));
    let y = 40;
    for (let i = 0; i < shown; i++) {
      const last = i === chain.length - 1;
      const lines = wrapText(chain[i], VIEW_W - 40);
      for (const line of lines) {
        drawText(ctx, line, VIEW_W / 2, y, { color: last ? GOLD : i === 0 ? '#7b7684' : PAPER, align: 'center' });
        y += 9;
      }
      y += 2;
      if (y > 168) break;
    }

    if (stage === 2) {
      panel(ctx, 8, 168, VIEW_W - 16, 40, 0.92);
      drawSprite(ctx, 'bomba', 30, 204, { ax: 0.5, ay: 1 });
      drawText(ctx, 'BOMBA HEARD ALL OF IT.', 56, 172, { color: PAPER });
      drawText(ctx, 'BOMBA TELLS EVERYONE:', 56, 182, { color: '#7b7684' });
      drawText(ctx, 'WOOF.', 56, 192, { color: GOLD, scale: 2 });
      if (Math.floor(time * 2) % 2 === 0) {
        drawText(ctx, 'ENTER', VIEW_W - 8, 196, { color: GOLD, align: 'right' });
      }
    }

    drawText(ctx, `TOTAL ${game.state.totalScore}`, VIEW_W / 2, 158, { color: LIME, align: 'center' });
  }

  return { update, render, name: 'ending' };
}
