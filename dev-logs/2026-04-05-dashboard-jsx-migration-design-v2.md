# Dashboard JSX Migration — Design v2

This is a revised design for the three areas of work needed to support migrating the dashboard to the declarative JSX system. It supersedes the v1 design with sharper architectural decisions, informed by a deeper review of the reconciler, Element lifecycle, and TableElement internals.

---

## 1. Table Rows as JSX Children

### The Problem (unchanged)

`commitUpdate` for `cm-table` updates `columns`, `title`, `titleAlign`, and `showRowSeparators` — but not rows. The underlying `TableElement.setRows()` exists and works, but the reconciler has no way to invoke it.

### Design Decision: Structural Element Subclasses

v1 considered two approaches: flat `rows` prop (Option A) and structural JSX children (Option B). A third option — React wrapper components that extract row data and pass a flat `rows` prop to the intrinsic `<cm-table>` — was also evaluated. The wrapper approach would avoid reconciler changes entirely, but falls apart for element cells: React components can't access the underlying `Element` instances of their children without complex ref-plumbing, and even then the timing is fragile (refs populate after commit, but `setRows()` needs the elements during commit).

**The chosen approach is structural JSX children (Option B from v1), implemented as Element subclasses with a formal `StructuralElement` base class.**

This means `cm-table-row` and `cm-table-cell` are real intrinsic element types in the reconciler, but they extend a `StructuralElement` base class that opts out of view registration, drawing, and layout. They exist solely to carry data for their parent `TableElement`.

#### Why Element subclasses over marker objects

The reconciler's `Instance` type is `Element`. Introducing non-Element markers would require a union type (`Element | MarkerNode`) that ripples through every hostConfig method — `appendChild`, `removeChild`, `commitUpdate`, `commitMount`, etc. Element subclasses keep `Instance = Element` and require no type-level changes.

#### Why not React wrapper components

A `<CMTable>` React component that processes `<CMTableRow>` / `<CMTableCell>` children in React-land and passes a flat `rows` prop to `<cm-table>` was considered. For text-only cells this works, but for cells containing `<cm-container>` or other intrinsic elements, the wrapper needs the underlying `Element` instance to pass as `{ element }` in `TableRowConfig`. React doesn't expose host instances from the component layer — refs populate *after* commit, creating a chicken-and-egg problem where `setRows()` needs the Element during the same commit that creates it. Workarounds (two-pass rendering, effect-based assembly) are fragile and add latency.

### The JSX API

```tsx
<cm-table elementKey="calendar" columns={columns}>
  <cm-table-row>
    <cm-table-cell text="Mon" />
    <cm-table-cell text="Tue" />
  </cm-table-row>
  <cm-table-row>
    <cm-table-cell>
      <cm-container elementKey="today" mainAxis="x">
        <cm-text elementKey="day" text={toBold("5")} />
        <cm-text elementKey="dot" text="*" />
      </cm-container>
    </cm-table-cell>
    <cm-table-cell text="6" />
  </cm-table-row>
</cm-table>
```

### Implementation

#### 1.1 `StructuralElement` base class (`char-matrix` package)

A new abstract base class for elements that exist as reconciler-managed nodes but don't participate in view registration, drawing, or layout.

```ts
export abstract class StructuralElement extends Element {
  override registerWithView(): void {
    // No-op: structural elements are not rendered by the view.
    // Children that are real Elements get registered when the
    // owning parent (e.g., TableElement) calls setRows().
  }

  override unregisterWithView(): void {
    // No-op: mirrors registerWithView.
  }

  override drawOwnContent(): void {
    // No-op: nothing to draw.
  }

  override reprocessContent(): void {
    // No-op: no content to process.
  }
}
```

This is intentionally minimal. `StructuralElement` doesn't attempt to model what structural data it carries — that's the job of concrete subclasses and the child-commit strategy (see 1.3).

Two concrete subclasses:

