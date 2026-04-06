# Dashboard JSX Migration — Design Plan

The char-matrix dashboard currently uses the imperative API to build its widget tree. The personal website has a declarative JSX system (via `char-matrix-react-renderer`) that is more ergonomic for authoring. This document lays out the design for package-level changes needed to support migrating the dashboard to JSX.

Three areas need work in the char-matrix / renderer packages:

1. **Table rows as JSX children** — the reconciler can't express table row data today
2. **Table cells containing React-rendered elements** — closely related to #1
3. **Animation-active render loop integration** — eliminating manual animation polling

---

## 1. Table Rows as JSX Children

### The Problem

`commitUpdate` for `cm-table` (`hostConfig.ts:486-494`) updates `columns`, `title`, `titleAlign`, and `showRowSeparators` — but not rows. The underlying `TableElement.setRows()` exists and works, but the reconciler has no way to invoke it.

### Design Options

**Option A: `rows` as a flat prop on `<cm-table>`**

```tsx
<cm-table
  elementKey="calendar"
  columns={columns}
  rows={[
    { cells: [{ text: "Mon" }, { text: "Tue" }] },
    { cells: [{ text: "1" }, { text: "2" }] },
  ]}
/>
```

Add `rows: TableRowConfig[]` to `CMTableProps`, and in `commitUpdate` call `instance.setRows(newProps.rows)`. Mirrors exactly how the imperative API works.

Limitation: cells containing elements must be constructed imperatively and passed as `{ element: someElement }`. This breaks the declarative model — you'd create `Element` instances by hand and embed them in the prop. It works, but it's a half-measure that doesn't compose with JSX.

**Option B: `<cm-table-row>` and `<cm-table-cell>` intrinsic elements**

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
        <cm-text elementKey="dot" text="●" />
      </cm-container>
    </cm-table-cell>
    <cm-table-cell text="6" />
  </cm-table-row>
</cm-table>
```

Fully declarative. Cells can contain either `text` or React children (which become `Element` instances via the reconciler). The reconciler collects rows/cells from the tree structure and calls `setRows()` with assembled `TableRowConfig[]`.

### Recommended: Option B

Option B is the more ergonomic design, but `<cm-table-row>` and `<cm-table-cell>` aren't real `Element` subclasses — they're structural markers that exist purely to express data for the parent `<cm-table>`. This is similar to how React Native's `<Picker.Item>` or HTML's `<option>` work — not standalone layout elements, but configuration nodes.

### Implementation Approach

1. **Add two new element types to the reconciler**: `cm-table-row` and `cm-table-cell`. These don't create `Element` instances — they create lightweight marker objects (e.g., `{ __type: "table-row", cells: [] }` and `{ __type: "table-cell", text?: string, element?: Element }`).

   Alternative: use sentinel `Element` instances. Since the reconciler's `Instance` type is `Element`, it may be simpler to create minimal `Element` subclasses (or even just `ContainerElement` instances with special keys) that the table recognizes. The reconciler already tracks children per parent via `childrenMap`. When `commitChildren` is called on a `<cm-table>`, instead of calling `parent.setChildren()`, it would:
   - Iterate the tracked children (which are row markers)
   - For each row, iterate *its* tracked children (cell markers)
   - For each cell, check if it has text or a child element
   - Assemble `TableRowConfig[]` and call `parent.setRows()`

2. **The `commitChildren` hook is the key integration point.** Currently:
   ```ts
   function commitChildren(parent: Element) {
     const children = getTrackedChildren(parent);
     parent.setChildren([...children]);
   }
   ```
   For table elements, this needs to be specialized. When `parent` is a `TableElement`, it should assemble rows from the marker children and call `setRows()`. This means `commitChildren` needs type-awareness — either via `instanceof TableElement` or by checking a type tag stored on creation.

3. **Props for the new types:**
   ```ts
   interface CMTableRowProps {
     key?: string | number;
     children?: React.ReactNode;
   }

   interface CMTableCellProps {
     key?: string | number;
     text?: string;              // simple text cell
     children?: React.ReactNode; // element cell (mutually exclusive with text)
   }
   ```

4. **Changes to `char-matrix` package:** Likely minimal. `TableElement.setRows()` already accepts `{ element: Element }` cells. The reconciler just needs to assemble `TableRowConfig[]` from the React tree. One thing to verify: `setRows()` calls `unregisterWithView()` on old elements then `registerWithView()` on new ones. If the reconciler has already registered these elements, there will be double-registration. Fix: make `registerWithView()` idempotent (check `this.isOnView` before registering). This is a small safety improvement that benefits the system broadly.

5. **Update handling.** When React reconciles and a cell's text changes, `commitUpdate` is called on the cell marker. The cell marker needs to propagate this up — either by re-triggering `setRows()` on the parent table, or by directly updating the corresponding `TableCellConfig`. Re-triggering `setRows()` is simpler and matches how the imperative API works. For the dashboard's use case (updates every 1-20 seconds), efficiency isn't a concern.

### Edge Cases

- **Dynamic row count** (rows added/removed) — handled naturally by React reconciliation + `setRows()`
- **Rows with mixed text and element cells** — supported by `TableCellConfig` already
- **Empty cells** — `{ text: "" }` works today
- **`setTitle()`** — the reconciler already handles `title` via `updateTableConfig`, which sets `this.title` directly and calls `reprocessContent()`

---

## 2. Table Cells Containing React-Rendered Elements

This is solved by the Option B design above, but there are additional lifecycle subtleties.

### Element Lifecycle in Cells

When a cell contains a `<cm-container>` with children, those elements go through the normal React reconciler lifecycle — creation, mounting, updates, unmounting. But `TableElement.setRows()` manages child registration independently. The reconciler and `TableElement` could conflict over who owns these elements' lifecycles.

### Proposed Ownership Model

The reconciler creates element instances for cell contents but does *not* add them as children of the cell marker or the table — it holds them in the cell marker's tracked children list. When `commitChildren` is called on the table, it reads the cell markers' children and passes them as `{ element }` to `setRows()`. From that point, `TableElement` owns the element's parent/view registration.

This means:
- `appendInitialChild` and `appendChild` on a cell marker should store the child but **not** call `registerWithView()` or `setParent()`
- `commitMount` on a cell marker should be a no-op
- The table's specialized `commitChildren` hands the elements over to `setRows()`, which does the registration

### What If Cell Content Updates?

When React updates a `<cm-text>` inside a cell, `commitUpdate` fires on the text element instance directly (calling `updateTextConfig`). This is fine — the element is already positioned by the table, and the text update + `flagForRedraw()` propagates correctly. No special handling needed.

### What If Cell Structure Changes?

If a cell conditionally renders different elements, React will call `removeChild`/`appendChild` on the cell marker. The cell marker needs to propagate this structural change to the parent table by re-triggering `setRows()`. This could be done by:

- Having the cell marker hold a reference to its parent table
- When `commitChildren` is called on a cell marker, it triggers `commitChildren` on the grandparent table

One approach: make `commitChildren` on row/cell markers always bubble up to the nearest ancestor `TableElement` and re-run the row assembly.

---

## 3. Animation-Active Render Loop Integration

### The Problem

The dashboard has this pattern in every widget:

```ts
let refreshInterval: number | undefined;
let animationActiveCallback: () => void = () => {};

