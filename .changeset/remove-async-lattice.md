---
"@adam26davidson/char-matrix-fx": patch
---

Remove unnecessary async from SpringLattice.update() to avoid creating a throwaway Promise every tick.
