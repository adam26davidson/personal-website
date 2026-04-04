import professionalExperienceText from "../professional_experience.txt?raw";
import {
  CMContentLayout,
  CMContentContainer,
  CMHeader,
  CMParagraph,
} from "../../components/cm";
import type { DeclarativePageProps } from "../ReactPage";

export function ProfessionalExperienceContent(_props: DeclarativePageProps) {
  return (
    <CMContentLayout>
      <CMContentContainer elementKey="professionalExperienceContent">
        <CMHeader
          elementKey="professionalExperienceHeader"
          text="Professional Experience"
        />
        <CMParagraph
          elementKey="professionalExperienceText"
          text={professionalExperienceText}
        />
      </CMContentContainer>
    </CMContentLayout>
  );
}
