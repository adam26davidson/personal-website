# @adam26davidson/char-matrix

## 0.0.10

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

## 0.0.9

### Patch Changes

- 43785f7: Add declarative React JSX system for char-matrix via custom react-reconciler

  - New package `@adam26davidson/char-matrix-react-renderer` with custom React reconciler that creates char-matrix elements from JSX (`<cm-container>`, `<cm-text>`, `<cm-table>`)
  - Add `setRoot`/`getRoot` to RenderTarget interface for reconciler integration
  - React component library (`src/components/cm/`) mirroring all custom MatrixElement wrappers
  - ReactPage adapter bridging declarative components with imperative MatrixController
  - Convert 8 of 9 pages to declarative React components (BlogPostPage remains imperative)
  - Fix: copy IntPoint in `ElementBase.setSize()` to prevent reference aliasing that caused expand-height children to skip their resize cascade, leaving mobile content invisible

## 0.0.8

### Patch Changes

- 56f1267: Add README documentation for npm package pages.

## 0.0.7

### Patch Changes

- 8931350: Support bold digits in `toBold()` and render bold characters with their own distinct Unifont glyphs in `toBigText()`. Previously bold characters were mapped back to ASCII equivalents; now Mathematical Bold letters and digits (U+1D400–U+1D7D7) use their own heavier Unifont bitmaps when available, with ASCII fallback.
- 183605f: Add full Unifont glyph data for Planes 0 and 1, enabling `toBigText()` to render any Unicode character as octant block art. Previously only printable ASCII was supported. Includes a prebuild script that generates TypeScript data from the bundled `.hex` source files, a lazy-loading `UnifontRegistry`, and mixed half-width/full-width glyph support in `toBigText()`.
- 123804e: Add per-cell z-index support for element draw priority. Elements with higher `zIndex` render on top of elements with lower values, regardless of draw order. The z-buffer prevents lower-z animations from bleeding through higher-z content during the compositing step.

## 0.0.6

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

## 0.0.5

### Patch Changes

- af4eff5: Fix element resize propagation

  - Make `flagForRedraw` public so render targets can flag elements for redraw after resize
  - Add re-entrancy guard to `ParentElement.resizeChildren` to prevent infinite recursive cascades during resize
  - Make `TableElement.resizeChildren` propagate resize to cell elements via `reprocessContent` instead of being a no-op

## 0.0.4

### Patch Changes

- fff0140: Add medium big text renderer using Spleen 6×12 bitmap font. toMediumBigText renders text as 3 octant chars wide × 3 octant chars tall per glyph, a middle size between compact (3×2) and large (4×4). Includes PixelBuffer and pixelBufferToOctant for general-purpose bitmap-to-octant rendering.
- 6dbd4ee: Add bitmap-to-octant rendering utilities and two big text renderers. PixelBuffer and pixelBufferToOctant provide general-purpose bitmap rendering using Unicode octant block characters. toBigText renders text using Unifont 8×16 bitmaps (4×4 octant chars per glyph), and toCompactBigText uses Spleen 5×8 bitmaps (3×2 octant chars per glyph). Both support Mathematical Bold characters and configurable inter-character spacing.
- 115954a: Optimize CharMatrix.map() to use direct array access and reuse a single IntPoint, eliminating per-cell object allocations.
- 5cebc82: Remove debug console.log calls from Element, ContainerElement, ParentElement, TextElement, ElementBase, and CharMatrix.
- 2930fc0: Support Element children in TableElement cells. Cells can now be either simple text (`{ text: "hello" }`) or arbitrary Elements (`{ element: myElement }`), enabling custom layouts within table cells. Text cells continue to work as before. Element cells are registered as children, positioned and sized automatically by the table.
- cbdcd40: Improve TableElement: distribute expand column widths evenly instead of dumping remainder on last column, support explicit newlines in cell text, and expand data rows vertically to fill available height when table has non-content height sizing.
- b13a093: Add titleAlign option to TableElement for controlling title text alignment (start, center, end). Defaults to start for backwards compatibility.

## 0.0.3

### Patch Changes

- 19750c9: Add TableElement for rendering text-based tables with box-drawing characters. Supports title rows, column headers, configurable column widths, text alignment, word wrapping, and row separators.

## 0.0.2

### Patch Changes

- 0190602: Extract text UI system into publishable packages with pure event-based scrolling, sub-character octant scrollbar, and draggable thumb
- d7b6c83: Remove direct DOM cursor dependency from char-matrix package by adding setCursor to RenderTarget interface
