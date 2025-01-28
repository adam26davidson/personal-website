import { ContainerElement } from "../MatrixElement/ContainerElement";
import { Element } from "../MatrixElement/Element";
import { LinkElement } from "../MatrixElement/LinkElement";
import {
  LargeTitleElement,
  MediumTitleElement,
} from "../MatrixElement/TitleElement";
import { X, Y } from "../UtilityTypes/Axes";
import { LINKS, Page } from "./Page";

const DOT_CHAR = "\u00b7";

export class TitlePage extends Page {
  public enterPage(): void {
    const isMobile = this.view.getIsMobile();
    // create Elements
    let titleElement: Element;
    if (this.view.getIsMobile()) {
      titleElement = new MediumTitleElement(this.view);
    } else {
      titleElement = new LargeTitleElement(this.view);
    }

    const linkElements = LINKS.map((link) => {
      return new LinkElement(link.key, link.title, this.view);
    });

    // Link Container ---------------------------------------------------------

    const titleWidth = titleElement.getSize().getX();
    console.log("titleWidth", titleWidth);

    const linkContainer = new ContainerElement({
      key: "linkContainer",
      view: this.view,
      mainAxis: isMobile ? Y : X,
      spacing: isMobile ? 1 : 3,
      width: titleWidth,
      alignItems: "center",
      justifyContent: "center",
      backgroundChar: DOT_CHAR,
      entranceTiming: "series",
      exitTiming: isMobile ? "parallel" : "series",
    });

    linkContainer.setChildren(linkElements);

    // Title + Links Container ------------------------------------------------

    const contentContainer = new ContainerElement({
      key: "contentContainer",
      view: this.view,
      mainAxis: Y,
      backgroundChar: DOT_CHAR,
      spacing: 1,
      entranceTiming: "series",
      exitTiming: "parallel",
    });

    contentContainer.setChildren([titleElement, linkContainer]);

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
