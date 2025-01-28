import { ContentPage } from "./ContentPage";
import projectsText from "./projects.txt?raw";
import { ParagraphElement } from "../MatrixElement/ParagraphElement";
import { Element } from "../MatrixElement/Element";
import { HeaderElement } from "../MatrixElement/HeaderElement";
import { ContentContainerElement } from "../MatrixElement/ContentContainerElement";
import { LinkElement } from "../MatrixElement/LinkElement";

export class ProjectsPage extends ContentPage {
  protected getContent(): Element {
    const headerElement = new HeaderElement(
      "projectsHeader",
      "Projects",
      this.view
    );

    const textElement = new ParagraphElement(
      "projectsText",
      projectsText,
      1,
      this.view
    );

    const harmonyVisualizerLink = new LinkElement(
      "harmonyVisualizerLink",
      "Harmony Visualizer ->",
      this.view,
      false
    );

    harmonyVisualizerLink.setOnClick(() => {
      window.location.href =
        "https://adam26davidson.github.io/harmony-visualizer/";
    });

    const content = new ContentContainerElement("projectsContent", this.view);

    content.setChildren([headerElement, textElement, harmonyVisualizerLink]);

    return content;
  }
}
