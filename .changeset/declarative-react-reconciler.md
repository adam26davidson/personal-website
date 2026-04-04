---
"@adam26davidson/char-matrix": patch
"@adam26davidson/char-matrix-react-renderer": patch
---

Add declarative React JSX system for char-matrix via custom react-reconciler

- New package `@adam26davidson/char-matrix-react-renderer` with custom React reconciler that creates char-matrix elements from JSX (`<cm-container>`, `<cm-text>`, `<cm-table>`)
- Add `setRoot`/`getRoot` to RenderTarget interface for reconciler integration
- React component library (`src/components/cm/`) mirroring all custom MatrixElement wrappers
- ReactPage adapter bridging declarative components with imperative MatrixController
- Convert 8 of 9 pages to declarative React components (BlogPostPage remains imperative)
- Fix: copy IntPoint in `ElementBase.setSize()` to prevent reference aliasing that caused expand-height children to skip their resize cascade, leaving mobile content invisible
