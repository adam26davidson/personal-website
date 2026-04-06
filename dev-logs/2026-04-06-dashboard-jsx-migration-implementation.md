# Dashboard JSX Migration — Implementation Notes

Implementation of the package-level changes from `2026-04-05-dashboard-jsx-migration-design-v2.md`. This covers `char-matrix` and `char-matrix-react-renderer` only — the dashboard migration itself is a separate step.

---

## What was built

All items from the v2 design summary were implemented. The changes enable `<cm-table>` to accept `<cm-table-row>` and `<cm-table-cell>` JSX children, with cells containing either text or nested element trees.

## Implementation notes

### Structural types and the `CMProps` union

Adding `CMTableRowProps` and `CMTableCellProps` to the `CMProps` union created TypeScript narrowing issues. These props don't extend `CMBaseProps` (they have no `onClick`, `animationHandler`, `animationKey`, etc.), so code after a `switch` on element type that accesses those fields fails to compile — TypeScript doesn't narrow the union based on early returns from prior `if` checks.

Resolved with two patterns:
- **`createElement`**: structural type cases `return` directly from the switch instead of `break`ing, so they never reach the `onClick`/`animationHandler` wiring code below.
- **`commitUpdate`**: structural types are handled with early `if`/`return` checks before the switch. The shared `onClick`/`animationKey` code after the switch casts `_oldProps`/`newProps` to `CMBaseProps` (safe because structural types already returned).

### `commitMount` change

The original `commitMount` had:
```ts
const children = getTrackedChildren(instance);
if (children.length > 0) {
  instance.setChildren([...children]);
}
```

This was kept rather than replaced with a bare `commitChildren(instance)` call, because `setChildren([])` on an element with no children triggers unnecessary `reprocessContent()` and transition sequence rebuilds. The `length > 0` guard preserves the original optimization.

For elements *with* children, `commitChildren` is now called instead of `setChildren` directly, so the strategy registry is used during initial mount (e.g., a `<cm-table>` with row children on first render gets its `setRows()` called via the table strategy).

### `commitStrategyRegistry` key type

The design used `Map<Function, ChildCommitStrategy>`. ESLint's `@typescript-eslint/ban-types` rule rejects `Function`. Changed to `ElementConstructor` (`new (...args: any[]) => Element`), with `parent.constructor as ElementConstructor` at the lookup site since `Object.constructor` is typed as `Function`.

### `registerChildCommitStrategy` exported

The strategy registry function is exported from the renderer package so that future element types (lists, grids, etc.) can register their own strategies without modifying hostConfig. The table strategy is registered at module initialization time.

---

## Files changed

### `char-matrix`

| File | Change |
|------|--------|
| `src/Element/StructuralElement.ts` | **New.** Abstract base class — all 9 abstract methods implemented as no-ops. |
| `src/Element/TableRowElement.ts` | **New.** Extends StructuralElement, no additional fields. |
| `src/Element/TableCellElement.ts` | **New.** Extends StructuralElement, adds `text` getter/setter. Exports `TableCellElementConfig`. |
| `src/Element/Element.ts` | Idempotent guards on `registerWithView`/`unregisterWithView`. |
| `src/interfaces/RenderTarget.ts` | Added optional `setRenderLoop()`. |
| `src/index.ts` | Exports for the 3 new classes + config type. |

### `char-matrix-react-renderer`

| File | Change |
|------|--------|
| `src/hostConfig.ts` | New imports; `CMTableRowProps`/`CMTableCellProps` interfaces; extended `CMElementType` + `CMProps`; `parentMap` + tracking helpers; `commitStrategyRegistry` + table strategy + `bubbleCommitToAncestor`; `createElement` cases; `commitMount` structural skip; `commitUpdate` structural handling; `resetAfterCommit` schedules frame. |
| `src/types.ts` | `cm-table-row`/`cm-table-cell` in JSX `IntrinsicElements`. |
| `src/index.ts` | Exports for new prop types + `registerChildCommitStrategy`. |

---

## Test results

- 88 char-matrix unit tests: pass
- 31 char-matrix-react-renderer unit tests: pass
- 13 Playwright e2e tests: pass

No new tests added in this change — the structural elements and strategy registry will get coverage when the dashboard migration uses them. The existing test suites confirm no regressions.
