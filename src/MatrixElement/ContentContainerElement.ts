import { DOT_CHAR } from "../constants";
import MatrixView from "../matrixView";
import { ContainerElement } from "./ContainerElement";
import { Y } from "../UtilityTypes/Axes";

export class ContentContainerElement extends ContainerElement {
  constructor(key: string, view: MatrixView) {
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
      backgroundChar: DOT_CHAR,
      entranceAnimationConfig: {
        type: "diagonalSwipe",
        config: {
          slant: 2,
          tailLength: view.getIsMobile() ? 20 : 40,
          headSpeed: 3,
          randomizationRange: 5,
          use: "entrance",
        },
      },
      exitAnimationConfig: {
        type: "diagonalSwipe",
        config: {
          slant: 2,
          tailLength: view.getIsMobile() ? 20 : 40,
          headSpeed: 3,
          randomizationRange: 5,
          use: "exit",
        },
      },
    });
  }
}
