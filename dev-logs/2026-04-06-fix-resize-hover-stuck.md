# Fix: Hover state stuck after mobile-to-desktop resize

**Date:** 2026-04-06
**Branch:** fix/resize-hover-stuck
**Files changed:**
- `packages/char-matrix/src/Element/ElementInteraction.ts`
- `src/components/cm/CMLink.tsx`

## Context

After resizing the title page from mobile to desktop, hovering over a nav link and then moving the mouse away left the link stuck in its bold (hovered) appearance. The link never received the mouse-exit event.

Two independent bugs contributed to this behavior.

## Bug 1: Stale animation handler after resize (CMLink.tsx)

`CMLink` and `CMButtonLink` create a `DefaultAnimationHandler` via `useMemo`, but the dependency array was `[view, animate]` — missing `isMobile`. After a mobile-to-desktop resize, `view` is the same object reference, so `useMemo` returned the stale mobile handler.

The mobile handler has **no `mouseEnter`/`mouseExit` animation configs** (`createLinkAnimationConfig` returns `undefined` for `"interaction"` on mobile). This meant the `mouseExit` animation never ran after resize, leaving the animation layer in a stale state.

This also caused the entrance animation to use the wrong config — the mobile animation (`tailLength: 6`) completed within the 500ms polling window of the existing `resize-link-animation` test, which expected the desktop animation (`tailLength: 30`) to still be in progress.

**Fix:** Added `isMobile` to the `useMemo` dependency array in both `CMLink` and `CMButtonLink`.

```typescript
// Before
const handler = useMemo(
  () => createLinkAnimationHandler(view, animate),
  [view, animate]
);

// After
const handler = useMemo(
  () => createLinkAnimationHandler(view, animate),
  [view, animate, isMobile]
);
```

## Bug 2: Parent container dropping mouse-exit events (ElementInteraction.ts)

After fixing the handler, the hover-stuck bug still occurred when hovering during the entrance animation sequence.

The title page's link entrance is a series animation: about -> projects -> contact -> blog. The parent `linkContainer` stays in `"entering"` stage until the last link (blog) finishes. When "about" finishes and reaches `"main"`, it can accept hover events. But `handleMouseMove` had guards that prevented `mouseIsInside` from being set on any element in `"entering"` stage:

```typescript
if (!pointIsInside && this.stage !== "entering") {  // mouse exit
    this.mouseIsInside = false;
    ...
} else if (!this.mouseIsInside && this.stage !== "entering") {  // mouse enter
    this.mouseIsInside = true;
    ...
}
```

When the user hovered the about link while `linkContainer` was still `"entering"`:

1. Mouse enters `linkContainer`'s bounds — `pointIsInside` is true, so children get the event. But `mouseIsInside` is **not set** on `linkContainer` (blocked by the `"entering"` guard).
2. The about link (in `"main"`) receives the event, goes bold.
3. User moves mouse away — `linkContainer` checks `pointIsInside || mouseIsInside` -> `false || false` -> **skips the entire block**.
4. Children never receive the mouse-exit event. The about link stays bold permanently.

**Fix:** Removed the `this.stage !== "entering"` guards entirely. Mouse enter/exit events, `mouseIsInside` tracking, and hover callbacks now fire regardless of whether the element is in `"entering"` or `"main"` stage. This is simpler and more correct — `mouseIsInside` should always reflect the actual pointer state, and hover effects during entrance animations are natural user-facing behavior.

```typescript
// Before
if (!pointIsInside && this.stage !== "entering") { ... }
else if (!this.mouseIsInside && this.stage !== "entering") { ... }

// After
if (!pointIsInside) { ... }
else if (!this.mouseIsInside) { ... }
```

## Tests added

- `e2e/resize-hover-stuck.spec.ts` — Resizes mobile to desktop, hovers a link during the entrance animation window, then moves the mouse away. Asserts the bold state (Mathematical Bold Unicode characters) is cleared after mouse exit.