// When data updates:
handler.startAnimation("enter", () => {
  clearInterval(refreshInterval);
  refreshInterval = undefined;
});
refreshInterval = window.setInterval(() => {
  animationActiveCallback();
}, 20);
```

And in `main.ts`:
```ts
const animationCallback = () => {
  contentDirty = true;
  scheduleFrame();
};
onTransitAnimationActive(animationCallback);
onClockAnimationActive(animationCallback);
// ... repeated for every widget
```

This is manual plumbing to solve a problem that `RenderLoopController` already solves in the website. `DefaultAnimationHandler.startAnimation()` already calls `this.view.getRenderLoop?.()?.requestContinuousRendering(this)` — but the dashboard's `WebViewRenderTarget` doesn't implement `getRenderLoop()`.

### Design Options

**Option A: Integrate `RenderLoopController` into `WebViewRenderTarget` directly**

The `WebViewRenderTarget` would own a `RenderLoopController` and its frame function. But the dashboard's `frame()` in `main.ts` includes spring lattice logic, overlay drawing, theme changes, etc. The frame function would need to be injectable or configurable — more coupling than necessary.

**Option B: Make `RenderLoopController` a composable piece that `main.ts` creates and injects**

```ts
// main.ts
const renderLoop = new RenderLoopController(() => frame());
view.setRenderLoop(renderLoop);
```

The dashboard keeps its custom frame logic but the animation-active plumbing disappears because `DefaultAnimationHandler` calls `renderLoop.requestContinuousRendering()` automatically.

### Recommended: Option B

Less invasive — the dashboard keeps its custom frame logic (spring lattice, overlays, theme) but the animation-active plumbing disappears entirely.

### Changes to `char-matrix`

1. Add `setRenderLoop(controller: RenderLoopController): void` to the `RenderTarget` interface (optional method, like `addOverlay`)
2. That's it — `getRenderLoop()` is already on the interface and `DefaultAnimationHandler` already calls it

### Dashboard-Side Changes (for reference)

1. Create a `RenderLoopController` in `main.ts`, passing the existing `frame()` as the callback
2. Call `view.setRenderLoop(renderLoop)` after construction
3. Replace manual `scheduleFrame()` calls with `renderLoop.scheduleFrame()`
4. Remove every widget's `onAnimationActive` callback, the `refreshInterval` plumbing, and the `animationActiveCallback` wiring in `main.ts`
5. The `contentDirty` flag can be replaced by `renderLoop.scheduleFrame()` at the points where data changes (fetches, 1-second tick)

### React-Driven Updates

In the declarative model, when React state changes trigger a reconciler update (e.g., clock text changes), the reconciler calls `commitUpdate` which calls `updateTextConfig` which calls `flagForRedraw()`. But `flagForRedraw()` only marks the element — it doesn't schedule a frame. The render loop needs to know something changed.

The reconciler's `resetAfterCommit()` hook (currently a no-op) is the right place:

```ts
resetAfterCommit(container: RootContainer) {
  container.view.getRenderLoop?.()?.scheduleFrame();
}
```

This fires after every React commit, ensuring any React state change triggers a render frame. Clean and automatic.

---

## Summary of Package Changes

### `char-matrix` package
- Make `registerWithView()` idempotent (check `isOnView` before registering) — needed for table cell elements that may be registered by both the reconciler and `setRows()`
- Add `setRenderLoop(controller: RenderLoopController): void` to `RenderTarget` interface (optional method)

### `char-matrix-react-renderer` package
- Add `cm-table-row` and `cm-table-cell` as intrinsic element types (structural markers, not full Elements)
- Specialize `commitChildren` for `TableElement` parents — assemble `TableRowConfig[]` from row/cell marker children and call `setRows()`
- Handle cell marker lifecycle (skip registration, bubble structural changes up to table)
- Add `resetAfterCommit` implementation to schedule a frame after React commits

### `char-matrix-fx` package
- No changes needed — `DefaultAnimationHandler` already calls `getRenderLoop()` correctly
