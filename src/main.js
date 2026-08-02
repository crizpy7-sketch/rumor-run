// Boot, scene graph and the glue between the engine and the game.

import { createLoop } from './engine/loop.js';
import { createInput } from './engine/input.js';
import { createAudio } from './engine/audio.js';
import { makeRng, hashSeed } from './engine/rng.js';
import { validateArt } from './art/sprites.js';
import { SPRITES } from './art/names.js';
import { VIEW_W, VIEW_H } from './game/road.js';
import { LEVELS, baseStats } from './game/levels.js';
import { RUMOR_SEED, fidelityTier, rumorAt } from './game/rumor.js';
import { createRunScene } from './game/play.js';
import {
  createTitleScene, createBriefScene, createResultsScene,
  createUpgradeScene, createEndingScene,
} from './game/screens.js';

export function start(canvas) {
  // Fail loudly at boot if a sprite is ragged or uses an unknown palette key.
  validateArt(SPRITES);

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const input = createInput(window);
  const audio = createAudio();

  const game = {
    ctx,
    canvas,
    input,
    audio,
    levels: LEVELS,
    rng: makeRng(hashSeed(`rumor-run:${Date.now()}`)),
    runSalt: 'a',
    stats: baseStats(),
    state: {
      levelIndex: 0,
      totalScore: 0,
      rumor: RUMOR_SEED,
      nextRumor: null,
      chain: [],
      attempts: 0,
    },
    scene: null,
    paused: false,
  };

  function setScene(scene) {
    game.scene = scene;
    game.sceneName = scene.name;
  }

  game.toTitle = () => {
    game.stats = baseStats();
    game.state = {
      levelIndex: 0, totalScore: 0, rumor: RUMOR_SEED,
      nextRumor: null, chain: [], attempts: 0,
    };
    setScene(createTitleScene(game));
  };

  game.startRun = () => {
    game.stats = baseStats();
    game.state.totalScore = 0;
    game.state.rumor = RUMOR_SEED;
    game.state.chain = [];
    game.state.nextRumor = null;
    game.runSalt = String(Math.floor(Math.random() * 1e6));
    game.enterBrief(0);
  };

  game.enterBrief = (levelIndex) => {
    game.state.levelIndex = levelIndex;
    setScene(createBriefScene(game, levelIndex));
  };

  game.enterRun = (levelIndex) => {
    game.state.levelIndex = levelIndex;
    setScene(createRunScene(game, levelIndex));
  };

  // Called by the run scene when the route ends.
  game.finishLevel = (levelIndex, run) => {
    const level = LEVELS[levelIndex];
    const passed = run.delivered >= level.quota;
    if (passed) {
      const tier = fidelityTier(run);
      game.state.nextRumor = rumorAt(levelIndex, tier);
      game.state.lastTier = tier;
    } else {
      game.state.nextRumor = null;
      game.state.attempts++;
    }
    setScene(createResultsScene(game, levelIndex, run, passed));
  };

  // Called by the results screen once the player has read it.
  game.afterResults = (levelIndex, run) => {
    game.state.totalScore += run.score;
    if (game.state.nextRumor) {
      game.state.rumor = game.state.nextRumor;
      game.state.chain.push(game.state.nextRumor);
      game.state.nextRumor = null;
    }
    if (levelIndex >= LEVELS.length - 1) setScene(createEndingScene(game));
    else setScene(createUpgradeScene(game, levelIndex));
  };

  game.touch = setupTouch(game, canvas, input, audio);

  const loop = createLoop({
    update(dt) {
      if (input.hit('mute')) audio.toggleMute();
      if (input.anyHit()) audio.unlock();
      if (input.hit('pause') && game.scene && game.scene.name === 'run') game.paused = !game.paused;
      // On a touchscreen the throttle is held for you — there is no thumb
      // spare to hold it, and a delivery round should always be rolling.
      if (game.touch && !input.held('gas')) input.press('gas');
      if (!game.paused) game.scene.update(dt);
      audio.tick();
      input.endFrame();
    },
    render() {
      game.scene.render();
      if (game.paused) drawPaused(ctx);
    },
  });

  game.toTitle();
  const refit = () => fit(canvas, game.touch);
  refit();
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', () => setTimeout(refit, 120));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', refit);
  loop.start();

  // Handle for the capture harness (tools/shoot.mjs) and for debugging.
  window.RUMOR_RUN = {
    game,
    loop,
    input,
    get scene() { return game.scene; },
    get fps() { return loop.stats.fps; },
    version: 1,
  };

  return { game, loop };
}

/**
 * Size the canvas to the viewport.
 *
 * Integer scales stay integer where there is room for them, because that is
 * what keeps pixel art crisp. Below 2x we scale fractionally anyway: a phone
 * is better served by a picture that fills the screen than by a perfectly
 * square-pixelled postage stamp floating in black.
 */
function fit(canvas, touchMode = false) {
  const portrait = window.matchMedia('(orientation: portrait)').matches;
  const vw = (window.visualViewport?.width) || window.innerWidth;
  const vh = (window.visualViewport?.height) || window.innerHeight;
  document.documentElement.style.setProperty('--pad-bottom', '0px');

  let scale;
  if (touchMode && portrait) {
    // Handheld layout: the picture is width-constrained and the control deck
    // takes whatever is left, so the width alone decides the scale. Measuring
    // the deck here instead would be circular — its height depends on this.
    scale = Math.min(vw / VIEW_W, (vh * 0.6) / VIEW_H);
  } else {
    scale = Math.min(vw / VIEW_W, vh / VIEW_H);
  }
  scale = scale >= 2 ? Math.floor(scale) : Math.max(scale, 0.5);

  canvas.style.width = `${Math.round(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.round(VIEW_H * scale)}px`;
}

/**
 * Wire the on-screen controls. Every button maps onto the same named action
 * the keyboard uses, so nothing in the game ever learns there was a
 * touchscreen involved. Returns whether touch mode is on.
 */
function setupTouch(game, canvas, input, audio) {
  const hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (!hasTouch) return false;

  document.body.classList.add('touch');
  const bar = document.getElementById('touch');
  if (!bar) return false;
  bar.setAttribute('aria-hidden', 'false');

  for (const btn of bar.querySelectorAll('[data-action]')) {
    const action = btn.dataset.action;
    const down = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('on');
      // Keep receiving the release even if the thumb slides off the button.
      if (e.pointerId !== undefined && btn.setPointerCapture) {
        try { btn.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
      }
      input.press(action);
      audio.unlock();
    };
    const up = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.remove('on');
      input.release(action);
    };
    // Pointer events only: listening for touch *and* mouse double-fires.
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Anywhere on the picture is "confirm", so menus need no dedicated button.
  // The run scene does not read confirm, so a stray tap mid-route is harmless.
  const stage = document.getElementById('stage') || canvas;
  stage.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    input.press('confirm');
    audio.unlock();
  });
  stage.addEventListener('pointerup', () => input.release('confirm'));
  stage.addEventListener('pointercancel', () => input.release('confirm'));

  return true;
}

function drawPaused(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#171418';
  ctx.fillRect(0, 90, VIEW_W, 30);
  ctx.restore();
  ctx.fillStyle = '#ffd24a';
  ctx.fillRect(0, 90, VIEW_W, 1);
  ctx.fillRect(0, 119, VIEW_W, 1);
  // Drawn with plain rects so pausing never depends on the font module.
  ctx.fillStyle = '#fdf6e0';
  const bars = [0, 1, 2, 3];
  bars.forEach((i) => ctx.fillRect(VIEW_W / 2 - 14 + i * 8, 100, 4, 10));
}
