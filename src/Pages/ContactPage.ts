import { ContentPage } from "./ContentPage";
import { Element, HeaderElement } from "char-matrix";
import { ContentContainerElement } from "../MatrixElement/ContentContainerElement";
import { LinkElement } from "../MatrixElement/LinkElement";

export class ContactPage extends ContentPage {
  protected getContent(): Element {
    const headerElement = new HeaderElement(
      "contactHeader",
      "Contact",
      this.view
    );

    const gitHubLink = new LinkElement(
      "githubLink",
      "GitHub ->",
      this.view,
      false
    );

    gitHubLink.setOnClick(() => {
      window.location.href = "https://github.com/adam26davidson";
    });

    const linkedInLink = new LinkElement(
      "linkedInLink",
      "LinkedIn ->",
      this.view,
      false
    );

    linkedInLink.setOnClick(() => {
      window.location.href =
        "https://www.linkedin.com/in/adam-davidson-a774a9118/";
    });

    const content = new ContentContainerElement("aboutContent", this.view);

    content.setChildren([headerElement, gitHubLink, linkedInLink]);

    return content;
  }
}
