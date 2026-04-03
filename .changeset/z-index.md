---
"@adam26davidson/char-matrix": patch
"@adam26davidson/char-matrix-fx": patch
---

Add per-cell z-index support for element draw priority. Elements with higher `zIndex` render on top of elements with lower values, regardless of draw order. The z-buffer prevents lower-z animations from bleeding through higher-z content during the compositing step.
