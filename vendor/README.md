# vendor/

Third-party code, committed rather than installed.

| File | What | Version | Licence |
| --- | --- | --- | --- |
| `three.module.min.js` | three.js, ES module build | 0.185.1 | MIT (`THREE-LICENSE`) |
| `three.core.min.js` | three.js core, imported by the above | 0.185.1 | MIT (`THREE-LICENSE`) |

Used only by the pages `tools/img2threejs.mjs` writes into `3d/`. The game
itself has no runtime dependencies and does not load any of this.

It is committed for the same reason the rest of the repo has no build step: a
page in `3d/` opens from the filesystem, from `npm start`, and from GitHub Pages
with nothing installed and no network. A CDN link would break all three of
those the first time it was needed offline.

To update: `npm install --no-save three@<version>`, copy
`node_modules/three/build/three.module.min.js` and `three.core.min.js` here,
copy `node_modules/three/LICENSE` to `THREE-LICENSE`, and update the table.
