// Fixed-step 60Hz loop. Update is always 1/60s so tuning numbers mean the same
// thing on every machine; render happens once per animation frame.

export const STEP = 1 / 60;
const MAX_CATCHUP = 5; // never simulate more than 5 steps for one frame

export function createLoop({ update, render }) {
  let raf = 0;
  let last = 0;
  let acc = 0;
  let running = false;
  // Simulated seconds per real second. Only the harness moves this: the step
  // stays 1/60, so a 4x playtest runs the identical simulation, just sooner.
  let timeScale = 1;

  // Rolling frame-rate estimate, exposed for the capture harness and the HUD.
  const frameTimes = [];
  const stats = { fps: 60, frames: 0, steps: 0 };

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25; // tab was backgrounded; drop the debt

    acc += dt * timeScale;
    let steps = 0;
    while (acc >= STEP && steps < MAX_CATCHUP * timeScale) {
      update(STEP);
      acc -= STEP;
      steps++;
      stats.steps++;
    }
    if (steps >= MAX_CATCHUP * timeScale) acc = 0;

    render(acc / STEP);
    stats.frames++;

    frameTimes.push(now);
    while (frameTimes.length > 60) frameTimes.shift();
    if (frameTimes.length > 1) {
      const span = frameTimes[frameTimes.length - 1] - frameTimes[0];
      if (span > 0) stats.fps = ((frameTimes.length - 1) * 1000) / span;
    }
  }

  return {
    stats,
    get timeScale() { return timeScale; },
    setTimeScale(v) { timeScale = Math.max(1, Math.min(8, v)); },
    start() {
      if (running) return;
      running = true;
      last = 0;
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
