import type { RenderTarget } from "char-matrix";
import type { ReactNodeConfig } from "./ReactNodeConfig";

/**
 * Extended render target for views that support embedding React components.
 */
export interface ReactRenderTarget extends RenderTarget {
  updateReactNodeConfig(key: string, config: ReactNodeConfig): void;
  removeReactNodeConfig(key: string): void;
}
