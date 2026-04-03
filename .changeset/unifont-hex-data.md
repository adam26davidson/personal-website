---
"@adam26davidson/char-matrix": patch
---

Add full Unifont glyph data for Planes 0 and 1, enabling `toBigText()` to render any Unicode character as octant block art. Previously only printable ASCII was supported. Includes a prebuild script that generates TypeScript data from the bundled `.hex` source files, a lazy-loading `UnifontRegistry`, and mixed half-width/full-width glyph support in `toBigText()`.
