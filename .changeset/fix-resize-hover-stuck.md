---
"@adam26davidson/char-matrix": patch
"@adam26davidson/personal-website": patch
---

Fix hover state getting stuck after mobile-to-desktop resize by adding isMobile to CMLink useMemo deps and removing entering-stage guard on mouse event handling in ElementInteraction
