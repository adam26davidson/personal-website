import { ContainerElement } from "../MatrixElement/ContainerElement";
import { LinkElement } from "../MatrixElement/LinkElement";
import { X, Y } from "../UtilityTypes/Axes";
import { LINKS, Page } from "./Page";

const DOT_CHAR = "\u00b7";

export class MobileNavPage extends Page {
  public enterPage(): void {
    // create Elements

    const linkElements = LINKS.map((link) => {
      return new LinkElement(link.key, link.title, this.view);
    });

    // Link Container ---------------------------------------------------------

    const linkContainer = new ContainerElement({
      key: "linkContainer",
      view: this.view,
      mainAxis: Y,
      spacing: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundChar: DOT_CHAR,
      entranceTiming: "parallel",
      exitTiming: "parallel",
    });

    linkContainer.setChildren(linkElements);

    const contentContainer = new ContainerElement({
      key: "contentContainer",
      view: this.view,
      mainAxis: Y,
      backgroundChar: DOT_CHAR,
      spacing: 1,
      entranceTiming: "series",
      exitTiming: "parallel",
    });

    contentContainer.setChildren([linkContainer]);

    // Container for whole page ------------------------------------------------

    const mainContainer = new ContainerElement({
      key: "mainContainer",
      view: this.view,
      widthType: "relative",
      heightType: "relative",
      width: 1,
      height: 1,
      mainAxis: X,
      alignItems: "center",
      justifyContent: "center",
      backgroundChar: DOT_CHAR,
    });

    mainContainer.setChildren([contentContainer]);

    // set OnClick behavior
    linkElements.forEach((linkElement, i) => {
      linkElement.setOnClick(() => {
        this.setPage(LINKS[i].key);
      });
    });

    // add Elements to view
    this.view.setRoot(mainContainer);

    mainContainer.startTransition("enter");
  }

  public exitPage(onExit: () => void): void {
    const root = this.view.getRoot();
    if (root) {
      root.startTransition("exit", onExit);
    }
  }
}
