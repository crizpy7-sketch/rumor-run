// Capture harness.
//
// Drives the real game in a real browser, scripts a run, screenshots the
// moments that matter and writes a report. This is how the game gets looked at
// without a human sitting in front of it:
//
//   node tools/shoot.mjs            # the standard tour
//   node tools/shoot.mjs --level 6  # jump straight into one shift
//
// Shots land in shots/rr-tour/ and the report in shots/rr-tour/report.json.

import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
import { launchOptions } from './browser.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'shots', 'rr-tour');
const PORT = 8137;

const args = process.argv.slice(2);
const levelArg = args.includes('--level') ? Number(args[args.indexOf('--level') + 1]) : null;

const shots = [];
const errors = [];

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const { server } = await serve(PORT);

  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({ viewport: { width: 576, height: 432 } });

  page.on('pageerror', (err) => errors.push(String(err.stack || err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction('window.RUMOR_RUN && window.RUMOR_RUN.version === 1', { timeout: 10000 });

  const shot = async (name, note) => {
    const file = join(OUT, `${String(shots.length + 1).padStart(2, '0')}-${name}.png`);
    await page.locator('#screen').screenshot({ path: file });
    shots.push({ name, note, file: file.replace(ROOT, '') });
  };

  const frames = (n) => page.evaluate((count) => new Promise((done) => {
    let left = count;
    const tick = () => (--left <= 0 ? done(true) : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  }), n);

  const tap = async (action, holdFrames = 2) => {
    await page.evaluate((a) => window.RUMOR_RUN.input.press(a), action);
    await frames(holdFrames);
    await page.evaluate((a) => window.RUMOR_RUN.input.release(a), action);
    await frames(1);
  };

  const hold = (action) => page.evaluate((a) => window.RUMOR_RUN.input.press(a), action);
  const letGo = (action) => page.evaluate((a) => window.RUMOR_RUN.input.release(a), action);
  const sceneName = () => page.evaluate(() => window.RUMOR_RUN.scene.name);

  // --- title ------------------------------------------------------------
  await frames(90);
  await shot('title', 'attract loop: the route scrolls behind the plate');

  // --- brief ------------------------------------------------------------
  await tap('confirm');
  await frames(20);
  await shot('brief', 'shift brief with the rumour as it currently stands');

  // Jump levels if asked, by driving the state machine directly.
  if (levelArg && levelArg > 1) {
    await page.evaluate((lv) => window.RUMOR_RUN.game.enterBrief(lv - 1), levelArg);
    await frames(20);
    await shot('brief-jump', `jumped to shift ${levelArg}`);
  }

  // --- run --------------------------------------------------------------
  await tap('confirm');
  await frames(30);
  await shot('run-start', 'first metres of the route');

  await hold('gas');
  await frames(120);
  await shot('run-cruise', 'cruising: road, crews, hazards, HUD');

  // Throw a handful of sheets both ways while weaving.
  for (let i = 0; i < 14; i++) {
    await tap(i % 2 ? 'throwRight' : 'throwLeft', 2);
    await frames(14);
    if (i === 3) await shot('run-throw', 'sheets in flight');
    if (i % 4 === 0) { await hold('right'); await frames(10); await letGo('right'); }
    if (i % 4 === 2) { await hold('left'); await frames(10); await letGo('left'); }
  }
  await shot('run-mid', 'mid-route after a dozen throws');

  // Deliberately drive into whatever is next to provoke a crash.
  await page.evaluate(() => {
    const s = window.RUMOR_RUN.scene;
    const next = s.route.hazards.find((h) => h.s > s.buggy.s + 6 && !h.def.decal && h.def.harm === 'hard');
    if (next) { s.buggy.t = next.t; s.buggy.s = next.s - 6; }
  });
  await frames(40);
  await shot('run-crash', 'a hard hazard taken head on');

  await letGo('gas');

  // --- results / upgrades ----------------------------------------------
  // Fast-forward to the end of the route with a healthy delivery count so the
  // pass path is what gets captured.
  await page.evaluate(() => {
    const s = window.RUMOR_RUN.scene;
    const level = window.RUMOR_RUN.game.levels[window.RUMOR_RUN.game.state.levelIndex];
    let n = 0;
    for (const tg of s.route.targets) {
      if (n >= level.quota + 1) break;
      if (!tg.hit) { tg.hit = true; s.run.delivered++; s.run[n % 3 === 0 ? 'bullseye' : 'solid']++; n++; }
    }
    s.run.score += 4200;
    s.buggy.s = s.route.length;
  });
  await page.waitForFunction(() => window.RUMOR_RUN.scene.name === 'results', { timeout: 8000 });
  await frames(30);
  await shot('results', 'shift results and the mutated rumour');

  await tap('confirm');
  await frames(24);
  const after = await sceneName();
  await shot(after === 'upgrade' ? 'upgrade' : after, 'site stores: pick one');

  if (after === 'upgrade') {
    await tap('right');
    await frames(12);
    await tap('confirm');
    await frames(24);
    await shot('brief-2', 'next shift brief, kit applied');
  }

  // --- ending -----------------------------------------------------------
  await page.evaluate(() => {
    const g = window.RUMOR_RUN.game;
    g.state.chain = [
      'FEDERICO BOUGHT A BOAT.',
      'FEDERICO BOUGHT A GOAT WITH THE OVERTIME.',
      'HE NAMED THE GOAT AFTER THE FOREMAN.',
      'THE FOREMAN CRIED. THE GOAT DID NOT.',
      'THE GOAT IS COMING TO THE SITE PARTY.',
      'BAY SEVEN BELONGS TO THE GOAT NOW.',
      'THE GOAT IS HIRING. ASK FOR THE GOAT.',
      'FEDERICO IS THE GOAT. THAT IS THE WHOLE STORY.',
    ];
    g.state.totalScore = 48210;
    g.afterResults(7, { score: 0 });
  });
  await frames(120);
  await shot('ending-gate', 'the far gate, and Bomba');
  // One tap skips the reveal to the punchline; a second would restart the game.
  await frames(240);
  await tap('confirm');
  await frames(90);
  await shot('ending-chain', 'the whole chain, gate one to gate eight');

  const fps = await page.evaluate(() => window.RUMOR_RUN.fps);

  const report = {
    at: new Date().toISOString(),
    fps: Math.round(fps * 10) / 10,
    errors,
    shots,
    level: levelArg || 1,
  };
  await writeFile(join(OUT, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);

  await browser.close();
  server.close();

  console.log(`shots: ${shots.length}  fps: ${report.fps}  errors: ${errors.length}`);
  for (const e of errors) console.log(`  ! ${e.split('\n')[0]}`);
  if (errors.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
