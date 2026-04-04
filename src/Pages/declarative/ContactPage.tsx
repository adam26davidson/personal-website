import {
  CMContentLayout,
  CMContentContainer,
  CMHeader,
  CMLink,
} from "../../components/cm";
import type { DeclarativePageProps } from "../ReactPage";

export function ContactContent(_props: DeclarativePageProps) {
  return (
    <CMContentLayout>
      <CMContentContainer elementKey="aboutContent">
        <CMHeader elementKey="contactHeader" text="Contact" />
        <CMLink
          elementKey="githubLink"
          text="GitHub ->"
          animate={false}
          onClick={() => {
            window.location.href = "https://github.com/adam26davidson";
          }}
        />
        <CMLink
          elementKey="linkedInLink"
          text="LinkedIn ->"
          animate={false}
          onClick={() => {
            window.location.href =
              "https://www.linkedin.com/in/adam-davidson-a774a9118/";
          }}
        />
      </CMContentContainer>
    </CMContentLayout>
  );
}
