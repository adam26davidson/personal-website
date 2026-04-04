import aboutText from "../about.txt?raw";
import {
  CMContentLayout,
  CMContentContainer,
  CMHeader,
  CMParagraph,
  CMLink,
} from "../../components/cm";
import { useMatrixView } from "../../components/cm/MatrixViewContext";
import type { DeclarativePageProps } from "../ReactPage";

export function AboutContent(_props: DeclarativePageProps) {
  const { setPage } = useMatrixView();

  return (
    <CMContentLayout>
      <CMContentContainer elementKey="aboutContent">
        <CMHeader elementKey="aboutHeader" text="About Me" />
        <CMParagraph elementKey="aboutText" text={aboutText} />
        <CMParagraph
          elementKey="japaneseTest"
          text="これはテストです。ひらがなとカタカナの表示をテストしています。★☆♠♣"
        />
        <CMLink
          elementKey="aboutThisSiteLink"
          text="About This Site ->"
          animate={false}
          onClick={() => setPage("aboutThisSite")}
        />
        <CMLink
          elementKey="professionalExperienceLink"
          text="Professional Experience ->"
          animate={false}
          onClick={() => setPage("professionalExperience")}
        />
      </CMContentContainer>
    </CMContentLayout>
  );
}
