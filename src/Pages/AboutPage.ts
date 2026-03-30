import { ContentPage } from "./ContentPage";
import aboutText from "./about.txt?raw";
import { Element } from "@adam26davidson/char-matrix";
import { HeaderElement } from "../MatrixElement/HeaderElement";
import { ParagraphElement } from "../MatrixElement/ParagraphElement";
import { ContentContainerElement } from "../MatrixElement/ContentContainerElement";
import { LinkElement } from "../MatrixElement/LinkElement";

export class AboutPage extends ContentPage {
  protected getContent(): Element {
    const headerElement = new HeaderElement(
      "aboutHeader",
      "About Me",
      this.view,
    );

    const textElement = new ParagraphElement(
      "aboutText",
      aboutText,
      1,
      this.view
    );

    const aboutThisSiteLink = new LinkElement(
      "aboutThisSiteLink",
      "About This Site ->",
      this.view,
      false
    );

    aboutThisSiteLink.setOnClick(() => {
      this.setPage("aboutThisSite");
    });

    const professionalExperienceLink = new LinkElement(
      "professionalExperienceLink",
      "Professional Experience ->",
      this.view,
      false
    );

    professionalExperienceLink.setOnClick(() => {
      this.setPage("professionalExperience");
    });

    const content = new ContentContainerElement("aboutContent", this.view);

    content.setChildren([
      headerElement,
      textElement,
      aboutThisSiteLink,
      professionalExperienceLink,
    ]);

    return content;
  }
}
