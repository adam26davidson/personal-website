import { DOT_CHAR } from "@adam26davidson/char-matrix";
import { useMatrixView, CMLink } from "../../components/cm";
import { LINKS } from "../Page";
import type { DeclarativePageProps } from "../ReactPage";

export function MobileNavContent(_props: DeclarativePageProps) {
  const { setPage } = useMatrixView();

  return (
    <cm-container
      elementKey="mainContainer"
      mainAxis="x"
      widthType="relative"
      heightType="relative"
      width={1}
      height={1}
      alignItems="center"
      justifyContent="center"
      backgroundChar={DOT_CHAR}
    >
      <cm-container
        elementKey="contentContainer"
        mainAxis="y"
        backgroundChar={DOT_CHAR}
        spacing={1}
        entranceTiming="series"
        exitTiming="parallel"
      >
        <cm-container
          elementKey="linkContainer"
          mainAxis="y"
          spacing={1}
          alignItems="center"
          justifyContent="center"
          backgroundChar={DOT_CHAR}
          entranceTiming="parallel"
          exitTiming="parallel"
        >
          {LINKS.map((link) => (
            <CMLink
              key={link.key}
              elementKey={link.key}
              text={link.title}
              onClick={() => setPage(link.key)}
            />
          ))}
        </cm-container>
      </cm-container>
    </cm-container>
  );
}
