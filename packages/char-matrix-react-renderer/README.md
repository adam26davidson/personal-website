# @adam26davidson/char-matrix-react-renderer

Declarative React JSX renderer for [`@adam26davidson/char-matrix`](https://www.npmjs.com/package/@adam26davidson/char-matrix) element trees. Built on `react-reconciler`, this package lets you compose char-matrix UIs with JSX, React state, hooks, and component composition.

## Features

- **Custom React reconciler** — Maps React operations to char-matrix element creation, child management, and prop updates
- **JSX intrinsic elements** — `<cm-container>`, `<cm-text>`, `<cm-table>` with full TypeScript support
- **In-place updates** — Text content updates without element recreation; children managed via a WeakMap bridge between React's incremental mutations and char-matrix's bulk `setChildren()` API
- **onClick support** — Click handlers wired through the reconciler
- **Animation handler wiring** — `DefaultAnimationHandler.setElement()` called automatically after element creation
- **setRoot bridging** — Reconciler calls `view.setRoot()` when the root element is committed, integrating with the render loop

## Install

```bash
npm install @adam26davidson/char-matrix-react-renderer @adam26davidson/char-matrix react
```

## Usage

```tsx
import { render, unmount } from "@adam26davidson/char-matrix-react-renderer";

function Dashboard() {
  const [time, setTime] = useState(new Date());

  return (
    <cm-container elementKey="root" mainAxis="y" widthType="relative" width={1} spacing={1}>
      <cm-text elementKey="clock" text={formatTime(time)} />
      <cm-container elementKey="row" mainAxis="x" spacing={2}>
        <cm-text elementKey="label" text="Hello, world!" bordered paddingX={1} />
      </cm-container>
    </cm-container>
  );
}

// Render into a RenderTarget (e.g. MatrixView)
render(<Dashboard />, view);

// Later, to tear down
unmount(view);
```

Note: use `elementKey` instead of `key` for the char-matrix element key, since React reserves `key` for reconciliation.

## Peer dependencies

- `@adam26davidson/char-matrix`
- `react` ^18.0.0

## Related packages

- [`@adam26davidson/char-matrix`](https://www.npmjs.com/package/@adam26davidson/char-matrix) — Core layout and rendering engine
- [`@adam26davidson/char-matrix-fx`](https://www.npmjs.com/package/@adam26davidson/char-matrix-fx) — Animations, physics, and surface transforms
- [`@adam26davidson/char-matrix-react`](https://www.npmjs.com/package/@adam26davidson/char-matrix-react) — Embed React components inside a character matrix layout
