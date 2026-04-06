// react-reconciler types are used via the `any`-typed hostConfig export.
import {
  ContainerElement,
  TextElement,
  TableElement,
  StructuralElement,
  TableRowElement,
  TableCellElement,
} from "@adam26davidson/char-matrix";
import type {
  RenderTarget,
  Element,
  ElementConfig,
  ContainerElementConfig,
  TextElementConfig,
  TableElementConfig,
  TableRowConfig,
  TableCellConfig,
  TableCellElementConfig,
  Alignment,
  Axis,
  SizingMethod,
  CursorType,
  ColumnDef,
  ElementAnimationHandler,
  PositionMode,
} from "@adam26davidson/char-matrix";

// ---------------------------------------------------------------------------
// Type guards for element instances
// ---------------------------------------------------------------------------

function isContainerElement(instance: Element): instance is ContainerElement {
  return instance instanceof ContainerElement;
}

function isTextElement(instance: Element): instance is TextElement {
  return instance instanceof TextElement;
}

function isTableElement(instance: Element): instance is TableElement {
  return instance instanceof TableElement;
}

function isStructuralElement(instance: Element): instance is StructuralElement {
  return instance instanceof StructuralElement;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CMElementType = "cm-container" | "cm-text" | "cm-table" | "cm-overlay" | "cm-table-row" | "cm-table-cell";

/** Props common to all char-matrix elements (mirrors ElementConfig minus view). */
interface CMBaseProps {
  /** Standard React reconciliation key — stripped from props at runtime. */
  key?: string | number;
  /** React ref — resolves to the underlying Element instance (typed as CMElementRef). */
  ref?: React.Ref<any>;
  /** The char-matrix element key. React's `key` is stripped from props, so use `elementKey`. */
  elementKey: string;
  width?: number;
  widthType?: SizingMethod;
  height?: number;
  heightType?: SizingMethod;
  scrollable?: boolean;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingX?: number;
  paddingY?: number;
  padding?: number;
  bordered?: boolean;
  backgroundChar?: string;
  cursor?: CursorType;
  xOffset?: number;
  yOffset?: number;
  animationHandler?: ElementAnimationHandler;
  entranceTiming?: "parallel" | "series";
  exitTiming?: "parallel" | "series";
  zIndex?: number;
  position?: PositionMode;
  /** When this value changes, the element's entrance animation is re-triggered. */
  animationKey?: string | number;
  onClick?: () => void;
}

export interface CMContainerProps extends CMBaseProps {
  mainAxis: Axis;
  justifyContent?: Alignment;
  alignItems?: Alignment;
  spacing?: number;
  children?: React.ReactNode;
}

export interface CMTextProps extends CMBaseProps {
  text: string;
  hoverTransform?: "none" | "uppercase" | "bold";
}

export interface CMTableProps extends CMBaseProps {
  columns: ColumnDef[];
  title?: string;
  titleAlign?: "start" | "center" | "end";
  showRowSeparators?: boolean;
}

/** Overlay props — same as container, rendered into the overlay layer instead of the element tree. */
export interface CMOverlayProps extends CMContainerProps {}

/** Props for a structural table row element. */
export interface CMTableRowProps {
  key?: string | number;
  ref?: React.Ref<any>;
  elementKey: string;
  children?: React.ReactNode;
}

/** Props for a structural table cell element. */
export interface CMTableCellProps {
  key?: string | number;
  ref?: React.Ref<any>;
  elementKey: string;
  text?: string;
  children?: React.ReactNode;
}

export type CMProps = CMContainerProps | CMTextProps | CMTableProps | CMOverlayProps | CMTableRowProps | CMTableCellProps;

/** The root container object passed to the reconciler. */
export interface RootContainer {
  view: RenderTarget;
  rootElement: Element | null;
  /** Elements tagged as overlays — bypass normal parent-child management. */
  overlayInstances: WeakSet<Element>;
}

// ---------------------------------------------------------------------------
// Overlay tracking
// ---------------------------------------------------------------------------

/** Map from element instance to the RootContainer it was created in. */
const instanceRootMap = new WeakMap<Element, RootContainer>();

function isOverlay(instance: Element): boolean {
  const root = instanceRootMap.get(instance);
  return root?.overlayInstances.has(instance) ?? false;
}

function unmarkOverlay(instance: Element): void {
  const root = instanceRootMap.get(instance);
  root?.overlayInstances.delete(instance);
}

// ---------------------------------------------------------------------------
// Element creation helpers
// ---------------------------------------------------------------------------

/** Extract the shared base config fields from props (everything except key/view). */
function extractBaseFields(props: CMBaseProps): Partial<ElementConfig> {
  return {
    width: props.width,
    widthType: props.widthType,
    height: props.height,
    heightType: props.heightType,
    scrollable: props.scrollable,
    paddingTop: props.paddingTop,
    paddingBottom: props.paddingBottom,
    paddingLeft: props.paddingLeft,
    paddingRight: props.paddingRight,
    paddingX: props.paddingX,
    paddingY: props.paddingY,
    padding: props.padding,
    bordered: props.bordered,
    backgroundChar: props.backgroundChar,
    cursor: props.cursor,
    xOffset: props.xOffset,
    yOffset: props.yOffset,
    animationHandler: props.animationHandler,
    entranceTiming: props.entranceTiming,
    exitTiming: props.exitTiming,
    zIndex: props.zIndex,
    position: props.position,
  };
}

function buildBaseConfig(
  props: CMBaseProps,
  view: RenderTarget
): ElementConfig {
  return { key: props.elementKey, view, ...extractBaseFields(props) };
}

function createElement(
  type: CMElementType,
  props: CMProps,
  view: RenderTarget
): Element {
  const base = buildBaseConfig(props, view);
  let instance: Element;

  switch (type) {
    case "cm-container": {
      const p = props as CMContainerProps;
      instance = new ContainerElement({
        ...base,
        mainAxis: p.mainAxis,
        justifyContent: p.justifyContent,
        alignItems: p.alignItems,
        spacing: p.spacing,
      } as ContainerElementConfig);
      break;
    }
    case "cm-text": {
      const p = props as CMTextProps;
      instance = new TextElement({
        ...base,
        text: p.text,
        hoverTransform: p.hoverTransform,
      } as TextElementConfig);
      break;
    }
    case "cm-table": {
      const p = props as CMTableProps;
      instance = new TableElement({
        ...base,
        columns: p.columns,
        title: p.title,
        titleAlign: p.titleAlign,
        showRowSeparators: p.showRowSeparators,
      } as TableElementConfig);
      break;
    }
    case "cm-overlay": {
      const p = props as CMOverlayProps;
      instance = new ContainerElement({
        ...base,
        mainAxis: p.mainAxis,
        justifyContent: p.justifyContent,
        alignItems: p.alignItems,
        spacing: p.spacing,
      } as ContainerElementConfig);
      break;
    }
    case "cm-table-row": {
      return new TableRowElement({ key: props.elementKey, view });
    }
    case "cm-table-cell": {
      const p = props as CMTableCellProps;
      return new TableCellElement({
        key: p.elementKey,
        view,
        text: p.text,
      } as TableCellElementConfig);
    }
    default:
      throw new Error(`Unknown char-matrix element type: ${type}`);
  }

  // Wire onClick handler (structural types returned early above)
  const baseProps = props as CMBaseProps;
  if (baseProps.onClick) {
    instance.setOnClick(baseProps.onClick);
  }

  // Wire animation handler — DefaultAnimationHandler needs setElement() called
  // after the element is constructed.
  if (baseProps.animationHandler?.setElement) {
    baseProps.animationHandler.setElement(instance);
  }

  return instance;
}

// ---------------------------------------------------------------------------
// Tracked children — we need to maintain an ordered child list per element
// because Element.setChildren() replaces the whole array.
// ---------------------------------------------------------------------------

const childrenMap = new WeakMap<Element, Element[]>();
const parentMap = new WeakMap<Element, Element>();

function getTrackedChildren(parent: Element): Element[] {
  let children = childrenMap.get(parent);
  if (!children) {
    children = [];
    childrenMap.set(parent, children);
  }
  return children;
}

function trackParent(child: Element, parent: Element): void {
  parentMap.set(child, parent);
}

function untrackParent(child: Element): void {
  parentMap.delete(child);
}

// ---------------------------------------------------------------------------
// Child-commit strategy registry
// ---------------------------------------------------------------------------

type ChildCommitStrategy = (parent: Element) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ElementConstructor = new (...args: any[]) => Element;
const commitStrategyRegistry = new Map<ElementConstructor, ChildCommitStrategy>();

export function registerChildCommitStrategy(
  ctor: ElementConstructor,
  strategy: ChildCommitStrategy
): void {
  commitStrategyRegistry.set(ctor, strategy);
}

function bubbleCommitToAncestor(structural: Element): void {
  let current: Element | undefined = parentMap.get(structural);
  while (current && isStructuralElement(current)) {
    current = parentMap.get(current);
  }
  if (current) {
    commitChildren(current);
  }
}

function commitChildren(parent: Element) {
  const strategy = commitStrategyRegistry.get(parent.constructor as ElementConstructor);
  if (strategy) {
    strategy(parent);
  } else if (isStructuralElement(parent)) {
    bubbleCommitToAncestor(parent);
  } else {
    parent.setChildren([...getTrackedChildren(parent)]);
  }
}

// Table child-commit strategy: assemble TableRowConfig[] from structural children
registerChildCommitStrategy(TableElement, (parent: Element) => {
  const table = parent as TableElement;
  const rowElements = getTrackedChildren(parent);
  const rows: TableRowConfig[] = [];

  for (const rowEl of rowElements) {
    if (!(rowEl instanceof TableRowElement)) continue;
    const cellElements = getTrackedChildren(rowEl);
    const cells: (TableCellConfig | Element)[] = [];

    for (const cellEl of cellElements) {
      if (cellEl instanceof TableCellElement) {
        const cellChildren = getTrackedChildren(cellEl);
        if (cellChildren.length > 0) {
          cells.push({ element: cellChildren[0] });
        } else if (cellEl.text !== undefined) {
          cells.push({ text: cellEl.text });
        } else {
          cells.push({ text: "" });
        }
      }
    }

    rows.push({ cells });
  }

  table.setRows(rows);
});

// ---------------------------------------------------------------------------
// HostConfig
// ---------------------------------------------------------------------------

type Type = CMElementType;
type Props = CMProps;
type Instance = Element;
type TextInstance = never;
type PublicInstance = Element;
type HostContext = Record<string, never>;
type NoTimeout = -1;

// The react-reconciler types require many methods that are no-ops for our use case.
// We implement all the ones that matter and cast the rest.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const hostConfig: any = {
  // --------------- Feature flags ---------------
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: true,

  // --------------- Context ---------------
  getRootHostContext(): HostContext {
    return {};
  },
  getChildHostContext(): HostContext {
    return {};
  },

  // --------------- Instance creation ---------------
  createInstance(
    type: Type,
    props: Props,
    rootContainer: RootContainer
  ): Instance {
    const instance = createElement(type, props, rootContainer.view);
    instanceRootMap.set(instance, rootContainer);
    if (type === "cm-overlay") {
      rootContainer.overlayInstances.add(instance);
    }
    return instance;
  },

  createTextInstance(): TextInstance {
    throw new Error(
      "Raw text nodes are not supported. Use <cm-text text=\"...\"> instead."
    );
  },

  // --------------- Children (mutation mode) ---------------
  appendInitialChild(parent: Instance, child: Instance) {
    if (isOverlay(child)) {
      // Overlays are deferred to commitMount — skip normal child tracking.
      return;
    }
    const children = getTrackedChildren(parent);
    children.push(child);
    trackParent(child, parent);
    // Don't commit yet — React calls this during the "complete" phase.
    // finalizeInitialChildren or the commit phase will handle it.
  },

  appendChild(parent: Instance, child: Instance) {
    if (isOverlay(child)) {
      const root = instanceRootMap.get(child);
      if (root?.view.addOverlay) {
        root.view.addOverlay(child);
      }
      return;
    }
    const children = getTrackedChildren(parent);
    children.push(child);
    trackParent(child, parent);
    commitChildren(parent);
  },

  appendChildToContainer(container: RootContainer, child: Instance) {
    if (isOverlay(child)) {
      if (container.view.addOverlay) {
        container.view.addOverlay(child);
      }
      return;
    }
    container.rootElement = child;
    // Use setRoot if available (MatrixView implements this) for full integration
    // with the render loop. Falls back to registerWithView for basic targets.
    if ((container.view as any).setRoot) {
      (container.view as any).setRoot(child);
    } else {
      child.registerWithView();
    }
  },

  insertBefore(parent: Instance, child: Instance, beforeChild: Instance) {
    if (isOverlay(child)) {
      const root = instanceRootMap.get(child);
      if (root?.view.addOverlay) {
        root.view.addOverlay(child);
      }
      return;
    }
    const children = getTrackedChildren(parent);
    const idx = children.indexOf(beforeChild);
    if (idx >= 0) {
      children.splice(idx, 0, child);
    } else {
      children.push(child);
    }
    trackParent(child, parent);
    commitChildren(parent);
  },

  insertInContainerBefore(
    container: RootContainer,
    child: Instance,
    _beforeChild: Instance
  ) {
    if (isOverlay(child)) {
      if (container.view.addOverlay) {
        container.view.addOverlay(child);
      }
      return;
    }
    container.rootElement = child;
    if ((container.view as any).setRoot) {
      (container.view as any).setRoot(child);
    } else {
      child.registerWithView();
    }
  },

  removeChild(parent: Instance, child: Instance) {
    if (isOverlay(child)) {
      const root = instanceRootMap.get(child);
      if (root?.view.removeOverlay) {
        root.view.removeOverlay(child);
      }
      unmarkOverlay(child);
      return;
    }
    const children = getTrackedChildren(parent);
    const idx = children.indexOf(child);
    if (idx >= 0) {
      children.splice(idx, 1);
    }
    untrackParent(child);
    child.unregisterWithView();
    commitChildren(parent);
  },

  removeChildFromContainer(container: RootContainer, child: Instance) {
    if (isOverlay(child)) {
      if (container.view.removeOverlay) {
        container.view.removeOverlay(child);
      }
      unmarkOverlay(child);
      return;
    }
    child.unregisterWithView();
    if (container.rootElement === child) {
      container.rootElement = null;
    }
  },

  clearContainer(container: RootContainer) {
    if (container.rootElement) {
      container.rootElement.unregisterWithView();
      container.rootElement = null;
    }
  },

  // --------------- Updates ---------------
  prepareUpdate(
    _instance: Instance,
    _type: Type,
    oldProps: Props,
    newProps: Props,
  ): object | null {
    // Return a truthy payload if any prop (other than children) changed.
    const skipKeys = new Set(["children", "key", "ref", "elementKey"]);
    const oKeys = Object.keys(oldProps).filter((k) => !skipKeys.has(k));
    const nKeys = Object.keys(newProps).filter((k) => !skipKeys.has(k));
    if (oKeys.length !== nKeys.length) return { changed: true };
    for (const k of oKeys) {
      if ((oldProps as any)[k] !== (newProps as any)[k]) return { changed: true };
    }
    return null;
  },

  commitUpdate(
    instance: Instance,
    _updatePayload: object,
    type: Type,
    _oldProps: Props,
    newProps: Props,
  ) {
    // Structural elements have minimal props — handle them separately.
    if (type === "cm-table-cell") {
      const p = newProps as CMTableCellProps;
      if (instance instanceof TableCellElement) {
        instance.text = p.text;
      }
      bubbleCommitToAncestor(instance);
      return;
    }
    if (type === "cm-table-row") {
      return;
    }

    const base = extractBaseFields(newProps);

    // Delegate to the element-type-specific batch update method.
    switch (type) {
      case "cm-container":
      case "cm-overlay": {
        const p = newProps as CMContainerProps;
        if (isContainerElement(instance)) {
          instance.updateContainerConfig({
            ...base,
            mainAxis: p.mainAxis,
            justifyContent: p.justifyContent,
            alignItems: p.alignItems,
            spacing: p.spacing,
          });
        }
        break;
      }
      case "cm-text": {
        const p = newProps as CMTextProps;
        if (isTextElement(instance)) {
          instance.updateTextConfig({
            ...base,
            text: p.text,
            hoverTransform: p.hoverTransform,
          });
        }
        break;
      }
      case "cm-table": {
        const p = newProps as CMTableProps;
        if (isTableElement(instance)) {
          instance.updateTableConfig({
            ...base,
            columns: p.columns,
            title: p.title,
            titleAlign: p.titleAlign,
            showRowSeparators: p.showRowSeparators,
          });
        }
        break;
      }
    }

    // The remaining code only applies to non-structural element types
    // (which all extend CMBaseProps). Structural types returned early above.
    const oldBase = _oldProps as CMBaseProps;
    const newBase = newProps as CMBaseProps;

    // Update or clear onClick handler
    if (oldBase.onClick !== newBase.onClick) {
      instance.setOnClick(newBase.onClick ?? null);
    }

    // Re-trigger entrance animation when animationKey changes
    if (
      oldBase.animationKey !== newBase.animationKey &&
      newBase.animationKey != null
    ) {
      if (instance.getStage() === "main") {
        instance.startTransition("enter");
      }
    }
  },

  // --------------- Finalize ---------------
  finalizeInitialChildren(): boolean {
    return true;
  },

  commitMount(instance: Instance) {
    // Called after finalizeInitialChildren returns true.

    // Structural elements (table rows/cells) are handled by their
    // parent's child-commit strategy — skip normal child commitment.
    if (isStructuralElement(instance)) return;

    // If this is an overlay, add it to the view's overlay layer now.
    if (isOverlay(instance)) {
      const root = instanceRootMap.get(instance);
      if (root?.view.addOverlay) {
        // First commit its own tracked children (it's a container)
        const children = getTrackedChildren(instance);
        if (children.length > 0) {
          instance.setChildren([...children]);
        }
        root.view.addOverlay(instance);
      }
      return;
    }

    // Commit the tracked children now that the initial tree is assembled.
    const children = getTrackedChildren(instance);
    if (children.length > 0) {
      commitChildren(instance);
    }
  },

  // --------------- Misc required methods ---------------
  prepareForCommit(): Record<string, unknown> | null {
    return null;
  },

  resetAfterCommit(container: RootContainer) {
    container.view.getRenderLoop?.()?.scheduleFrame();
  },

  shouldSetTextContent(): boolean {
    return false;
  },

  getPublicInstance(instance: Instance): PublicInstance {
    return instance;
  },

  preparePortalMount() {},

  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1 as NoTimeout,

  getCurrentUpdatePriority() {
    return 0b0000000000000000000000000010000; // DefaultEventPriority
  },

  getInstanceFromNode() {
    return null;
  },

  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},

  prepareScopeUpdate() {},
  getInstanceFromScope() {
    return null;
  },

  detachDeletedInstance() {},
};
