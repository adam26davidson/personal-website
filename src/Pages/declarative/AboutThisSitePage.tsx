import aboutThisSiteText from "../about_this_site.txt?raw";
import {
  CMContentLayout,
  CMContentContainer,
  CMHeader,
  CMParagraph,
} from "../../components/cm";
import type { DeclarativePageProps } from "../ReactPage";

export function AboutThisSiteContent(_props: DeclarativePageProps) {
  return (
    <CMContentLayout>
      <CMContentContainer elementKey="aboutThisSiteContent">
        <CMHeader elementKey="aboutThisSiteHeader" text="About This Site" />
        <CMParagraph elementKey="aboutThisSiteText" text={aboutThisSiteText} />
      </CMContentContainer>
    </CMContentLayout>
  );
}
