# @adam26davidson/char-matrix

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
