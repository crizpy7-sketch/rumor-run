// Keyboard state with edge detection. Actions are named so the rest of the game
// never mentions a physical key.

const BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  gas: ['ArrowUp', 'KeyW'],
  brake: ['ArrowDown', 'KeyS'],
  throwLeft: ['KeyQ', 'KeyZ'],
  throwRight: ['KeyE', 'KeyX'],
  throwAuto: ['Space'],
  confirm: ['Enter', 'Space', 'KeyE', 'KeyX'],
  pause: ['KeyP', 'Escape'],
  mute: ['KeyM'],
  debug: ['F1', 'Backquote'],
};

const CODE_TO_ACTIONS = new Map();
for (const [action, codes] of Object.entries(BINDINGS)) {
  for (const code of codes) {
    if (!CODE_TO_ACTIONS.has(code)) CODE_TO_ACTIONS.set(code, []);
    CODE_TO_ACTIONS.get(code).push(action);
  }
}

// Keys the page should not scroll / activate on.
const SWALLOW = new Set([...CODE_TO_ACTIONS.keys()]);

export function createInput(target = window) {
  const down = new Set();
  const pressed = new Set(); // went down since the last endFrame()
  const released = new Set();
  let anyKeyAt = -1;
  let frame = 0;

  function onDown(e) {
    if (SWALLOW.has(e.code)) e.preventDefault();
    const actions = CODE_TO_ACTIONS.get(e.code);
    if (!actions) return;
    if (e.repeat) return;
    anyKeyAt = frame;
    for (const a of actions) {
      if (!down.has(a)) pressed.add(a);
      down.add(a);
    }
  }

  function onUp(e) {
    const actions = CODE_TO_ACTIONS.get(e.code);
    if (!actions) return;
    for (const a of actions) {
      down.delete(a);
      released.add(a);
    }
  }

  function onBlur() {
    down.clear();
  }

  target.addEventListener('keydown', onDown, { passive: false });
  target.addEventListener('keyup', onUp);
  target.addEventListener('blur', onBlur);

  return {
    held: (a) => down.has(a),
    hit: (a) => pressed.has(a),
    let_go: (a) => released.has(a),
    anyHit: () => pressed.size > 0,
    axis(neg, pos) {
      return (down.has(pos) ? 1 : 0) - (down.has(neg) ? 1 : 0);
    },
    endFrame() {
      pressed.clear();
      released.clear();
      frame++;
    },
    // Used by the capture harness to script a run without synthesising events.
    press(action) {
      if (!down.has(action)) pressed.add(action);
      down.add(action);
    },
    release(action) {
      down.delete(action);
      released.add(action);
    },
    dispose() {
      target.removeEventListener('keydown', onDown);
      target.removeEventListener('keyup', onUp);
      target.removeEventListener('blur', onBlur);
    },
    get lastKeyFrame() { return anyKeyAt; },
  };
}
