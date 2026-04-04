// react-reconciler types are used via the `any`-typed hostConfig export.
import {
  ContainerElement,
  TextElement,
  TableElement,
} from "@adam26davidson/char-matrix";
import type {
  RenderTarget,
  Element,
  ElementConfig,
  ContainerElementConfig,
  TextElementConfig,
  TableElementConfig,
  Alignment,
  Axis,
  SizingMethod,
  CursorType,
  ColumnDef,
  ElementAnimationHandler,
  PositionMode,
} from "@adam26davidson/char-matrix";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CMElementType = "cm-container" | "cm-text" | "cm-table" | "cm-overlay";

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

export type CMProps = CMContainerProps | CMTextProps | CMTableProps | CMOverlayProps;

/** The root container object passed to the reconciler. */
export interface RootContainer {
  view: RenderTarget;
  rootElement: Element | null;
}

// ---------------------------------------------------------------------------
// Overlay tracking
// ---------------------------------------------------------------------------

/** Elements tagged as overlays — bypass normal parent-child management. */
const overlayInstances = new WeakSet<Element>();

/** Map from element instance to the RootContainer it was created in. */
const instanceRootMap = new WeakMap<Element, RootContainer>();

// ---------------------------------------------------------------------------
// Element creation helpers
// ---------------------------------------------------------------------------

function buildBaseConfig(
  props: CMBaseProps,
  view: RenderTarget
): ElementConfig {
  return {
    key: props.elementKey,
    view,
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
      overlayInstances.add(instance);
      break;
    }
    default:
      throw new Error(`Unknown char-matrix element type: ${type}`);
  }

  // Wire onClick handler
  if (props.onClick) {
    instance.setOnClick(props.onClick);
  }

  // Wire animation handler — DefaultAnimationHandler needs setElement() called
  // after the element is constructed. Duck-type check since setElement is not
  // on the ElementAnimationHandler interface.
  const handler = props.animationHandler as any;
  if (handler?.setElement) {
    handler.setElement(instance);
  }

  return instance;
}

// ---------------------------------------------------------------------------
// Tracked children — we need to maintain an ordered child list per element
// because Element.setChildren() replaces the whole array.
// ---------------------------------------------------------------------------

const childrenMap = new WeakMap<Element, Element[]>();

function getTrackedChildren(parent: Element): Element[] {
  let children = childrenMap.get(parent);
  if (!children) {
    children = [];
    childrenMap.set(parent, children);
  }
  return children;
}

