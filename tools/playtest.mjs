// Whole-experience regression: hand the game to an autopilot and make it play
// all eight shifts end to end.
//
//   node tools/playtest.mjs
//   node tools/playtest.mjs --levels 3 --shots
//
// Reports, per shift, what the autopilot managed and whether the quota was
// reachable at all. Exits non-zero if the game threw, or if a shift could not
// be cleared — a level nobody can clear is a bug, not a difficulty setting.

import { chromium } from 'playwright';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'shots', 'rr-playtest');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const PORT = 8141;

const args = process.argv.slice(2);
const levelCount = args.includes('--levels') ? Number(args[args.indexOf('--levels') + 1]) : 8;
const wantShots = args.includes('--shots');

async function main() {
  if (wantShots) { await rm(OUT, { recursive: true, force: true }); await mkdir(OUT, { recursive: true }); }
  const { server } = await serve(PORT);
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 576, height: 432 } });

  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e)));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text()); });

  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction('window.RUMOR_RUN && window.RUMOR_RUN.version === 1', { timeout: 10000 });
  await page.addScriptTag({ content: await readFile(join(ROOT, 'tools/bot.js'), 'utf8') });
  // Same fixed 1/60 step, more steps per frame: eight shifts in minutes, not
  // the twenty they take in real time.
  const speed = args.includes('--realtime') ? 1 : 4;
  await page.evaluate((s) => window.RUMOR_RUN.loop.setTimeScale(s), speed);

  const frames = (n) => page.evaluate((count) => new Promise((done) => {
    let left = count;
    const tick = () => (--left <= 0 ? done(true) : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  }), n);

  const tap = async (action) => {
    await page.evaluate((a) => window.RUMOR_RUN.input.press(a), action);
    await frames(2);
    await page.evaluate((a) => window.RUMOR_RUN.input.release(a), action);
    await frames(2);
  };

  const scene = () => page.evaluate(() => window.RUMOR_RUN.scene.name);
  // Screens ignore input for their first fraction of a second, so keep tapping
  // with a gap until the scene actually flips.
  const pushTo = async (name, tries = 30) => {
    for (let i = 0; i < tries; i++) {
      if (await scene() === name) return true;
      await tap('confirm');
      await frames(14);
    }
    return await scene() === name;
  };

  // A fixed route seed by default, so a failing shift can be reproduced
  // exactly; --seed picks a different jobsite to check the generator's spread.
  const seed = args.includes('--seed') ? args[args.indexOf('--seed') + 1] : 'harness';
  await pushTo('brief');
  await page.evaluate((s) => {
    window.RUMOR_RUN.game.runSalt = s;
    window.RUMOR_RUN.game.enterBrief(0);
  }, seed);
  await frames(10);

  const results = [];
  const attempts = new Map();
  for (let i = 0; i < levelCount * 3; i++) {
    if (results.filter((r) => r.passed).length >= levelCount) break;
    if (!await pushTo('brief')) break;
    const level = await page.evaluate(() => {
      const g = window.RUMOR_RUN.game;
      const l = g.levels[g.state.levelIndex];
      return { id: l.id, name: l.name, quota: l.quota, targets: 0 };
    });
    if (!await pushTo('run')) { errors.push(`could not enter run for level ${level.id}`); break; }

    const targetCount = await page.evaluate(() => window.RUMOR_RUN.scene.route.targets.length);
    await page.evaluate(() => window.__runBot({ maxSeconds: 300 }));
    const run = await page.evaluate(() => window.__lastRun);

    if (wantShots) {
      await page.locator('#screen').screenshot({ path: join(OUT, `L${level.id}-results.png`) });
    }

    const passed = run && run.delivered >= level.quota;
    const tries = (attempts.get(level.id) || 0) + 1;
    attempts.set(level.id, tries);
    results.push({ ...level, targets: targetCount, ...run, passed, attempt: tries });
    console.log(
      `L${level.id}.${tries} ${level.name.padEnd(18)} ${String(run?.delivered ?? 0).padStart(2)}/${level.quota} ` +
      `(of ${targetCount} crews)  score ${String(run?.score ?? 0).padStart(6)}  ` +
      `bull ${run?.bullseye ?? 0} solid ${run?.solid ?? 0} whisper ${run?.whisper ?? 0}  ` +
      `crashes ${run?.crashes ?? 0}  combo x${run?.comboBest ?? 0}  ` +
      `[thrown ${run?.thrown ?? 0} refused ${run?.refused ?? 0} short ${run?.misses ?? 0} ` +
      `range ${run?.outOfRange ?? 0} timing ${run?.badTiming ?? 0} paper ${run?.sheets ?? 0}]  ` +
      `${passed ? 'PASS' : 'FAIL'}`,
    );

    // Results -> upgrade -> next brief.
    await pushTo('results', 20);
    await tap('confirm');
    await frames(20);
    const next = await scene();
    if (next === 'upgrade') { await tap('confirm'); await frames(20); }
    if (await scene() === 'ending') break;
    if (!passed && tries >= 3) {
      errors.push(`shift ${level.id} (${level.name}) not clearable: 3 attempts, best ${
        Math.max(...results.filter((r) => r.id === level.id).map((r) => r.delivered ?? 0))}/${level.quota}`);
      break;
    }
  }

  const fps = await page.evaluate(() => window.RUMOR_RUN.fps);
  const summary = {
    at: new Date().toISOString(),
    fps: Math.round(fps * 10) / 10,
    timeScale: speed,
    seed,
    levels: results,
    errors,
    // Every shift has to be clearable; retries within a shift are allowed.
    passedAll: results.length > 0
      && new Set(results.filter((r) => r.passed).map((r) => r.id)).size
         === new Set(results.map((r) => r.id)).size,
  };
  await mkdir(join(ROOT, 'shots'), { recursive: true });
  await writeFile(join(ROOT, 'shots', 'playtest.json'), `${JSON.stringify(summary, null, 2)}\n`);

  await browser.close();
  server.close();

  console.log(`\nfps ${summary.fps}  errors ${errors.length}  ${summary.passedAll ? 'ALL SHIFTS CLEARED' : 'SOME SHIFTS FAILED'}`);
  for (const e of errors) console.log(`  ! ${e.split('\n')[0]}`);
  if (errors.length || !summary.passedAll) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });
