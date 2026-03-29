import { SPACE_CHAR, TextElement } from "char-matrix";
import type { RenderTarget } from "char-matrix";
import { DefaultAnimationHandler } from "char-matrix-fx";

const largeTitleText =
  "  __   ____   __   _  _    ____   __   _  _  __  ____  ____   __   __ _  \n" +
  " / _\\ (    \\ / _\\ ( \\/ )  (    \\ / _\\ / )( \\(  )(    \\/ ___) /  \\ (  ( \\ \n" +
  "/    \\ ) D (/    \\/ \\/ \\   ) D (/    \\\\ \\/ / )(  ) D (\\___ \\(  O )/    / \n" +
  "\\_/\\_/(____/\\_/\\_/\\_)(_/  (____/\\_/\\_/ \\__/ (__)(____/(____/ \\__/ \\_)__) \n";

const smallTitleText = "Adam Davidson";

const mediumTitleText =
  "🬖🬏🬚🬏🬖🬏🬚🬖🬓\n" + "🬆🬄🬌🬀🬆🬄🬄 🬄\n" + "🬚🬏🬖🬏🬓🬓🬩🬃🬚🬏🬖🬃🬚🬓🬱🬦\n" + "🬌🬀🬆🬄🬈🬀🬍🬃🬌🬀🬍🬀🬌🬄🬄🬊";

export class LargeTitleElement extends TextElement {
  constructor(view: RenderTarget) {
    const handler = new DefaultAnimationHandler(null, view, {
      entrance: {
        type: "rowTracer",
        config: {
          tailLength: 40,
          headSpeed: 5,
          randomizationRange: 5,
          use: "entrance",
        },
      },
      exit: {
        type: "diagonalSwipe",
        config: {
          tailLength: 30,
          headSpeed: 3,
          randomizationRange: 5,
          use: "exit",
          slant: 4,
        },
      },
    });
    super({
      key: "largeTitle",
      view,
      text: largeTitleText,
      bordered: true,
      backgroundChar: SPACE_CHAR,
      paddingX: 1,
      animationHandler: handler,
    });
    handler.setElement(this);
  }
}

export class MediumTitleElement extends TextElement {
  constructor(view: RenderTarget) {
    const handler = new DefaultAnimationHandler(null, view, {
      entrance: {
        type: "rowTracer",
        config: {
          tailLength: 20,
          headSpeed: 2,
          randomizationRange: 5,
          use: "entrance",
        },
      },
      exit: {
        type: "diagonalSwipe",
        config: {
          tailLength: 20,
          headSpeed: 3,
          randomizationRange: 5,
          use: "exit",
          slant: 4,
        },
      },
    });
    super({
      key: "mediumTitle",
      view,
      text: mediumTitleText,
      bordered: true,
      paddingX: 1,
      backgroundChar: SPACE_CHAR,
      cursor: "pointer",
      animationHandler: handler,
    });
    handler.setElement(this);
  }
}

export class SmallTitleElement extends TextElement {
  constructor(view: RenderTarget) {
    const handler = new DefaultAnimationHandler(null, view, {
      entrance: {
        type: "rowTracer",
        config: {
          tailLength: 10,
          headSpeed: 1,
          randomizationRange: 5,
          use: "entrance",
        },
      },
      exit: {
        type: "diagonalSwipe",
        config: {
          tailLength: 10,
          headSpeed: 1,
          randomizationRange: 5,
          use: "exit",
          slant: 4,
        },
      },
    });
    super({
      key: "smallTitle",
      view,
      text: smallTitleText,
      bordered: true,
      paddingX: 1,
      backgroundChar: SPACE_CHAR,
      cursor: "pointer",
      animationHandler: handler,
    });
    handler.setElement(this);
  }
}
