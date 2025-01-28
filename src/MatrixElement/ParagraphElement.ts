import { SPACE_CHAR } from "../constants";
import TextElement from "./TextElement";
import MatrixView from "../matrixView";

export class ParagraphElement extends TextElement {
  constructor(
    key: string,
    text: string,
    relativeWidth: number,
    view: MatrixView
  ) {
    super({
      key,
      view,
      text: text,
      width: relativeWidth,
      paddingX: view.getIsMobile() ? 1 : 2,
      paddingY: view.getIsMobile() ? 0 : 1,
      widthType: "relative",
      heightType: "content",
      bordered: true,
      hoverTransform: "none",
      cursor: "text",
      backgroundChar: SPACE_CHAR,
    });
  }
}
