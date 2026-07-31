---
"@adam26davidson/char-matrix": patch
"@adam26davidson/char-matrix-react-renderer": patch
---

Elements added after their parent's entrance completed (e.g. data arriving post-mount) now start their own entrance transition instead of staying queued/invisible; overlays transition to visible on mount. `CMTableProps` accepts `children`.
