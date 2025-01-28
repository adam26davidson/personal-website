import { DOT_CHAR } from "../constants";
import { ContainerElement } from "../MatrixElement/ContainerElement";
import { LinkElement } from "../MatrixElement/LinkElement";
import { Element } from "../MatrixElement/Element";
import { Page, LINKS } from "./Page";
import { X, Y } from "../UtilityTypes/Axes";
import {
  MediumTitleElement,
  SmallTitleElement,
} from "../MatrixElement/TitleElement";
import { PageKey } from "../matrixController";

export abstract class ContentPage extends Page {
  protected mainContainer: ContainerElement | null = null;
  protected contentElement: Element | null = null;
  protected contentContainer: ContainerElement | null = null;
  protected pageKey: PageKey = "about";

  public enterPage(fromTitle: boolean): void {
    if (fromTitle) {
      if (this.view.getIsMobile()) {
        console.log("creating title mobile");
        this.createTitleMobile();
      } else {
        this.createTitleAndLinks();
      }
    }
    this.contentElement = this.getContent();
    const contentContainer = this.view.getElement("contentContainer");
    if (!contentContainer) {
      console.error("contentContainer not found");
    }
    contentContainer?.setChildren([this.contentElement]);

    if (fromTitle) {
      this.mainContainer?.startTransition("enter");
    } else {
      this.contentElement.startTransition("enter");
    }
  }

  public exitPage(onExit: () => void, toTitle?: boolean): void {
    if (toTitle) {
      this.view.getElement("mainContainer")?.startTransition("exit", onExit);
    } else {
      this.contentElement?.startTransition("exit", onExit);
    }
  }

  protected abstract getContent(): Element;

  private createTitleMobile(): void {
    const titleElement = new SmallTitleElement(this.view);

    titleElement.setOnClick(() => {
      this.setPage("title");
    });

    const navButton = new LinkElement("navButton", "☰\u200B", this.view);

    navButton.setOnClick(() => {
      this.setPage("mobileNav");
    });

    const headerContainer = new ContainerElement({
      key: "headerContainer",
      view: this.view,
      mainAxis: X,
      width: 1,
      spacing: 2,
      widthType: "relative",
      backgroundChar: DOT_CHAR,
      justifyContent: "start",
      alignItems: "start",
    });

    headerContainer.setChildren([navButton, titleElement]);

    const contentContainer = new ContainerElement({
      key: "contentContainer",
      view: this.view,
      mainAxis: X,
      backgroundChar: DOT_CHAR,
      spacing: 1,
      width: 1,
      widthType: "relative",
      heightType: "expand",
      paddingTop: 1,
      entranceTiming: "parallel",
      exitTiming: "parallel",
      justifyContent: "center",
      alignItems: "start",
    });
    this.contentContainer = contentContainer;

    const mainContainer = new ContainerElement({
      key: "mainContainer",
      view: this.view,
      mainAxis: Y,
      width: 1,
      height: 1,
      paddingLeft: 2,
      paddingRight: 1,
      paddingY: 1,
      widthType: "relative",
      heightType: "relative",
      backgroundChar: DOT_CHAR,
      justifyContent: "start",
      alignItems: "start",
    });
    this.mainContainer = mainContainer;

    mainContainer.setChildren([headerContainer, contentContainer]);
    this.view.setRoot(mainContainer);
  }

  private createTitleAndLinks(): void {
    //const titleElement = new SmallTitleElement(this.view);

    const titleElement = new MediumTitleElement(this.view);

    const linkElements = LINKS.map((link) => {
      return new LinkElement(link.key, link.title, this.view);
    });

    // set OnClick behavior
    linkElements.forEach((linkElement, i) => {
      linkElement.setOnClick(() => {
        this.setPage(LINKS[i].key);
      });
    });

    titleElement.setOnClick(() => {
      this.setPage("title");
    });

    const linkContainer = new ContainerElement({
      key: "linkContainer",
      view: this.view,
      mainAxis: Y,
      spacing: 1,
      backgroundChar: DOT_CHAR,
      entranceTiming: "series",
      exitTiming: "series",
    });

    linkContainer.setChildren(linkElements);

    const sideContainer = new ContainerElement({
      key: "sideContainer",
      view: this.view,
      mainAxis: Y,
      backgroundChar: DOT_CHAR,
      spacing: 1,
      paddingX: 2,
      paddingY: 1,
      entranceTiming: "parallel",
      exitTiming: "parallel",
    });

    sideContainer.setChildren([titleElement, linkContainer]);

    const contentContainer = new ContainerElement({
      key: "contentContainer",
      view: this.view,
      mainAxis: X,
      backgroundChar: DOT_CHAR,
      spacing: 1,
      widthType: "expand",
      height: 1,
      heightType: "relative",
      paddingY: 2,
      entranceTiming: "parallel",
      exitTiming: "parallel",
      justifyContent: "center",
      alignItems: "start",
    });
    this.contentContainer = contentContainer;

    const mainContainer = new ContainerElement({
      key: "mainContainer",
      view: this.view,
      mainAxis: X,
      width: 1,
      height: 1,
      widthType: "relative",
      heightType: "relative",
      backgroundChar: DOT_CHAR,
      justifyContent: "start",
      alignItems: "start",
    });
    this.mainContainer = mainContainer;

    mainContainer.setChildren([sideContainer, contentContainer]);

    this.view.setRoot(mainContainer);
  }
}
