import { ContentPage } from "./ContentPage";
import professionalExperienceText from "./professional_experience.txt?raw";
import { ParagraphElement, Element, HeaderElement } from "char-matrix";
import { ContentContainerElement } from "../MatrixElement/ContentContainerElement";

export class ProfessionalExperiencePage extends ContentPage {
  protected getContent(): Element {
    const headerElement = new HeaderElement(
      "professionalExperienceHeader",
      "Professional Experience",
      this.view
    );

    const textElement = new ParagraphElement(
      "professionalExperienceText",
      professionalExperienceText,
      1,
      this.view
    );

    const content = new ContentContainerElement(
      "professionalExperienceContent",
      this.view
    );

    content.setChildren([headerElement, textElement]);

    return content;
  }
}
