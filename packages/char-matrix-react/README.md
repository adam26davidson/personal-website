# @adam26davidson/char-matrix-react

React integration for [`@adam26davidson/char-matrix`](https://www.npmjs.com/package/@adam26davidson/char-matrix). Embed React components inside a character matrix layout.

## Features

- **ReactComponentElement** — A char-matrix element that reserves space in the character grid and renders a React component as a positioned overlay
- **ReactRenderTarget** — Extended render target interface for managing React node positioning and lifecycle

## Install

```bash
npm install @adam26davidson/char-matrix-react @adam26davidson/char-matrix react react-dom
```

## Usage

```ts
import { ReactComponentElement } from "@adam26davidson/char-matrix-react";

const element = new ReactComponentElement({
  key: "blog-post",
  view: myRenderTarget,
  component: MyReactComponent,
  widthType: "expand",
  heightType: "expand",
});
```

The element reports its position and size to the render target, which renders the React component as an absolutely-positioned overlay on top of the character grid.

## Peer dependencies

- `@adam26davidson/char-matrix`
- `react` ^18.0.0
- `react-dom` ^18.0.0

## Related packages

- [`@adam26davidson/char-matrix`](https://www.npmjs.com/package/@adam26davidson/char-matrix) — Core layout and rendering engine
- [`@adam26davidson/char-matrix-fx`](https://www.npmjs.com/package/@adam26davidson/char-matrix-fx) — Animations, physics, and surface transforms
- [`@adam26davidson/char-matrix-react-renderer`](https://www.npmjs.com/package/@adam26davidson/char-matrix-react-renderer) — Declarative React JSX renderer for char-matrix element trees
