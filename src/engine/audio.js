// Procedural audio. No samples ship with the game: the engine note, the throw,
// the impacts and the soundtrack are all synthesised, which keeps the whole
// build to a few hundred kilobytes of source.

const SCALES = {
  // Semitone offsets from the level root.
  work: [0, 3, 5, 7, 10],
  bright: [0, 2, 4, 7, 9],
  tense: [0, 1, 5, 6, 10],
  night: [0, 3, 5, 6, 10],
};

const noteHz = (semi) => 220 * Math.pow(2, semi / 12);

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let engineOsc = null;
  let engineGain = null;
  let engineFilter = null;
  let noiseBuf = null;
  let muted = false;
  let started = false;

  // Sequencer state
  let track = { scale: 'work', root: 0, bpm: 104, energy: 0.6 };
  let nextNoteAt = 0;
  let step = 0;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.22;
    musicGain.connect(master);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.5;
    sfxGain.connect(master);

    // White noise buffer reused by every percussive sound.
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    return ctx;
  }

  function noise(dur, { gain = 0.3, type = 'lowpass', freq = 1200, q = 1, sweep = 0 } = {}) {
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const filt = ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.setValueAtTime(freq, ctx.currentTime);
    if (sweep) filt.frequency.exponentialRampToValueAtTime(Math.max(60, freq + sweep), ctx.currentTime + dur);
    filt.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filt).connect(g).connect(sfxGain);
    src.start();
    src.stop(ctx.currentTime + dur);
  }

  function blip(freq, dur, { type = 'square', gain = 0.18, slide = 0, delay = 0, dest = null } = {}) {
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(dest || sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const api = {
    get ready() { return !!ctx && ctx.state === 'running'; },
    get muted() { return muted; },

    // Browsers require a gesture; main.js calls this on the first key press.
    unlock() {
      const c = ensure();
      if (!c) return;
      if (c.state === 'suspended') c.resume();
      if (!started) {
        started = true;
        nextNoteAt = c.currentTime + 0.1;
        engineGain = c.createGain();
        engineGain.gain.value = 0;
        engineFilter = c.createBiquadFilter();
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = 700;
        engineOsc = c.createOscillator();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = 60;
        engineOsc.connect(engineFilter).connect(engineGain).connect(master);
        engineOsc.start();
      }
    },

    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.9;
      return muted;
    },

    setTrack(next) {
      track = { ...track, ...next };
    },

    // Engine note follows speed. Called every frame from the run scene.
    engine(speed01, revving) {
      if (!engineGain) return;
      const t = ctx.currentTime;
      const hz = 44 + speed01 * 96 + (revving ? 8 : 0);
      engineOsc.frequency.setTargetAtTime(hz, t, 0.06);
      engineFilter.frequency.setTargetAtTime(360 + speed01 * 900, t, 0.08);
      engineGain.gain.setTargetAtTime(0.035 + speed01 * 0.05, t, 0.1);
    },

    engineOff() {
      if (engineGain) engineGain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    },

    // --- one-shots -------------------------------------------------------
    throwSheet() { noise(0.16, { gain: 0.22, type: 'bandpass', freq: 1500, q: 0.9, sweep: 900 }); },
    hit(quality) {
      const base = quality === 'bullseye' ? 880 : quality === 'solid' ? 660 : 520;
      blip(base, 0.09, { type: 'square', gain: 0.16 });
      blip(base * 1.5, 0.12, { type: 'triangle', gain: 0.12, delay: 0.05 });
      if (quality === 'bullseye') blip(base * 2, 0.14, { type: 'square', gain: 0.1, delay: 0.1 });
    },
    miss() { blip(180, 0.14, { type: 'sawtooth', gain: 0.1, slide: -70 }); },
    crash() {
      noise(0.4, { gain: 0.45, type: 'lowpass', freq: 900, sweep: -700 });
      blip(90, 0.3, { type: 'sawtooth', gain: 0.2, slide: -50 });
    },
    scrape() { noise(0.2, { gain: 0.14, type: 'highpass', freq: 2200 }); },
    pickup() {
      blip(520, 0.07, { type: 'square', gain: 0.14 });
      blip(780, 0.09, { type: 'square', gain: 0.14, delay: 0.06 });
    },
    nearMiss() { noise(0.18, { gain: 0.12, type: 'bandpass', freq: 2600, q: 2, sweep: -1400 }); },
    combo(level) { blip(440 * Math.pow(2, Math.min(level, 12) / 12), 0.1, { type: 'triangle', gain: 0.14 }); },
    bark(pitch = 1) {
      blip(300 * pitch, 0.05, { type: 'square', gain: 0.09, slide: 120 });
    },
    fanfare() {
      [0, 4, 7, 12].forEach((s, i) => blip(noteHz(s + 12), 0.22, { type: 'square', gain: 0.16, delay: i * 0.11 }));
    },
    sad() {
      [0, -2, -5].forEach((s, i) => blip(noteHz(s + 7), 0.3, { type: 'triangle', gain: 0.15, delay: i * 0.16 }));
    },
    woof() {
      blip(150, 0.12, { type: 'sawtooth', gain: 0.24, slide: 90 });
      blip(120, 0.18, { type: 'sawtooth', gain: 0.2, slide: -40, delay: 0.13 });
    },

    // --- soundtrack ------------------------------------------------------
    // A two-voice sequencer: a walking bass on the beat and a sparse arpeggio
    // riding on top. Density follows `energy`, which the run scene raises with
    // the combo meter so the music leans in when you are doing well.
    tick() {
      if (!ctx || !started) return;
      const now = ctx.currentTime;
      const beat = 60 / track.bpm / 2;
      while (nextNoteAt < now + 0.2) {
        const scale = SCALES[track.scale] || SCALES.work;
        const at = nextNoteAt - now;
        const bar = Math.floor(step / 8) % 4;

        if (step % 4 === 0) {
          const root = track.root + (bar === 3 ? -2 : 0);
          blip(noteHz(root - 12), beat * 1.7, { type: 'triangle', gain: 0.2, delay: at, dest: musicGain });
        }
        if (step % 2 === 1 && Math.random() < 0.35 + track.energy * 0.5) {
          const semi = track.root + scale[(step + bar) % scale.length] + (step % 8 === 5 ? 12 : 0);
          blip(noteHz(semi), beat * 0.8, { type: 'square', gain: 0.075, delay: at, dest: musicGain });
        }
        if (step % 8 === 4) {
          noise(0.06, { gain: 0.06 * (0.5 + track.energy), type: 'highpass', freq: 3000 });
        }
        step++;
        nextNoteAt += beat;
      }
    },
  };

  return api;
}
