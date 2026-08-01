// Builds progress/rumor-run.html from progress/rumor-state.json.
//
//   node tools/rr-progress.mjs
//
// The page shares its letterforms with the game (src/art/glyphs.js), reads the
// build line from git, and folds in whatever the capture harness and the
// autopilot last reported, so the status page cannot drift from the code.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pixelTitle, PIXTITLE_CSS } from '../src/art/glyphs.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const STATUS_LABEL = { done: 'DONE', building: 'BUILDING', queued: 'QUEUED', blocked: 'BLOCKED' };

async function readJson(path, fallback = null) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
}

function git(cmd, fallback = '') {
  try { return execSync(cmd, { cwd: ROOT }).toString().trim(); } catch { return fallback; }
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

async function main() {
  const state = await readJson(join(ROOT, 'progress/rumor-state.json'));
  if (!state) throw new Error('progress/rumor-state.json is missing');

  const tour = await readJson(join(ROOT, 'shots/rr-tour/report.json'));
  const playtest = await readJson(join(ROOT, 'shots/playtest.json'));

  const build = {
    commit: git('git rev-parse --short HEAD', 'unversioned'),
    at: git('git log -1 --format=%cI', new Date().toISOString()),
    fps: tour?.fps ?? playtest?.fps ?? 0,
    errors: (tour?.errors?.length ?? 0) + (playtest?.errors?.length ?? 0),
    ...state.build,
  };
  if (tour?.fps) build.fps = tour.fps;
  if (tour) build.errors = (tour.errors || []).length + ((playtest?.errors || []).length);
  build.commit = git('git rev-parse --short HEAD', build.commit);
  build.at = git('git log -1 --format=%cI', build.at);

  const pieces = (state.pieces || []).map((p) => `
    <article class="piece ${esc(p.status)}">
      <header><h3>${esc(p.name)}</h3><span class="tag">${esc(STATUS_LABEL[p.status] || p.status)}</span></header>
      <p>${esc(p.note)}</p>
      ${p.round ? `<span class="round">ROUND ${esc(p.round)}</span>` : ''}
    </article>`).join('');

  const loops = (state.loops || []).map((l) => `
    <li><b>${esc(l.piece)}</b> <span class="dim">${esc(l.stage)} · round ${esc(l.round)}</span><br>${esc(l.note)}</li>`).join('');

  const findings = (state.findings || []).map((f) => `
    <article class="finding ${esc(f.severity)} ${esc(f.status)}">
      <header><h3>${esc(f.title)}</h3>
        <span class="tag">${esc(f.severity)}</span><span class="tag ${esc(f.status)}">${esc(f.status)}</span></header>
      <p><span class="dim">${esc(f.piece)}</span> — ${esc(f.detail)}</p>
    </article>`).join('');

  const galleries = [];
  for (const g of state.galleries || []) {
    let files = [];
    try {
      files = (await readdir(join(ROOT, g.dir))).filter((f) => f.endsWith('.png')).sort();
    } catch { /* directory not captured yet */ }
    galleries.push(`
      <section class="gallery">
        <h3>${esc(g.title)}</h3>
        <p class="dim">${esc(g.note)}</p>
        <div class="shots">
          ${files.map((f) => `<figure><img src="../${esc(g.dir)}/${esc(f)}" alt="${esc(f)}" loading="lazy"><figcaption>${esc(f.replace(/\.png$/, ''))}</figcaption></figure>`).join('')}
        </div>
        ${files.length ? '' : '<p class="dim">no captures yet — run <code>node tools/shoot.mjs</code></p>'}
      </section>`);
  }

  const timeline = (state.timeline || []).map((t) => `
    <li><span class="when">${esc(t.at)}</span><b>${esc(t.label)}</b><p>${esc(t.detail)}</p></li>`).join('');

  const playRows = (playtest?.levels || []).map((l) => `
    <tr class="${l.passed ? 'pass' : 'fail'}">
      <td>L${esc(l.id)}</td><td>${esc(l.name)}</td>
      <td>${esc(l.delivered)}/${esc(l.quota)}</td>
      <td>${esc(l.bullseye)}</td><td>${esc(l.solid)}</td><td>${esc(l.whisper)}</td>
      <td>${esc(l.crashes)}</td><td>x${esc(l.comboBest)}</td><td>${esc(l.score)}</td>
      <td>${l.passed ? 'PASS' : 'FAIL'}</td>
    </tr>`).join('');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rumor Run — progress</title>
<style>
  :root {
    --ink:#171418; --paper:#efe4c4; --paper-hi:#fdf6e0;
    --night:#1b1a1f; --night-hi:#26242c;
    --gold:#ffd24a; --gold-deep:#8a6410; --grass:#c4e022; --ember:#ff6a3d;
    --shot-bg:#141317; --dim:#8d8798;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--night); color: var(--paper);
    font: 15px/1.6 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  }
  main { max-width: 1000px; margin: 0 auto; padding: 32px 20px 80px; }
  header.hero { padding: 28px 0 8px; }
  ${PIXTITLE_CSS}
  .tagline { color: var(--paper); max-width: 70ch; margin: 22px 0 12px; }
  .meta { display: flex; flex-wrap: wrap; gap: 10px 22px; color: var(--dim); font-size: 13px; }
  .meta b { color: var(--gold); font-weight: 600; }
  a { color: var(--gold); }
  h2 {
    margin: 44px 0 14px; font-size: 13px; letter-spacing: .22em; text-transform: uppercase;
    color: var(--gold); border-bottom: 1px solid var(--night-hi); padding-bottom: 8px;
  }
  .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  .piece, .finding {
    background: var(--night-hi); border: 1px solid #322f3a; border-left-width: 4px;
    padding: 12px 14px; border-radius: 3px;
  }
  .piece header, .finding header { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
  .piece h3, .finding h3 { margin: 0; font-size: 15px; color: var(--paper-hi); }
  .piece p, .finding p { margin: 8px 0 0; font-size: 13px; color: #c3bcae; }
  .piece.done { border-left-color: var(--grass); }
  .piece.building { border-left-color: var(--gold); }
  .piece.queued { border-left-color: #4a4550; }
  .piece.blocked { border-left-color: var(--ember); }
  .tag {
    font-size: 10px; letter-spacing: .16em; padding: 2px 6px; border-radius: 2px;
    background: #322f3a; color: var(--dim); text-transform: uppercase;
  }
  .piece.done .tag { background: var(--grass); color: var(--ink); }
  .piece.building .tag { background: var(--gold); color: var(--ink); }
  .tag.fixed { background: var(--grass); color: var(--ink); }
  .tag.open { background: var(--ember); color: var(--ink); }
  .round { font-size: 10px; color: var(--dim); letter-spacing: .16em; }
  .finding.major { border-left-color: var(--ember); }
  .finding.minor { border-left-color: var(--gold-deep); }
  ul.loops, ul.timeline { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
  ul.loops li, ul.timeline li {
    background: var(--night-hi); border: 1px solid #322f3a; padding: 10px 12px;
    border-radius: 3px; font-size: 13px;
  }
  ul.timeline .when { color: var(--gold); margin-right: 10px; font-size: 11px; letter-spacing: .14em; }
  ul.timeline p { margin: 6px 0 0; color: #c3bcae; }
  .dim { color: var(--dim); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--night-hi); }
  th { color: var(--dim); font-weight: 500; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; }
  tr.pass td:last-child { color: var(--grass); }
  tr.fail td:last-child { color: var(--ember); }
  .shots { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(288px, 1fr)); }
  figure { margin: 0; background: var(--shot-bg); border: 1px solid #322f3a; border-radius: 3px; overflow: hidden; }
  figure img { display: block; width: 100%; image-rendering: pixelated; background: var(--shot-bg); }
  figcaption { padding: 6px 8px; font-size: 11px; color: var(--dim); letter-spacing: .1em; }
  .play {
    display: inline-block; margin: 14px 0 0; padding: 10px 16px; background: var(--gold);
    color: var(--ink); text-decoration: none; font-weight: 700; letter-spacing: .12em; border-radius: 2px;
  }
  code { background: var(--night-hi); padding: 1px 5px; border-radius: 2px; }
</style>
</head>
<body>
<main>
  <header class="hero">
    ${pixelTitle('RUMOR RUN', { px: 5 })}
    <p class="tagline">${esc(state.tagline)}</p>
    <div class="meta">
      <span>cycle <b>${esc(state.cycle)}</b></span>
      <span>build <b>${esc(build.commit)}</b></span>
      <span>captured fps <b>${esc(build.fps)}</b></span>
      <span>page errors <b>${esc(build.errors)}</b></span>
      <span>${esc(build.at)}</span>
    </div>
    ${state.playUrl ? `<a class="play" href="${esc(state.playUrl)}">PLAY — ${esc(state.playLabel || state.playUrl)}</a>` : ''}
  </header>

  <h2>Pieces</h2>
  <div class="grid">${pieces}</div>

  ${loops ? `<h2>Build loops</h2><ul class="loops">${loops}</ul>` : ''}

  ${playRows ? `<h2>Autopilot playthrough</h2>
  <p class="dim">Every shift, played end to end by <code>tools/bot.js</code>. A shift the bot cannot clear is a bug, not a difficulty setting.</p>
  <table>
    <tr><th>#</th><th>Shift</th><th>Delivered</th><th>Bull</th><th>Solid</th><th>Whisper</th><th>Crashes</th><th>Combo</th><th>Score</th><th></th></tr>
    ${playRows}
  </table>` : ''}

  ${findings ? `<h2>Findings</h2><div class="grid">${findings}</div>` : ''}

  <h2>Captures</h2>
  ${galleries.join('')}

  ${timeline ? `<h2>Timeline</h2><ul class="timeline">${timeline}</ul>` : ''}
</main>
</body>
</html>
`;

  await mkdir(join(ROOT, 'progress'), { recursive: true });
  await writeFile(join(ROOT, 'progress/rumor-run.html'), html);
  console.log('progress page → progress/rumor-run.html');
}

main().catch((err) => { console.error(err); process.exit(1); });
