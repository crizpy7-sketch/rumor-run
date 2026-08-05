# 3d/

Pages written by `tools/img2threejs.mjs`. Each one is standalone — open it from
the filesystem, from `npm start`, or from GitHub Pages, with nothing installed
and no network.

| Page | What |
| --- | --- |
| `index.html` | the cast: cart, worker, forklift, truck, cone, barrel, portaloo, Bomba |
| `gcs.html` | the GCS building and a scaffold tower |
| `cart.html` | the buggy on its own |

Rebuild any of them:

```sh
node tools/img2threejs.mjs cart worker forklift --out 3d/index.html
node tools/img2threejs.mjs some-picture.png          # anything, via the palette snap
node tools/img2threejs.mjs --all                     # the entire sprite table
```

Drag to orbit, wheel or pinch to zoom, tap a model to frame it, space to stop
the spin. Wireframe shows the meshing.

## How the geometry is built

Every opaque pixel becomes a box, but not one box per pixel — that would put
the GCS building at about 135,000 triangles. Two passes cut it to 16,888:

- **Runs merge.** A row of pixels that share a colour becomes one quad on the
  front and one on the back. Pixel art is mostly flat areas, so this collapses
  most of it.
- **Interior walls are never built.** A side face is only emitted where the
  neighbouring pixel is transparent. A wall between two solid pixels cannot be
  seen from anywhere, so building it is pure cost.

The silhouette stays exact to the pixel. Depth comes from extrusion rather than
from a guessed depth map, which is the part that always looks wrong.

## The lighting is calibrated, not decorated

The sprite already has its light baked in by whoever drew it. So a face pointed
at the camera has to come back out of the renderer at the palette value it went
in as — any dimmer and the 3D version is just a worse copy of the 2D one.

```sh
node tools/shoot3d.mjs --calibrate
```

builds a sprite that is one flat block per palette entry, points the camera
straight at it, projects each block's centre through the live camera to find
the pixel to sample, and reports the ratio. It currently reads **0.996** across
33 entries. It runs in `npm run check`, and it fails the build if the mean
drifts more than 6% from 1.00.

This was worth building. The first version of the viewer measured 0.85 and
looked, correctly, muddy — and the fix was not more light but removing a fog
setting that was quietly eating the whole scene.

## What this is not

An extruded sprite is a slab seen from the side. That is inherent: there is no
information in a 2D image about what the back of the object looks like, and
anything that invented it would be guessing. These read best from the front
through about 45 degrees either way, which is what the default camera does.

The game itself is unaffected. It is 2D on purpose — the fixed oblique
projection with no perspective scaling is what keeps its diagonal road edges
clean — and it loads none of this.
