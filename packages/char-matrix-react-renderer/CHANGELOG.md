# @adam26davidson/char-matrix-react-renderer

## 0.0.3

### Patch Changes

- e4691ea: Extend char-matrix framework and React reconciler for general-purpose declarative UI

  **char-matrix:**

  - Add `updateConfig` methods across Element hierarchy for runtime prop updates
  - Add `position: "flow" | "absolute"` positioning mode to ElementConfig
  - Add `RenderLoopController` for managed requestAnimationFrame loops with `destroy()` for clean teardown
  - Add optional `addOverlay`/`removeOverlay`/`getRenderLoop` to RenderTarget interface
  - Cache `flowChildren` in `ParentElement` to avoid repeated filtering in layout methods
  - Extract shared `updateCommonConfig` method on `Element` for batch config updates
  - Fix `updateBaseConfig` sizing inference to use explicit undefined checks instead of falsy coercion
  - `setOnClick` now accepts `null` to clear handlers

  **char-matrix-fx:**

  - DefaultAnimationHandler auto-registers with RenderLoopController on animation start/end

  **char-matrix-react-renderer:**

  - commitUpdate now applies all prop changes (layout, sizing, padding, etc.), not just text/onClick
  - Add `<cm-overlay>` element type for portal-like overlay rendering
  - Add `animationKey` prop to re-trigger entrance animations on data changes
  - Add `CMElementRef` interface and ref support on all JSX elements
  - Add `useAnimation`, `useRenderLoop`, and `usePolledData` hooks
  - Refactor `commitUpdate` to use type guards and shared `extractBaseFields` helper
  - Fix `usePolledData` to stabilize fetcher via ref (prevents interval restart on re-render)
  - Fix `commitUpdate` to clear onClick when handler is removed
  - Fix `removeChildFromContainer` to properly clean up overlay elements

- Updated dependencies [e4691ea]
  - @adam26davidson/char-matrix@0.0.10

## 0.0.2

### Patch Changes

- 43785f7: Add declarative React JSX system for char-matrix via custom react-reconciler

  - New package `@adam26davidson/char-matrix-react-renderer` with custom React reconciler that creates char-matrix elements from JSX (`<cm-container>`, `<cm-text>`, `<cm-table>`)
  - Add `setRoot`/`getRoot` to RenderTarget interface for reconciler integration
  - React component library (`src/components/cm/`) mirroring all custom MatrixElement wrappers
  - ReactPage adapter bridging declarative components with imperative MatrixController
  - Convert 8 of 9 pages to declarative React components (BlogPostPage remains imperative)
  - Fix: copy IntPoint in `ElementBase.setSize()` to prevent reference aliasing that caused expand-height children to skip their resize cascade, leaving mobile content invisible

- Updated dependencies [43785f7]
  - @adam26davidson/char-matrix@0.0.9
