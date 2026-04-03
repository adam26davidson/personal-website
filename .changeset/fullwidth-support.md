---
"@adam26davidson/char-matrix": minor
"@adam26davidson/char-matrix-fx": minor
---

Add fullwidth Unicode character support

- Add `isFullwidth()` utility with binary search over Unifont glyph width ranges (~10KB)
- `CharMatrix.setChar()` marks continuation cells for fullwidth characters
- `CharMatrix.map()` skips continuation cells and preserves them in output
- `TextElement` word wrapping accounts for fullwidth chars (2 cells wide)
- `TextElement` character-level line breaking for long words (e.g. Japanese text with no spaces)
- Merge fullwidth similarity data into `top_similar.json` (1,913 narrow + 1,116 fullwidth = 3,029 chars)
- `HeadBasedAnimation` and `SpringLatticeSurfaceTransform` skip continuation cells
- Remove zero-width space hack from hamburger menu icon
