import { DOT_CHAR } from "../constants";
import TextElement from "./TextElement";
import MatrixView from "../matrixView";

const MIN_WIDTH = 20;

const addUnderline = (text: string) => {
  return (
    DOT_CHAR +
    text +
    DOT_CHAR +
    "\n" +
    "─".repeat(Math.max(MIN_WIDTH, text.length + 2))
  );
};

export class HeaderElement extends TextElement {
  constructor(key: string, text: string, view: MatrixView) {
    super({
      key,
      view,
      text: addUnderline(text),
      bordered: false,
      hoverTransform: "none",
      backgroundChar: DOT_CHAR,
    });
  }
}
