---
"@adam26davidson/char-matrix": patch
---

Support bold digits in `toBold()` and render bold characters with their own distinct Unifont glyphs in `toBigText()`. Previously bold characters were mapped back to ASCII equivalents; now Mathematical Bold letters and digits (U+1D400–U+1D7D7) use their own heavier Unifont bitmaps when available, with ASCII fallback.
