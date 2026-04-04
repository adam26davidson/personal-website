import ReactReconciler from "react-reconciler";
import type { ReactNode } from "react";
import type { RenderTarget, Element } from "@adam26davidson/char-matrix";
import { hostConfig, RootContainer } from "./hostConfig";

const reconciler = ReactReconciler(hostConfig);

// Map from RenderTarget → fiber root, so we can re-render and unmount.
const roots = new Map<
  RenderTarget,
  { fiberRoot: ReactReconciler.FiberRoot; container: RootContainer }
>();

/**
 * Render a React element tree into char-matrix elements attached to the given
 * RenderTarget (view).
 *
 * Returns the root char-matrix Element once the initial render is committed.
 */
export function render(element: ReactNode, view: RenderTarget): Element {
  let entry = roots.get(view);

  if (!entry) {
    const container: RootContainer = { view, rootElement: null };
    const fiberRoot = reconciler.createContainer(
      container,
      0, // LegacyRoot tag
      null, // hydrationCallbacks
      false, // isStrictMode
      null, // concurrentUpdatesByDefaultOverride
      "", // identifierPrefix
      (err: Error) => console.error(err), // onUncaughtError
      (err: Error) => console.error(err), // onCaughtError
      (err: Error) => console.error(err), // onRecoverableError
      () => {}, // onDefaultTransitionIndicator
    );
    entry = { fiberRoot, container };
    roots.set(view, entry);
  }

  reconciler.updateContainer(element, entry.fiberRoot, null, () => {});

  // Flush synchronous work so the tree is committed immediately.
  reconciler.flushSync();

  return entry.container.rootElement!;
}

/**
 * Unmount a previously rendered tree, unregistering all elements from the view.
 */
export function unmount(view: RenderTarget): void {
  const entry = roots.get(view);
  if (entry) {
    reconciler.updateContainer(null, entry.fiberRoot, null, () => {});
    reconciler.flushSync();
    roots.delete(view);
  }
}
