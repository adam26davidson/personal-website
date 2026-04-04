---
"@adam26davidson/char-matrix": patch
"@adam26davidson/char-matrix-fx": patch
"@adam26davidson/char-matrix-react-renderer": patch
---

Extend char-matrix framework and React reconciler for general-purpose declarative UI

**char-matrix:**
- Add `updateConfig` methods across Element hierarchy for runtime prop updates
- Add `position: "flow" | "absolute"` positioning mode to ElementConfig
- Add `RenderLoopController` for managed requestAnimationFrame loops
- Add optional `addOverlay`/`removeOverlay`/`getRenderLoop` to RenderTarget interface

**char-matrix-fx:**
- DefaultAnimationHandler auto-registers with RenderLoopController on animation start/end

**char-matrix-react-renderer:**
- commitUpdate now applies all prop changes (layout, sizing, padding, etc.), not just text/onClick
- Add `<cm-overlay>` element type for portal-like overlay rendering
- Add `animationKey` prop to re-trigger entrance animations on data changes
- Add `CMElementRef` interface and ref support on all JSX elements
- Add `useAnimation`, `useRenderLoop`, and `usePolledData` hooks
