# @adam26davidson/char-matrix-fx

## 1.0.0

### Patch Changes

- Updated dependencies [23b7086]
  - @adam26davidson/char-matrix@0.1.0

## 0.0.7

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

## 0.0.6

### Patch Changes

- 56f1267: Add README documentation for npm package pages.
- Updated dependencies [56f1267]
  - @adam26davidson/char-matrix@0.0.8

## 0.0.5

### Patch Changes

- 123804e: Add per-cell z-index support for element draw priority. Elements with higher `zIndex` render on top of elements with lower values, regardless of draw order. The z-buffer prevents lower-z animations from bleeding through higher-z content during the compositing step.
- Updated dependencies [8931350]
- Updated dependencies [183605f]
- Updated dependencies [123804e]
  - @adam26davidson/char-matrix@0.0.7

## 0.0.4

### Patch Changes

- 2d215be: Add fullwidth Unicode character support and fix animation layer cleanup

  - Add `isFullwidth()` utility with binary search over Unifont glyph width ranges (~10KB)
  - `CharMatrix.setChar()` marks continuation cells for fullwidth characters
  - `CharMatrix.map()` skips continuation cells and preserves them in output
  - `TextElement` word wrapping accounts for fullwidth chars (2 cells wide)
  - `TextElement` character-level line breaking for long words (e.g. Japanese text with no spaces)
  - Merge fullwidth similarity data into `top_similar.json` (1,913 narrow + 1,116 fullwidth = 3,029 chars)
  - `HeadBasedAnimation` and `SpringLatticeSurfaceTransform` skip continuation cells
  - Remove zero-width space hack from hamburger menu icon
  - Fix animation completion: sync animation layer to content layer instead of clearing with backgroundChar, preventing a one-frame flash when animations end
  - Move `use` field to Animation base class so completion behavior varies by type (exit clears, entrance/interaction syncs)

- fd86e05: Remove unassigned Unicode codepoints from similarity data and regenerate with complete block octant coverage
- Updated dependencies [2d215be]
  - @adam26davidson/char-matrix@0.0.6

## 0.0.3

### Patch Changes

- 78fc2fd: Fix animation completion leaving stale characters on the animation layer by clearing it when the animation finishes.
- bb85f32: Fix dist output layout so published package resolves correctly. Added rootDir and removed baseUrl/paths that caused nested output structure.
- fef1534: Remove unnecessary async from SpringLattice.update() to avoid creating a throwaway Promise every tick.
- 3302e8d: Update top_similar.json with expanded character similarity data (1,765 characters, up from 1,454) including block elements and fullwidth variants, with recalculated rankings.
- Updated dependencies [fff0140]
- Updated dependencies [6dbd4ee]
- Updated dependencies [115954a]
- Updated dependencies [5cebc82]
- Updated dependencies [2930fc0]
- Updated dependencies [cbdcd40]
- Updated dependencies [b13a093]
  - @adam26davidson/char-matrix@0.0.4

## 0.0.2

### Patch Changes

- 0190602: Extract text UI system into publishable packages with pure event-based scrolling, sub-character octant scrollbar, and draggable thumb
- Updated dependencies [0190602]
- Updated dependencies [d7b6c83]
  - @adam26davidson/char-matrix@0.0.2
