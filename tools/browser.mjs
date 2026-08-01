// Where to find Chromium.
//
// This environment ships a browser at a fixed path; CI installs its own through
// Playwright. Prefer an explicit CHROME_PATH, fall back to the preinstalled
// one if it is actually there, and otherwise let Playwright resolve the browser
// it downloaded.

import { existsSync } from 'node:fs';

const PREINSTALLED = '/opt/pw-browsers/chromium';

export function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  if (existsSync(PREINSTALLED)) return PREINSTALLED;
  return null;
}

export function launchOptions(extra = {}) {
  const path = chromePath();
  return {
    args: ['--no-sandbox'],
    ...(path ? { executablePath: path } : {}),
    ...extra,
  };
}
