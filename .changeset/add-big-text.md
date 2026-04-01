---
"@adam26davidson/char-matrix": patch
---

Add bitmap-to-octant rendering utilities and two big text renderers. PixelBuffer and pixelBufferToOctant provide general-purpose bitmap rendering using Unicode octant block characters. toBigText renders text using Unifont 8×16 bitmaps (4×4 octant chars per glyph), and toCompactBigText uses Spleen 5×8 bitmaps (3×2 octant chars per glyph). Both support Mathematical Bold characters and configurable inter-character spacing.
