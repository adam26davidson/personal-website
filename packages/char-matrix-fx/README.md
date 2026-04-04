# @adam26davidson/char-matrix-fx

Animations, physics simulation, and surface transforms for [`@adam26davidson/char-matrix`](https://www.npmjs.com/package/@adam26davidson/char-matrix).

## Features

- **Animation system** — `DiagonalSwipeAnimation`, `RowTracerAnimation`, and extensible base classes (`Animation`, `HeadBasedAnimation`) for building custom entrance/exit effects
- **DefaultAnimationHandler** — Drop-in animation manager for elements with configurable animation types
- **SpringLattice** — 2D spring-mesh physics simulation for mouse/touch-reactive character displacement
- **SpringLatticeSurfaceTransform** — Applies spring lattice displacement as a post-render surface transform
- **Character similarity** — Precomputed visual similarity data for smooth character morphing effects

## Install

```bash
npm install @adam26davidson/char-matrix-fx @adam26davidson/char-matrix
```

## Usage

Add animations to elements:

```ts
import { DefaultAnimationHandler } from "@adam26davidson/char-matrix-fx";

const handler = new DefaultAnimationHandler(null, view, {
  entrance: {
    type: "rowTracer",
    config: { tailLength: 20, headSpeed: 3, randomizationRange: 5, use: "entrance" },
  },
  exit: {
    type: "diagonalSwipe",
    config: { slant: 4, tailLength: 30, headSpeed: 3, randomizationRange: 5, use: "exit" },
  },
});

const element = new TextElement({
  key: "greeting",
  view: myRenderTarget,
  text: "Hello!",
  animationHandler: handler,
});
handler.setElement(element);
```

Add spring lattice physics:

```ts
import {
  SpringLattice,
  SpringLatticeSurfaceTransform,
} from "@adam26davidson/char-matrix-fx";

const lattice = new SpringLattice();
lattice.initialize(width, height, 3000);
myView.addSurfaceTransform(new SpringLatticeSurfaceTransform(lattice));

// Update physics on a 20ms interval
setInterval(() => lattice.update(), 20);

// Set attractor position on mouse interaction
lattice.setAttractorPosition(x, y);
lattice.setAttractorOn();
```

## Peer dependencies

- `@adam26davidson/char-matrix`

## Related packages

- [`@adam26davidson/char-matrix`](https://www.npmjs.com/package/@adam26davidson/char-matrix) — Core layout and rendering engine
- [`@adam26davidson/char-matrix-react`](https://www.npmjs.com/package/@adam26davidson/char-matrix-react) — Embed React components inside a character matrix layout
- [`@adam26davidson/char-matrix-react-renderer`](https://www.npmjs.com/package/@adam26davidson/char-matrix-react-renderer) — Declarative React JSX renderer for char-matrix element trees
