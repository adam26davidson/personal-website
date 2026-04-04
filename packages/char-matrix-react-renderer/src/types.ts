import type { CMContainerProps, CMTextProps, CMTableProps } from "./hostConfig";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "cm-container": CMContainerProps;
      "cm-text": CMTextProps;
      "cm-table": CMTableProps;
    }
  }
}
