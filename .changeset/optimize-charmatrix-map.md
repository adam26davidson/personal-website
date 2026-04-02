---
"@adam26davidson/char-matrix": patch
---

Optimize CharMatrix.map() to use direct array access and reuse a single IntPoint, eliminating per-cell object allocations.
