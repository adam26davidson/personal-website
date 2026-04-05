# Fix: Content squished in upper-left corner after PR review refactors

**Date:** 2026-04-05
**PR:** #47 (feat/declarative-renderer-extensions)
**Files changed:** `packages/char-matrix/src/Element/ParentElement.ts`, `src/matrixView.ts`, `packages/char-matrix/src/Element/Element.ts`, `packages/char-matrix/src/Element/ZIndex.test.ts`

## Context

During PR review, several refactors were applied to the char-matrix element system. One of these moved the `flowChildren` computation (children with `positionMode === "flow"`) from being recalculated inline on every `resizeChildren()` / `reprocessContent()` call into a cached `this.flowChildren` array on `ParentElement`. A new `updateFlowChildren()` method was added to recompute the cache, and `Element.setChildren()` was updated to call it.

## Bug: All content rendered at 0×0 in the upper-left corner

**Symptom:** At desktop viewport sizes, the website appeared to render in "mobile mode" with all content squished into the upper-left corner. Playwright tests confirmed that content text (About, Projects, Contact) was not appearing in the character matrix at either mobile or desktop sizes. 9 of 12 e2e tests failed.

**Root cause:** `MatrixView.setRoot()` directly assigns `this.children = [element]` without going through `Element.setChildren()`. After the `flowChildren` cache was introduced, `resizeChildren()` started reading from `this.flowChildren` instead of filtering `this.children` inline. Since `setRoot()` never called `updateFlowChildren()`, the cache remained an empty array `[]`. This meant `resizeChildren()` iterated over zero children — the root element (which uses `widthType="relative" width={1} heightType="relative" height={1}`) was never sized to fill the viewport. It kept its initial size of `IntPoint(0, 0)`, collapsing the entire layout to a zero-size region at the origin.

The same issue existed in `Element.pruneExitedChildren()`, which also directly reassigns `this.children` without updating the cache.

**Fix:** Added `this.updateFlowChildren()` calls in all code paths that directly assign `this.children` outside of `setChildren()`:

1. `MatrixView.setRoot()` — after `this.children = [element]`
2. `Element.pruneExitedChildren()` — after `this.children = newChildren`
3. `ZIndex.test.ts` mock `setRoot()` — same pattern as MatrixView

**Result:** 11 of 12 Playwright tests now pass (up from 3). The one remaining failure (`mobile → desktop: links not visible immediately after resize`) is a pre-existing animation timing issue unrelated to this bug.

## Lesson

When introducing a cache derived from a mutable field, audit every assignment site — not just the primary setter method. Direct field assignments that bypass the setter will silently leave the cache stale.
