export { render, unmount } from "./renderer";
export type {
  CMContainerProps,
  CMTextProps,
  CMTableProps,
  CMElementType,
} from "./hostConfig";

// Side-effect: register JSX intrinsic element types
import "./types";
