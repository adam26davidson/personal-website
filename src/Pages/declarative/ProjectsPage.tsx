import projectsText from "../projects.txt?raw";
import {
  CMContentLayout,
  CMContentContainer,
  CMHeader,
  CMParagraph,
  CMLink,
} from "../../components/cm";
import type { DeclarativePageProps } from "../ReactPage";

export function ProjectsContent(_props: DeclarativePageProps) {
  return (
    <CMContentLayout>
      <CMContentContainer elementKey="projectsContent">
        <CMHeader elementKey="projectsHeader" text="Projects" />
        <CMParagraph elementKey="projectsText" text={projectsText} />
        <CMLink
          elementKey="harmonyVisualizerLink"
          text="Harmony Visualizer ->"
          animate={false}
          onClick={() => {
            window.location.href =
              "https://adam26davidson.github.io/harmony-visualizer/";
          }}
        />
      </CMContentContainer>
    </CMContentLayout>
  );
}
