# @adam26davidson/char-matrix

A layout and rendering engine for character-based UIs. Renders content as a grid of monospaced Unicode characters with support for element trees, coordinate systems, and z-indexed compositing.

## Features

- **Element system** — `TextElement`, `ContainerElement`, `TableElement` with sizing modes (absolute, relative, expand, content), padding, borders, scrolling, and cursor types
- **Transition sequences** — Composable enter/exit animations for elements
- **CharMatrix buffers** — Efficient 2D character grid with fullwidth character support
- **RenderTargetBufferManager** — Shared buffer management with per-cell z-buffering and content/animation layer compositing
- **Coordinate types** — `IntPoint` (grid), `RealPoint` (pixel), `NormPoint` (normalized 0-1)
- **Big text rendering** — Render text at 4x4, 3x3, and 3x2 scales using Unicode octant block characters
- **Unifont glyph registry** — Access to Unifont glyph data for Planes 0-1
- **Octant utilities** — Bitmap-to-octant conversion for sub-character-cell graphics

## Install

```bash
npm install @adam26davidson/char-matrix
```

## Usage

Implement the `RenderTarget` interface and use `RenderTargetBufferManager` for buffer management:

```ts
import {
  RenderTargetBufferManager,
  TextElement,
  ContainerElement,
  IntPoint,
} from "@adam26davidson/char-matrix";

// Create a buffer manager for a 80x24 grid
const buffers = new RenderTargetBufferManager(new IntPoint(80, 24));

// Use buffers.setContentLayerChar / setAnimationLayerChar for z-aware writes
// Use buffers.getSurface([]) to get the composited output
```

Build element trees for layout:

```ts
const container = new ContainerElement({
  key: "root",
  view: myRenderTarget,
  mainAxis: Y,
});

const title = new TextElement({
  key: "title",
  view: myRenderTarget,
  text: "Hello, world!",
  widthType: "content",
  heightType: "content",
  zIndex: 1, // renders on top of z=0 elements
});
```

## Related packages

- [`@adam26davidson/char-matrix-fx`](https://www.npmjs.com/package/@adam26davidson/char-matrix-fx) — Animations, physics, and surface transforms
- [`@adam26davidson/char-matrix-react`](https://www.npmjs.com/package/@adam26davidson/char-matrix-react) — Embed React components inside a character matrix layout
- [`@adam26davidson/char-matrix-react-renderer`](https://www.npmjs.com/package/@adam26davidson/char-matrix-react-renderer) — Declarative React JSX renderer for char-matrix element trees
