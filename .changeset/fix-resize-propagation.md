---
"@adam26davidson/char-matrix": patch
---

Fix element resize propagation

- Make `flagForRedraw` public so render targets can flag elements for redraw after resize
- Add re-entrancy guard to `ParentElement.resizeChildren` to prevent infinite recursive cascades during resize
- Make `TableElement.resizeChildren` propagate resize to cell elements via `reprocessContent` instead of being a no-op
