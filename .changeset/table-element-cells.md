---
"@adam26davidson/char-matrix": patch
---

Support Element children in TableElement cells. Cells can now be either simple text (`{ text: "hello" }`) or arbitrary Elements (`{ element: myElement }`), enabling custom layouts within table cells. Text cells continue to work as before. Element cells are registered as children, positioned and sized automatically by the table.
