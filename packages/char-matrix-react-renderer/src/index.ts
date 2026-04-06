export { render, unmount } from "./renderer";
export type {
  CMContainerProps,
  CMTextProps,
  CMTableProps,
  CMOverlayProps,
  CMTableRowProps,
  CMTableCellProps,
  CMElementType,
} from "./hostConfig";
export { registerChildCommitStrategy } from "./hostConfig";
export type { CMElementRef } from "./types";
export {
  RenderLoopContext,
  useRenderLoop,
  useAnimation,
  usePolledData,
} from "./hooks";

// Side-effect: register JSX intrinsic element types
import "./types";
