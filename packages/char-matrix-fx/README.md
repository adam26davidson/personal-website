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

const element = new TextElement({
  key: "greeting",
  view: myRenderTarget,
  text: "Hello!",
  animationHandler: new DefaultAnimationHandler(myRenderTarget, {
    animationType: "diagonalSwipe",
  }),
});
```

Add spring lattice physics:

```ts
import {
  SpringLattice,
  SpringLatticeSurfaceTransform,
} from "@adam26davidson/char-matrix-fx";

const lattice = new SpringLattice();
const transform = new SpringLatticeSurfaceTransform(lattice);

// Register as a surface transform on your render target
myView.addSurfaceTransform(transform);

// Update attractor position on mouse move
lattice.setAttractorPosition(x, y);
```

## Peer dependencies

- `@adam26davidson/char-matrix`
