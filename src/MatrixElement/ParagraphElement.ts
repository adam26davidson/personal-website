import { SPACE_CHAR, TextElement } from "@adam26davidson/char-matrix";
import type { RenderTarget } from "@adam26davidson/char-matrix";

export class ParagraphElement extends TextElement {
  constructor(
    key: string,
    text: string,
    relativeWidth: number,
    view: RenderTarget
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
