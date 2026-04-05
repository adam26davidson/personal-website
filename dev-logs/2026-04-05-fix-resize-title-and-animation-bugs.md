# Fix: Title disappearing and links skipping animation on viewport resize

**Date:** 2026-04-05
**PR:** #47 (feat/declarative-renderer-extensions)
**File changed:** `packages/char-matrix/src/Element/Element.ts`

## Context

The char-matrix framework uses a custom React reconciler to render declarative JSX (`<cm-container>`, `<cm-text>`, etc.) into a character-grid element tree. Each element has a lifecycle stage (`queued` -> `entering` -> `main` -> `exiting` -> `exited`), and entrance/exit animations are orchestrated via `TransitionSequence` objects built from the element's children.

When the browser window crosses the mobile breakpoint (80 character columns / 640px), `MatrixController.handleMobileChange()` calls `enterPage(true)`, which re-renders the React component tree and starts a new entrance transition on the root element.

## Bug 1: Title disappearing after resize

**Symptom:** On both the title page and content pages, resizing between desktop and mobile caused the title element to vanish entirely.

**Root cause:** In `Element.setChildren()`, the entrance `TransitionSequence` was only rebuilt when `this.stage === "queued"` (the initial state before first render). When `handleMobileChange` triggered a React re-render, the reconciler swapped the title child (e.g. `CMLargeTitle` -> `CMMediumTitle`), calling `removeChild` + `appendChild` on the parent container. This called `setChildren()` on the parent, but since the parent was already in `"main"` stage, the entrance sequence was **not rebuilt** to include the new title child. When `root.startTransition("enter")` cascaded down, the new title was never started and remained in `"queued"` stage permanently — and `draw()` skips `"queued"` elements entirely.

**Fix:** Changed the entrance sequence rebuild condition from `this.stage === "queued"` to `this.stage !== "exiting" && this.stage !== "exited"`, matching the guard already used for the exit sequence. This ensures the entrance sequence is rebuilt with the current children whenever they change, as long as the element isn't in the process of exiting.

```typescript
// Before
if (this.stage === "queued") {
  this.entranceSequence = new TransitionSequence(...);
}

// After
if (this.stage !== "exiting" && this.stage !== "exited") {
  this.entranceSequence = new TransitionSequence(...);
}
```

## Bug 2: Nav links visible before entrance animation

**Symptom:** On the title page, resizing from desktop to mobile (or vice versa) caused the nav links (ABOUT, PROJECTS, CONTACT, BLOG) to appear fully rendered before their entrance animation played. They should have been hidden and revealed progressively by the animation.

**Root cause:** The nav link elements have stable React keys, so the reconciler **reuses** them in place rather than recreating them. They stay in `"main"` stage (fully visible and drawn). When the parent's entrance sequence is started, it cascades `startTransition("enter")` to children — but in a `series` sequence, later children (like the links) must wait for earlier children (like the title) to finish animating. During that wait, the reused link elements remain in `"main"` stage and are drawn normally.

The rendering pipeline draws elements to two layers:
- **Content layer:** always written (unless `"queued"`)
- **Animation layer:** written only when there is no active animation and stage is not `"queued"`

The surface composites animation over content. Elements in `"main"` stage with no active animation write to both layers, making them fully visible. They need to be in `"queued"` stage to be hidden.

**Fix:** In `startTransition("enter")`, before starting the entrance sequence, reset all children in the sequence to `"queued"` stage. This hides them until the sequence individually starts each child's entrance animation. Since `draw()` returns early for `"queued"` elements, descendants are also hidden without needing a recursive reset.

```typescript
// Added before sequence.startSequence() in startTransition()
if (type === "enter") {
  for (const child of sequence.extractAll()) {
    child.stage = "queued";
  }
}
```

## Tests added

- `e2e/resize-title-visibility.spec.ts` — 4 tests verifying the title remains visible after resizing in both directions on both the title page and content pages.
- `e2e/resize-link-animation.spec.ts` — 2 tests verifying that nav links are hidden (in entrance animation queue) after a resize, then appear after animations complete.
