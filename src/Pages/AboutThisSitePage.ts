import { ContentPage } from "./ContentPage";
import aboutThisSiteText from "./about_this_site.txt?raw";
import { ParagraphElement } from "../MatrixElement/ParagraphElement";
import { Element } from "../MatrixElement/Element";
import { HeaderElement } from "../MatrixElement/HeaderElement";
import { ContentContainerElement } from "../MatrixElement/ContentContainerElement";

export class AboutThisSitePage extends ContentPage {
  protected getContent(): Element {
    const headerElement = new HeaderElement(
      "aboutThisSiteHeader",
      "About This Site",
      this.view
    );

    const textElement = new ParagraphElement(
      "aboutThisSiteText",
      aboutThisSiteText,
      1,
      this.view
    );

    const content = new ContentContainerElement(
      "aboutThisSiteContent",
      this.view
    );

    content.setChildren([headerElement, textElement]);

    return content;
  }
}
