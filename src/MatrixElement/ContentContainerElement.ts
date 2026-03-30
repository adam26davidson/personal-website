import { DOT_CHAR, Y, ContainerElement } from "@adam26davidson/char-matrix";
import type { RenderTarget } from "@adam26davidson/char-matrix";
import { DefaultAnimationHandler } from "@adam26davidson/char-matrix-fx";

export class ContentContainerElement extends ContainerElement {
  constructor(key: string, view: RenderTarget, noYPadding?: boolean) {
    const handler = new DefaultAnimationHandler(null, view, {
      entrance: {
        type: "diagonalSwipe",
        config: {
          slant: 2,
          tailLength: view.getIsMobile() ? 20 : 40,
          headSpeed: view.getIsMobile() ? 3 : 5,
          randomizationRange: 5,
          use: "entrance",
        },
      },
      exit: {
        type: "diagonalSwipe",
        config: {
          slant: 2,
          tailLength: view.getIsMobile() ? 20 : 40,
          headSpeed: view.getIsMobile() ? 3 : 5,
          randomizationRange: 5,
          use: "exit",
        },
      },
    });

    super({
      key,
      view,
      mainAxis: Y,
      width: view.getIsMobile() ? 1 : 0.8,
      paddingRight: 1,
      widthType: "relative",
      height: 1,
      heightType: "relative",
      bordered: false,
      scrollable: true,
      spacing: 1,
      paddingY: noYPadding ? 0 : 1,
      backgroundChar: DOT_CHAR,
      animationHandler: handler,
    });

    handler.setElement(this);
  }
}