- **`TableRowElement extends StructuralElement`** — No additional fields. Its role is purely positional: it groups `TableCellElement` children into a row.
- **`TableCellElement extends StructuralElement`** — Has an optional `text: string` field. If `text` is set, the cell is a text cell. If it has element children (tracked by the reconciler's `childrenMap`), the first child is the cell's element content.

Both need minimal `ElementConfig` to satisfy the base class constructor (a key and a view reference). The reconciler constructs them the same way as any other element, just with fewer config fields.

#### 1.2 Intrinsic element types in the reconciler

Add `"cm-table-row"` and `"cm-table-cell"` to `CMElementType`. Add corresponding prop interfaces:

```ts
interface CMTableRowProps {
  key?: string | number;
  children?: React.ReactNode;
}

interface CMTableCellProps {
  key?: string | number;
  text?: string;
  children?: React.ReactNode;  // mutually exclusive with text
}
```

In `createElement`, create `TableRowElement` / `TableCellElement` instances. These are lightweight — no sizing, no padding, no animation.

Register them in the JSX `IntrinsicElements` interface.

#### 1.3 Extensible child-commit strategy

v1 proposed specializing `commitChildren` with `instanceof TableElement` checks. This works for one case but doesn't scale to future element types that may need custom child handling (lists, grids, etc.).

**Instead, introduce a strategy registry keyed by constructor:**

```ts
type ChildCommitStrategy = (parent: Element, children: Element[]) => void;
const childCommitStrategies = new Map<Function, ChildCommitStrategy>();

export function registerChildCommitStrategy(
  ctor: Function,
  strategy: ChildCommitStrategy
): void {
  childCommitStrategies.set(ctor, strategy);
}
```

The default `commitChildren` becomes:

```ts
function commitChildren(parent: Element) {
  const children = getTrackedChildren(parent);
  const strategy = childCommitStrategies.get(parent.constructor);
  if (strategy) {
    strategy(parent, children);
  } else {
    parent.setChildren([...children]);
  }
}
```

For tables, register:

```ts
registerChildCommitStrategy(TableElement, (parent, children) => {
  const table = parent as TableElement;
  const rows: TableRowConfig[] = [];

  for (const rowEl of children) {
    if (!(rowEl instanceof TableRowElement)) continue;
    const cells: TableCellConfig[] = [];

    for (const cellEl of getTrackedChildren(rowEl)) {
      if (!(cellEl instanceof TableCellElement)) continue;

      const cellChildren = getTrackedChildren(cellEl);
      if (cellChildren.length > 0) {
        // Element cell — first child is the content element
        cells.push({ element: cellChildren[0] });
      } else {
        // Text cell
        cells.push({ text: (cellEl as TableCellElement).getText() });
      }
    }

    rows.push({ cells });
  }

  table.setRows(rows);
});
```

This keeps hostConfig generic. Future element types that need custom child handling register their own strategy without modifying any existing code.

#### 1.4 commitMount for structural elements

`commitMount` currently commits tracked children for every instance. For `StructuralElement` instances, this should be a no-op — their children are consumed by the parent's child-commit strategy, not by `setChildren()`.

```ts
commitMount(instance: Instance) {
  if (instance instanceof StructuralElement) {
    return; // Handled by parent's child-commit strategy
  }
  // ... existing overlay and normal logic
}
```

This is the *only* `instanceof` check in hostConfig — and it uses the abstract base class, not a concrete type. It won't need modification as new structural element types are added.

#### 1.5 Props interfaces

```ts
interface CMTableRowProps {
  key?: string | number;
  children?: React.ReactNode;
}

interface CMTableCellProps {
  key?: string | number;
  text?: string;
  children?: React.ReactNode;
}
```

`commitUpdate` for `cm-table-cell` should update the `text` field on `TableCellElement` and then trigger a row re-assembly on the ancestor table (see Section 2.3).

---

## 2. Lifecycle Ownership for Cell Elements

### The Problem

When a `<cm-table-cell>` contains a child element (e.g., `<cm-container>`), two systems touch that element's lifecycle: the React reconciler (which creates, updates, and destroys it) and `TableElement.setRows()` (which registers it with the view and manages its position within the table grid). These must not conflict.

### Ownership Model

**The reconciler owns creation and destruction. `setRows()` owns view registration and positioning.**

Concretely:

1. The reconciler creates element instances for cell contents via `createElement` and tracks them in the cell's `childrenMap` entry.
2. `commitMount` on `StructuralElement` is a no-op (Section 1.4), so cell children are *not* registered with the view during mount.
3. When `commitChildren` fires on the `TableElement`, the table's child-commit strategy reads cell children from `childrenMap`, assembles `TableRowConfig[]`, and calls `setRows()`.
4. `setRows()` calls `registerWithView()` on element cells and positions them within the table grid. From this point, the table owns their view registration and layout.
5. When React unmounts a cell child, `removeChild` fires. The child is removed from `childrenMap` and `unregisterWithView()` is called. Then `commitChildren` fires on the parent (the cell marker), which bubbles up to re-trigger `setRows()` on the table (Section 2.3).

### 2.1 Idempotent view registration

Both `registerWithView()` and `unregisterWithView()` on `Element` must be made idempotent. Currently, `registerWithView()` unconditionally calls `view.registerElement(this)` and recurses into children, and `unregisterWithView()` unconditionally calls `view.unregisterElement(this)`. Double-registration or double-unregistration can occur when the reconciler and `setRows()` both act on the same element.

```ts
public registerWithView(): void {
  if (this.isOnView) return;
  this.view.registerElement(this);
  this.isOnView = true;
  this.children.forEach((child) => child.registerWithView());
}

public unregisterWithView(): void {
  if (!this.isOnView) return;
  this.handleUnregisterWithView();
  this.view.unregisterElement(this);
  this.isOnView = false;
  this.children.forEach((child) => child.unregisterWithView());
}
```

This is a general safety improvement that benefits the system beyond the table use case. Any code path that calls register/unregister defensively (or in cleanup logic) becomes safe without precondition checks.

### 2.2 In-place updates to cell content

When React updates a `<cm-text>` inside a cell (e.g., text prop changes), `commitUpdate` fires on the `TextElement` instance directly, calling `updateTextConfig()` and `flagForRedraw()`. Because the element is already positioned by the table and registered with the view, this propagates correctly with no special handling.

### 2.3 Structural changes bubble to the owning table

When a cell's children change (elements added, removed, or reordered), `commitChildren` fires on the cell marker. The cell marker is a `StructuralElement` — calling `setChildren()` on it would be meaningless. Instead, structural changes must bubble up to the nearest non-structural ancestor and re-trigger its child-commit strategy.

**Mechanism: `commitChildren` checks for structural parents.**

```ts
function commitChildren(parent: Element) {
  const children = getTrackedChildren(parent);
  const strategy = childCommitStrategies.get(parent.constructor);

  if (strategy) {
    strategy(parent, children);
  } else if (parent instanceof StructuralElement) {
    // Structural elements don't own their children directly.
    // Bubble up: find the nearest non-structural ancestor and
    // re-run its child-commit strategy.
    bubbleCommitToAncestor(parent);
  } else {
    parent.setChildren([...children]);
  }
}

function bubbleCommitToAncestor(structural: Element) {
  // Walk up via the Element's parent chain to find the owning
  // non-structural element.
  let current = structural.getParent();
  while (current) {
    if (!(current instanceof StructuralElement)) {
      commitChildren(current as Element);
      return;
    }
    current = current.getParent();
  }
}
```

Wait — `StructuralElement` instances don't have their `parent` set by the reconciler (since `commitMount` is a no-op and `setChildren` is never called on them). We need the reconciler to track the parent-child relationship for structural elements without triggering the Element's own parent machinery.

**Better approach: use the reconciler's own `childrenMap` to walk the tree.** The reconciler already knows which children belong to which parent. Instead of relying on `Element.getParent()`, maintain a `parentMap` alongside `childrenMap`:

```ts
const parentMap = new WeakMap<Element, Element>();

// Updated in appendInitialChild, appendChild, removeChild, insertBefore:
function trackParent(child: Element, parent: Element) {
  parentMap.set(child, parent);
}

function untrackParent(child: Element) {
  parentMap.delete(child);
}
```

Then `bubbleCommitToAncestor` uses `parentMap`:

```ts
function bubbleCommitToAncestor(structural: Element) {
  let current: Element | undefined = parentMap.get(structural);
  while (current) {
    if (!(current instanceof StructuralElement)) {
      commitChildren(current);
      return;
    }
    current = parentMap.get(current);
  }
}
```

This is clean — the reconciler already tracks children; tracking parents is the symmetric addition. The `parentMap` is only used for the bubble-up path and doesn't interfere with `Element.parent` (which is set by `setChildren` / `setRows` in the char-matrix layer).

**When `commitUpdate` fires on a `cm-table-cell`** (e.g., `text` prop changed), it should also bubble:

```ts
// In commitUpdate, after updating the cell:
if (instance instanceof StructuralElement) {
  bubbleCommitToAncestor(instance);
}
```

This ensures that text prop changes on cells trigger `setRows()` on the table, just like structural child changes do.

### Edge Cases

- **Dynamic row count** — rows added/removed causes React to call `appendChild`/`removeChild` on the table, which triggers `commitChildren` → the table's child-commit strategy → `setRows()`. Handled naturally.
- **Conditional cell content** — a cell that conditionally renders an element vs. text: React manages the child lifecycle, structural change bubbles up, `setRows()` rebuilds with the new cell content.
- **Empty cells** — a `<cm-table-cell />` with no `text` and no children produces `{ text: "" }`. The strategy should handle this explicitly.
- **Mixed cells** — rows containing both text and element cells are supported by `TableCellConfig` / `TableRowConfig` already.

---

## 3. Render Loop Integration

### The Problem (unchanged)

The dashboard manually wires `onAnimationActive` callbacks for every widget to bridge between animation events and `requestAnimationFrame`. The website's `RenderLoopController` already solves this — `DefaultAnimationHandler` calls `view.getRenderLoop()?.requestContinuousRendering()` — but the dashboard's render target doesn't provide a render loop.

### Design Decision: Composable RenderLoopController (unchanged from v1)

The dashboard creates a `RenderLoopController` and injects it into the render target. This is the right design — it keeps the dashboard's custom frame logic (spring lattice, overlays, theme) while eliminating all manual animation-active plumbing.

### 3.1 `setRenderLoop` on `RenderTarget`

Add an optional `setRenderLoop` method to the `RenderTarget` interface:

```ts
interface RenderTarget {
  // ... existing methods ...
  getRenderLoop?(): RenderLoopController;
  setRenderLoop?(controller: RenderLoopController): void;
}
```

Both methods are optional. Render targets that support external render loop injection implement both. Render targets that own their render loop internally (like the website's `MatrixView`) can implement only `getRenderLoop`.

Since `getRenderLoop` is already optional on the interface, `setRenderLoop` follows the same pattern.

### 3.2 `resetAfterCommit` schedules a frame

After every React commit, the reconciler should schedule a render frame so that any changes to element content become visible:

```ts
resetAfterCommit(container: RootContainer) {
  container.view.getRenderLoop?.()?.scheduleFrame();
}
```

This replaces the current no-op. Key properties:

- **Batched**: React batches state updates, so multiple `setState` calls within the same tick produce one commit and one `scheduleFrame()`.
- **Idempotent**: `scheduleFrame()` checks `this.frameScheduled` before calling `requestAnimationFrame`, so redundant calls are free.
- **Per-root**: Uses `container.view` to target the correct render loop when multiple roots exist.
- **Safe at mount time**: Works during initial render — `resetAfterCommit` fires after all `commitMount` calls, triggering the first frame.

The caller must ensure `setRenderLoop()` is called before `render()` so that `getRenderLoop()` returns a valid controller during the first commit. This is a simple ordering requirement.

### 3.3 Dashboard-side changes (for reference)

1. Create a `RenderLoopController` in `main.ts`, passing the existing `frame()` as the callback.
2. Call `view.setRenderLoop(renderLoop)` after construction.
3. Replace manual `scheduleFrame()` calls with `renderLoop.scheduleFrame()`.
4. Delete every widget's `refreshInterval`, `animationActiveCallback`, `onAnimationActive` callback, and the corresponding wiring in `main.ts`.
5. The `contentDirty` flag can be replaced by `renderLoop.scheduleFrame()` at the points where data changes (fetch results, 1-second tick).

---

## Summary of Package Changes

### `char-matrix` package

1. **New `StructuralElement` abstract base class** — extends `Element`, overrides `registerWithView`, `unregisterWithView`, `drawOwnContent`, `reprocessContent` as no-ops. Exported from the package.
2. **`TableRowElement` and `TableCellElement`** — extend `StructuralElement`. `TableCellElement` has an optional `text` field. Both are lightweight (no sizing, padding, animation). Exported from the package.
3. **Idempotent `registerWithView()` and `unregisterWithView()`** — guard with `isOnView` check. This is a general safety improvement.
4. **Optional `setRenderLoop()` on `RenderTarget` interface.**

### `char-matrix-react-renderer` package

1. **New intrinsic element types** — `cm-table-row` and `cm-table-cell` added to `CMElementType`, with prop interfaces and JSX `IntrinsicElements` declarations.
2. **`createElement` cases** for `cm-table-row` and `cm-table-cell` — create `TableRowElement` / `TableCellElement` instances.
3. **Child-commit strategy registry** — `registerChildCommitStrategy(ctor, fn)` exported for extensibility. `commitChildren` dispatches to registered strategy or falls back to `setChildren()`. The table strategy is registered during module initialization.
4. **`parentMap` tracking** — `WeakMap<Element, Element>` maintained alongside `childrenMap`, updated in `appendInitialChild`, `appendChild`, `removeChild`, `insertBefore`.
5. **Structural element handling in `commitChildren`** — when called on a `StructuralElement`, bubbles up via `parentMap` to the nearest non-structural ancestor.
6. **Structural element handling in `commitMount`** — no-op for `StructuralElement` instances.
7. **Structural element handling in `commitUpdate`** — after updating a `StructuralElement`'s props, bubbles up to trigger the ancestor's child-commit strategy.
8. **`resetAfterCommit`** — calls `container.view.getRenderLoop?.()?.scheduleFrame()`.

### `char-matrix-fx` package

No changes needed. `DefaultAnimationHandler` already calls `getRenderLoop()` correctly.