function commitChildren(parent: Element) {
  const children = getTrackedChildren(parent);
  parent.setChildren([...children]);
}

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
    return instance;
  },

  createTextInstance(): TextInstance {
    throw new Error(
      "Raw text nodes are not supported. Use <cm-text text=\"...\"> instead."
    );
  },

  // --------------- Children (mutation mode) ---------------
  appendInitialChild(parent: Instance, child: Instance) {
    if (overlayInstances.has(child)) {
      // Overlays are deferred to commitMount — skip normal child tracking.
      return;
    }
    const children = getTrackedChildren(parent);
    children.push(child);
    // Don't commit yet — React calls this during the "complete" phase.
    // finalizeInitialChildren or the commit phase will handle it.
  },

  appendChild(parent: Instance, child: Instance) {
    if (overlayInstances.has(child)) {
      const root = instanceRootMap.get(child);
      if (root?.view.addOverlay) {
        root.view.addOverlay(child);
      }
      return;
    }
    const children = getTrackedChildren(parent);
    children.push(child);
    commitChildren(parent);
  },

  appendChildToContainer(container: RootContainer, child: Instance) {
    if (overlayInstances.has(child)) {
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
    if (overlayInstances.has(child)) {
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
    commitChildren(parent);
  },

  insertInContainerBefore(
    container: RootContainer,
    child: Instance,
    _beforeChild: Instance
  ) {
    if (overlayInstances.has(child)) {
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
    if (overlayInstances.has(child)) {
      const root = instanceRootMap.get(child);
      if (root?.view.removeOverlay) {
        root.view.removeOverlay(child);
      }
      overlayInstances.delete(child);
      return;
    }
    const children = getTrackedChildren(parent);
    const idx = children.indexOf(child);
    if (idx >= 0) {
      children.splice(idx, 1);
    }
    child.unregisterWithView();
    commitChildren(parent);
  },

  removeChildFromContainer(container: RootContainer, child: Instance) {
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
    const skipKeys = new Set(["children", "key", "elementKey"]);
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
    // Build a partial config from the new props and delegate to the
    // element-type-specific batch update method.
    switch (type) {
      case "cm-container": {
        const p = newProps as CMContainerProps;
        (instance as any).updateContainerConfig({
          width: p.width,
          widthType: p.widthType,
          height: p.height,
          heightType: p.heightType,
          scrollable: p.scrollable,
          paddingTop: p.paddingTop,
          paddingBottom: p.paddingBottom,
          paddingLeft: p.paddingLeft,
          paddingRight: p.paddingRight,
          paddingX: p.paddingX,
          paddingY: p.paddingY,
          padding: p.padding,
          bordered: p.bordered,
          backgroundChar: p.backgroundChar,
          cursor: p.cursor,
          xOffset: p.xOffset,
          yOffset: p.yOffset,
          animationHandler: p.animationHandler,
          entranceTiming: p.entranceTiming,
          exitTiming: p.exitTiming,
          zIndex: p.zIndex,
          position: p.position,
          mainAxis: p.mainAxis,
          justifyContent: p.justifyContent,
          alignItems: p.alignItems,
          spacing: p.spacing,
        });
        break;
      }
      case "cm-text": {
        const p = newProps as CMTextProps;
        (instance as any).updateTextConfig({
          width: p.width,
          widthType: p.widthType,
          height: p.height,
          heightType: p.heightType,
          scrollable: p.scrollable,
          paddingTop: p.paddingTop,
          paddingBottom: p.paddingBottom,
          paddingLeft: p.paddingLeft,
          paddingRight: p.paddingRight,
          paddingX: p.paddingX,
          paddingY: p.paddingY,
          padding: p.padding,
          bordered: p.bordered,
          backgroundChar: p.backgroundChar,
          cursor: p.cursor,
          xOffset: p.xOffset,
          yOffset: p.yOffset,
          animationHandler: p.animationHandler,
          entranceTiming: p.entranceTiming,
          exitTiming: p.exitTiming,
          zIndex: p.zIndex,
          position: p.position,
          text: p.text,
          hoverTransform: p.hoverTransform,
        });
        break;
      }
      case "cm-table": {
        const p = newProps as CMTableProps;
        (instance as any).updateTableConfig({
          width: p.width,
          widthType: p.widthType,
          height: p.height,
          heightType: p.heightType,
          scrollable: p.scrollable,
          paddingTop: p.paddingTop,
          paddingBottom: p.paddingBottom,
          paddingLeft: p.paddingLeft,
          paddingRight: p.paddingRight,
          paddingX: p.paddingX,
          paddingY: p.paddingY,
          padding: p.padding,
          bordered: p.bordered,
          backgroundChar: p.backgroundChar,
          cursor: p.cursor,
          xOffset: p.xOffset,
          yOffset: p.yOffset,
          animationHandler: p.animationHandler,
          entranceTiming: p.entranceTiming,
          exitTiming: p.exitTiming,
          zIndex: p.zIndex,
          position: p.position,
          columns: p.columns,
          title: p.title,
          titleAlign: p.titleAlign,
          showRowSeparators: p.showRowSeparators,
        });
        break;
      }
      case "cm-overlay": {
        const p = newProps as CMOverlayProps;
        (instance as any).updateContainerConfig({
          width: p.width,
          widthType: p.widthType,
          height: p.height,
          heightType: p.heightType,
          scrollable: p.scrollable,
          paddingTop: p.paddingTop,
          paddingBottom: p.paddingBottom,
          paddingLeft: p.paddingLeft,
          paddingRight: p.paddingRight,
          paddingX: p.paddingX,
          paddingY: p.paddingY,
          padding: p.padding,
          bordered: p.bordered,
          backgroundChar: p.backgroundChar,
          cursor: p.cursor,
          xOffset: p.xOffset,
          yOffset: p.yOffset,
          animationHandler: p.animationHandler,
          entranceTiming: p.entranceTiming,
          exitTiming: p.exitTiming,
          zIndex: p.zIndex,
          position: p.position,
          mainAxis: p.mainAxis,
          justifyContent: p.justifyContent,
          alignItems: p.alignItems,
          spacing: p.spacing,
        });
        break;
      }
    }

    // Update onClick handler
    if (newProps.onClick) {
      instance.setOnClick(newProps.onClick);
    }

    // Re-trigger entrance animation when animationKey changes
    if (
      _oldProps.animationKey !== newProps.animationKey &&
      newProps.animationKey != null
    ) {
      if ((instance as any).getStage() === "main") {
        (instance as any).startTransition("enter");
      }
    }
  },

  // --------------- Finalize ---------------
  finalizeInitialChildren(): boolean {
    return true;
  },

  commitMount(instance: Instance) {
    // Called after finalizeInitialChildren returns true.

    // If this is an overlay, add it to the view's overlay layer now.
    if (overlayInstances.has(instance)) {
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
      instance.setChildren([...children]);
    }
  },

  // --------------- Misc required methods ---------------
  prepareForCommit(): Record<string, unknown> | null {
    return null;
  },

  resetAfterCommit() {},

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
