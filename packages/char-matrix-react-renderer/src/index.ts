export { render, unmount } from "./renderer";
export type {
  CMContainerProps,
  CMTextProps,
  CMTableProps,
  CMOverlayProps,
  CMElementType,
} from "./hostConfig";
export type { CMElementRef } from "./types";
export {
  RenderLoopContext,
  useRenderLoop,
  useAnimation,
  usePolledData,
} from "./hooks";

// Side-effect: register JSX intrinsic element types
import "./types";
